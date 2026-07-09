type RequestBody = {
  pageRange?: string;
};

type ListingProduct = {
  url: string;
  name: string;
  stockStatus: 'in_stock' | 'out_of_stock';
  listingPrices: number[];
  thumbnail?: string;
};

type AkkoProductPayload = {
  name: string;
  description: string;
  images: string[];
  price_vnd: number;
  price_virtual: number;
  original_price_vnd: number;
  category: string;
  subcategory: string;
  tags: string[];
  type: 'physical';
  stock_status: 'in_stock' | 'out_of_stock';
  featured: false;
  brand: string;
  connection_types: string[];
  compatibility: string[];
  form_factor: string;
  led_type: string;
  features: string[];
  specs: Record<string, string>;
  review_count: number;
  discount: number;
  sku: string;
  source_url: string;
};

const PAGE_SIZE = 12;
const MAX_PAGE = 27;

export default async function handler(req: { method?: string; body?: unknown }, res: {
  status: (code: number) => { json: (data: object) => void };
}) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body: RequestBody;
  try {
    body = readBody(req.body);
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  let pageRange: { startPage: number; endPage: number; normalizedRange: string };
  try {
    pageRange = parsePageRangeInput(body.pageRange);
  } catch (rangeError) {
    res.status(400).json({ error: rangeError instanceof Error ? rangeError.message : 'pageRange không hợp lệ' });
    return;
  }

  try {
    const result = await crawlAkkoKeyboards(pageRange.startPage, pageRange.endPage, pageRange.normalizedRange);
    res.status(200).json(result);
  } catch (error) {
    console.error('akko-keyboard-import failed', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Không thể lấy dữ liệu Akko' });
  }
}

const readBody = (body: unknown): RequestBody => {
  if (typeof body === 'string') {
    return JSON.parse(body) as RequestBody;
  }
  return (body ?? {}) as RequestBody;
};

const parsePageRangeInput = (rawValue: unknown): { startPage: number; endPage: number; normalizedRange: string } => {
  const raw = String(rawValue ?? '').trim();
  if (!raw) {
    throw new Error('Vui lòng nhập trang cần lấy. Ví dụ: "2" hoặc "2-5".');
  }

  const singlePattern = /^(\d+)$/;
  const rangePattern = /^(\d+)\s*-\s*(\d+)$/;

  let startPage = 0;
  let endPage = 0;

  const singleMatch = raw.match(singlePattern);
  if (singleMatch) {
    startPage = Number.parseInt(singleMatch[1], 10);
    endPage = startPage;
  } else {
    const rangeMatch = raw.match(rangePattern);
    if (!rangeMatch) {
      throw new Error('Định dạng trang không hợp lệ. Dùng "2" hoặc "2-5".');
    }
    startPage = Number.parseInt(rangeMatch[1], 10);
    endPage = Number.parseInt(rangeMatch[2], 10);
  }

  if (startPage < 1 || endPage < 1) {
    throw new Error('Số trang phải bắt đầu từ 1.');
  }
  if (startPage > endPage) {
    throw new Error('Khoảng trang không hợp lệ: trang bắt đầu phải nhỏ hơn hoặc bằng trang kết thúc.');
  }
  if (endPage > MAX_PAGE) {
    throw new Error(`Akko keyboard hiện hỗ trợ tối đa trang ${MAX_PAGE}.`);
  }

  return {
    startPage,
    endPage,
    normalizedRange: startPage === endPage ? String(startPage) : `${startPage}-${endPage}`,
  };
};

const crawlAkkoKeyboards = async (startPage: number, endPage: number, normalizedRange: string) => {
  const listingProducts: ListingProduct[] = [];
  const seenUrls = new Set<string>();
  let pagesScanned = 0;

  for (let page = startPage; page <= endPage; page += 1) {
    const pageUrl = page === 1
      ? 'https://akko.vn/keyboard/'
      : `https://akko.vn/keyboard/page/${page}/`;

    const html = await fetchText(pageUrl);
    const pageProducts = parseListingProducts(html);
    pagesScanned += 1;

    if (pageProducts.length === 0) {
      continue;
    }

    pageProducts.forEach((item) => {
      if (!seenUrls.has(item.url)) {
        listingProducts.push(item);
        seenUrls.add(item.url);
      }
    });
  }

  const details = await mapWithConcurrency(listingProducts, 4, async (item) => parseProductDetail(item));

  return {
    requestedPageRange: normalizedRange,
    startPage,
    endPage,
    pageSize: PAGE_SIZE,
    expectedCount: (endPage - startPage + 1) * PAGE_SIZE,
    fetchedCount: details.length,
    sourcePages: pagesScanned,
    products: details,
  };
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; uside-shop-bot/1.0; +https://akko.vn/keyboard/)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Không thể tải ${url} (${response.status})`);
  }
  return response.text();
};

const parseListingProducts = (html: string): ListingProduct[] => {
  const cards = [...html.matchAll(/<div class="product-small col[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi)];

  return cards.map((cardMatch) => {
    const block = cardMatch[0];
    const url = findFirst(block, /<a href="(https:\/\/akko\.vn\/[^"]+)"/i);
    if (!url) {
      return null;
    }

    const rawName = findFirst(
      block,
      /woocommerce-loop-product__title"><a[^>]*>([\s\S]*?)<\/a>/i
    );
    const name = decodeHtmlEntities(stripHtml(rawName));

    const listingPrices = extractPriceNumbers(block);
    const stockStatus = /out-of-stock|outofstock|Hết hàng/i.test(block) ? 'out_of_stock' : 'in_stock';
    const thumbnail = findFirst(block, /data-src="(https:\/\/[^"]+\.(?:png|jpg|jpeg|webp))"/i);

    return {
      url,
      name,
      stockStatus,
      listingPrices,
      thumbnail,
    } as ListingProduct;
  }).filter((item): item is ListingProduct => Boolean(item));
};

const parseProductDetail = async (listing: ListingProduct): Promise<AkkoProductPayload> => {
  const html = await fetchText(listing.url);
  const schemaProduct = extractSchemaProduct(html);
  const specs = extractSpecs(html);

  const shortDescription = extractShortDescription(html);
  const schemaName = typeof schemaProduct?.name === 'string' ? decodeHtmlEntities(schemaProduct.name) : '';
  const name = schemaName || listing.name;

  const { original: origFromHtml, sale: saleFromHtml } = extractWooPrices(html);
  const fallbackPrice = listing.listingPrices[listing.listingPrices.length - 1] ?? listing.listingPrices[0] ?? extractSchemaPrice(schemaProduct) ?? 0;

  const price_vnd = saleFromHtml > 0 ? saleFromHtml : fallbackPrice;
  const original_price_vnd = origFromHtml > 0 ? origFromHtml : (price_vnd > 0 ? Math.max(origFromHtml, price_vnd) : fallbackPrice);
  const normalizedOriginal = Math.max(original_price_vnd, price_vnd);

  const stock_status = extractStockStatus(schemaProduct) ?? listing.stockStatus;
  const images = extractImages(html, schemaProduct, listing.thumbnail);
  const connection_types = extractConnectionTypes(specs);
  const compatibility = extractCompatibility(specs);
  const led_type = findSpecValue(specs, ['LED']) ?? '';
  const form_factor = findSpecValue(specs, ['Layout', 'Form Factor']) ?? '';
  const features = buildFeatures(specs, name);
  const tags = buildTags(name, specs);
  const sku = extractSku(html, schemaProduct);
  const review_count = extractReviewCount(schemaProduct);

  const description = buildDescription(shortDescription, features, specs, connection_types, led_type);
  const discount = normalizedOriginal > price_vnd
    ? Math.round(((normalizedOriginal - price_vnd) / normalizedOriginal) * 100)
    : 0;

  return {
    name,
    description,
    images,
    price_vnd,
    price_virtual: price_vnd,
    original_price_vnd: normalizedOriginal,
    category: 'keyboard',
    subcategory: 'keyboard',
    tags,
    type: 'physical',
    stock_status,
    featured: false,
    brand: 'AKKO',
    connection_types,
    compatibility,
    form_factor,
    led_type,
    features,
    specs,
    review_count,
    discount,
    sku,
    source_url: listing.url,
  };
};

const extractSchemaProduct = (html: string): Record<string, unknown> | null => {
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];

  for (const script of scripts) {
    const raw = script[1]?.trim();
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const product = findProductNode(parsed);
      if (product) {
        return product;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const findProductNode = (node: unknown): Record<string, unknown> | null => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductNode(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const typeValue = obj['@type'];

    if (typeof typeValue === 'string' && typeValue.toLowerCase() === 'product') {
      return obj;
    }
    if (Array.isArray(typeValue) && typeValue.some((value) => String(value).toLowerCase() === 'product')) {
      return obj;
    }

    if (obj['@graph']) {
      const foundInGraph = findProductNode(obj['@graph']);
      if (foundInGraph) {
        return foundInGraph;
      }
    }

    for (const value of Object.values(obj)) {
      const found = findProductNode(value);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

const extractSchemaPrice = (schemaProduct: Record<string, unknown> | null): number | null => {
  if (!schemaProduct?.offers) {
    return null;
  }

  const offers = Array.isArray(schemaProduct.offers)
    ? schemaProduct.offers
    : [schemaProduct.offers];

  for (const offer of offers) {
    if (offer && typeof offer === 'object') {
      const record = offer as Record<string, unknown>;
      const candidate = toPrice(record.price);
      if (candidate > 0) {
        return candidate;
      }
    }
  }
  return null;
};

const extractStockStatus = (schemaProduct: Record<string, unknown> | null): 'in_stock' | 'out_of_stock' | null => {
  if (!schemaProduct?.offers) {
    return null;
  }

  const offers = Array.isArray(schemaProduct.offers)
    ? schemaProduct.offers
    : [schemaProduct.offers];

  for (const offer of offers) {
    if (offer && typeof offer === 'object') {
      const availability = String((offer as Record<string, unknown>).availability ?? '');
      if (/OutOfStock/i.test(availability)) {
        return 'out_of_stock';
      }
      if (/InStock/i.test(availability)) {
        return 'in_stock';
      }
    }
  }
  return null;
};

const extractReviewCount = (schemaProduct: Record<string, unknown> | null): number => {
  const aggregateRating = schemaProduct?.aggregateRating;
  if (!aggregateRating || typeof aggregateRating !== 'object') {
    return 0;
  }
  const reviewCount = Number((aggregateRating as Record<string, unknown>).reviewCount ?? 0);
  return Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : 0;
};

const extractShortDescription = (html: string): string => {
  const raw = findFirst(html, /woocommerce-product-details__short-description">([\s\S]*?)<\/div>/i) ?? '';
  return normalizeText(raw);
};

const extractSpecs = (html: string): Record<string, string> => {
  const specs: Record<string, string> = {};

  const tableMatch =
    html.match(/<table[^>]*class="[^"]*(?:shop_attributes|woocommerce-product-attributes)[^"]*"[^>]*>([\s\S]*?)<\/table>/i) ||
    html.match(/(?:THÔNG SỐ|SPECIFICATION|CHI TIẾT|THÔNG TIN SẢN PHẨM)[\s\S]{0,800}?<\/h[1-6]>[\s\S]{0,200}?<table[^>]*>([\s\S]*?)<\/table>/i) ||
    html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);

  if (!tableMatch || !tableMatch[1]) {
    return specs;
  }

  const tableBody = tableMatch[1];
  const rows = [...tableBody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  rows.forEach((rowMatch) => {
    const rowContent = rowMatch[1];
    const cells = [...rowContent.matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)];
    if (cells.length >= 2) {
      const key = normalizeText(cells[0][1]);
      const value = normalizeText(cells[1][1]);
      if (key && value) {
        specs[key] = value;
      }
    }
  });

  return specs;
};

const extractConnectionTypes = (specs: Record<string, string>): string[] => {
  const raw = findSpecValue(specs, ['Kết Nối', 'Kết nối', 'Connection']) ?? '';
  if (!raw) {
    return [];
  }

  return splitValues(raw, /\/|\+|,|\|/g);
};

const extractCompatibility = (specs: Record<string, string>): string[] => {
  const raw = findSpecValue(specs, ['Tương Thích', 'Compatibility']) ?? '';
  if (!raw) {
    return [];
  }

  return splitValues(raw, /\/|,|\|/g);
};

const buildFeatures = (
  specs: Record<string, string>,
  name: string
): string[] => {
  const features: string[] = [];
  const hotSwap = findSpecValue(specs, ['Hot Swappable', 'Hot Swap']);
  if (hotSwap) {
    features.push(`Hotswappable${/yes/i.test(hotSwap) ? '' : `: ${hotSwap}`}`);
  }

  const nKey = findSpecValue(specs, ['N-Key Rollover']);
  if (nKey) {
    features.push(`N-Key Rollover${/yes/i.test(nKey) ? '' : `: ${nKey}`}`);
  }

  const keycaps = findSpecValue(specs, ['Keycaps']);
  if (keycaps) {
    features.push(`Keycaps: ${keycaps}`);
  }

  const switches = findSpecValue(specs, ['Switches', 'Switch']);
  if (switches) {
    features.push(`Switch: ${switches}`);
  }

  if (/hotswap/i.test(name) && !features.some((item) => /Hotswappable/i.test(item))) {
    features.push('Hotswappable');
  }

  return dedupe(features).slice(0, 6);
};

const buildTags = (name: string, specs: Record<string, string>): string[] => {
  const tags = ['bàn phím cơ', 'akko', 'keyboard'];
  const model = findSpecValue(specs, ['Model']) ?? '';
  const modelDigits = (model.match(/\b\d{3,4}\b/) ?? [])[0];
  if (modelDigits) {
    tags.push(modelDigits);
  } else {
    const nameDigits = (name.match(/\b\d{3,4}\b/) ?? [])[0];
    if (nameDigits) {
      tags.push(nameDigits);
    }
  }
  if (/hotswap/i.test(name) || /hot swappable/i.test(findSpecValue(specs, ['Hot Swappable']) ?? '')) {
    tags.push('hotswap');
  }

  return dedupe(tags);
};

const buildDescription = (
  shortDescription: string,
  features: string[],
  specs: Record<string, string>,
  connectionTypes: string[],
  ledType: string
): string => {
  const summaryParts: string[] = [];
  if (features.length > 0) {
    summaryParts.push(features.slice(0, 4).join(' / '));
  }
  if (connectionTypes.length > 0) {
    summaryParts.push(`Kết nối: ${connectionTypes.join(' / ')}`);
  }
  if (ledType) {
    summaryParts.push(`Đèn nền: ${ledType}`);
  }

  const compatibility = findSpecValue(specs, ['Tương Thích', 'Compatibility']);
  if (compatibility) {
    summaryParts.push(`Tương thích: ${compatibility}`);
  }

  const summary = summaryParts.join(' • ');
  const description = shortDescription
    ? `${shortDescription}${summary ? ` ${summary}` : ''}`
    : summary;

  return description.trim().slice(0, 1800);
};

const extractImages = (
  html: string,
  schemaProduct: Record<string, unknown> | null,
  thumbnail?: string
): string[] => {
  const result: string[] = [];

  const schemaImage = schemaProduct?.image;
  if (typeof schemaImage === 'string') {
    result.push(schemaImage);
  } else if (Array.isArray(schemaImage)) {
    schemaImage.forEach((item) => {
      if (typeof item === 'string') result.push(item);
    });
  }

  [...html.matchAll(/data-large_image="([^"]+)"/gi)].forEach((m) => result.push(m[1]));

  [...html.matchAll(/woocommerce-product-gallery__image[\s\S]*?<a[^>]+href="([^"]+)"/gi)].forEach((m) => result.push(m[1]));
  [...html.matchAll(/woocommerce-product-gallery__image[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"/gi)].forEach((m) => result.push(m[1]));

  [...html.matchAll(/<a[^>]+href="(https:\/\/[^"]+\.(?:png|jpg|jpeg|webp))"[^>]*data-elementor-open-lightbox/gi)].forEach((m) => result.push(m[1]));

  if (thumbnail) {
    result.push(thumbnail);
  }

  const normalizeImageUrl = (url: string) => {
    return url.replace(/-\d+x\d+(\.[a-z0-9]+)(?:\?|$)/i, '$1');
  };

  const cleaned = dedupe(
    result
      .map((item) => decodeHtmlEntities(item.trim()))
      .map((item) => normalizeImageUrl(item))
      .filter((item) => /^https?:\/\//i.test(item))
      .filter((item) => /\.(?:png|jpg|jpeg|webp)(?:\?|$)/i.test(item))
  );

  return cleaned.slice(0, 20);
};

const extractSku = (html: string, schemaProduct: Record<string, unknown> | null): string => {
  if (typeof schemaProduct?.sku === 'string' || typeof schemaProduct?.sku === 'number') {
    return String(schemaProduct.sku);
  }

  const skuFromHtml = findFirst(html, /sku_wrapper[\s\S]*?<span class="sku">([\s\S]*?)<\/span>/i);
  return normalizeText(skuFromHtml);
};

const findSpecValue = (specs: Record<string, string>, candidates: string[]): string | null => {
  const entries = Object.entries(specs);
  for (const [key, value] of entries) {
    const normalizedKey = normalizeName(key);
    if (candidates.some((candidate) => normalizeName(candidate) === normalizedKey)) {
      return value;
    }
  }
  return null;
};

const splitValues = (raw: string, separator: RegExp): string[] => {
  return dedupe(
    raw
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean)
  );
};

const extractWooPrices = (html: string): { original: number; sale: number } => {
  const delMatch = html.match(/<del[^>]*>[\s\S]*?<bdi>\s*([\d.,]+)/i);
  const insMatch = html.match(/<ins[^>]*>[\s\S]*?<bdi>\s*([\d.,]+)/i);

  if (delMatch && insMatch) {
    return {
      original: toPrice(delMatch[1]),
      sale: toPrice(insMatch[1]),
    };
  }

  const regularMatch =
    html.match(/class="price"[^>]*>[\s\S]*?<bdi>\s*([\d.,]+)/i) ||
    html.match(/<bdi>\s*([\d.,]+)\s*<span class="woocommerce-Price-currencySymbol"/i);

  const price = regularMatch ? toPrice(regularMatch[1]) : 0;
  return { original: price, sale: price };
};

const extractPriceNumbers = (raw: string): number[] => {
  const prices = [...raw.matchAll(/<bdi>\s*([\d.,]+)\s*<span class="woocommerce-Price-currencySymbol"/gi)]
    .map((match) => toPrice(match[1]))
    .filter((price) => price > 0);
  return dedupe(prices);
};

const toPrice = (value: unknown): number => {
  const numeric = String(value ?? '').replace(/[^\d]/g, '');
  if (!numeric) {
    return 0;
  }
  return Number.parseInt(numeric, 10);
};

const stripHtml = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  return value.replace(/<[^>]*>/g, ' ');
};

const normalizeText = (value: string | null | undefined): string => {
  return decodeHtmlEntities(stripHtml(value))
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeName = (value: string): string => value.toLowerCase().trim().replace(/\s+/g, ' ');

const decodeHtmlEntities = (value: string): string => {
  const namedEntities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&#039;': '\'',
    '&#39;': '\'',
    '&lt;': '<',
    '&gt;': '>',
    '&ndash;': '-',
    '&mdash;': '-',
    '&#8211;': '-',
    '&#8212;': '-',
    '&#038;': '&',
  };

  let output = value;
  for (let i = 0; i < 3; i += 1) {
    let changed = false;
    Object.entries(namedEntities).forEach(([entity, replacement]) => {
      if (output.includes(entity)) {
        output = output.split(entity).join(replacement);
        changed = true;
      }
    });

    output = output.replace(/&#(\d+);/g, (_match, code) => {
      changed = true;
      return String.fromCharCode(Number(code));
    });
    output = output.replace(/&#x([0-9a-fA-F]+);/g, (_match, code) => {
      changed = true;
      return String.fromCharCode(Number.parseInt(code, 16));
    });

    if (!changed) {
      break;
    }
  }
  return output;
};

const findFirst = (source: string, pattern: RegExp): string | null => {
  const match = source.match(pattern);
  if (!match || match.length < 2) {
    return null;
  }
  return match[1];
};

const dedupe = <T>(values: T[]): T[] => [...new Set(values)];

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current], current);
    }
  });

  await Promise.all(workers);
  return results;
};
