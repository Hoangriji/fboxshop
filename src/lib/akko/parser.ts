import type { AkkoRawProduct, AkkoParsedProduct } from './types';

export function decodeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSpecKey(rawKey: string): string {
  const k = rawKey.trim();
  const lower = k.toLowerCase();
  if (lower === 'model' || lower.startsWith('model:')) return 'Model';
  if (lower.includes('kết nối') || lower.includes('kiểu kết nối') || lower.includes('3 chế độ kết nối')) return 'Kết nối';
  if (lower.includes('loại switch') || lower === 'switch' || lower === 'switches') return 'Switch';
  if (lower === 'keycap' || lower === 'keycaps') return 'Keycap';
  if (lower === 'kích thước') return 'Kích thước';
  if (lower === 'trọng lượng') return 'Trọng lượng';
  if (lower.includes('tương thích')) return 'Tương thích';
  if (lower.includes('pin') || lower.includes('dung lượng pin')) return 'Dung lượng pin';
  if (lower.includes('led') || lower.includes('hệ thống led') || lower.includes('đèn nền')) return 'LED';
  if (lower.includes('hotswap') || lower.includes('tính năng hotswap')) return 'Hotswap';
  if (lower.includes('cấu trúc') || lower.includes('gasket')) return 'Cấu trúc';
  if (lower.includes('vỏ case') || lower.includes('chất liệu vỏ') || lower === 'vỏ') return 'Chất liệu vỏ';
  if (lower.includes('phụ kiện')) return 'Phụ kiện';
  if (lower.includes('phần mềm') || lower.includes('driver')) return 'Phần mềm';
  if (lower.includes('polling rate')) return 'Polling Rate';
  return k;
}

export function parseSpecsAndFeatures(
  descriptionHtml: string,
  shortDescHtml: string = '',
  attributes: AkkoRawProduct['attributes'] = []
): { specs: Record<string, string>; features: string[] } {
  const specs: Record<string, string> = {};
  const features: string[] = [];

  const html = descriptionHtml || shortDescHtml || '';

  // 1. Table parsing (modern Akko format)
  if (/<table/i.test(html)) {
    const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    for (const r of rowMatches) {
      const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => decodeHtml(c[1]));
      if (cells.length >= 2 && cells[0] && cells[1]) {
        const normKey = normalizeSpecKey(cells[0]);
        if (!specs[normKey]) {
          specs[normKey] = cells[1];
        }
      }
    }
  }

  // 2. Line parsing (li, p, br, headers)
  const lines = html
    .replace(/<\/p>|<\/li>|<br\s*\/?>|<\/tr>/gi, '\n')
    .split('\n')
    .map(decodeHtml)
    .filter(Boolean);

  for (const line of lines) {
    if (/thông số\s*(kĩ|kỹ)\s*thuật/i.test(line)) continue;
    if (/^https?:\/\//i.test(line)) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx > 1 && colonIdx < 55) {
      const rawKey = line.slice(0, colonIdx).trim();
      const rawVal = line.slice(colonIdx + 1).trim();
      const kLower = rawKey.toLowerCase();

      // Skip non-spec / promotional lines
      if (['khuyến mại', 'khuyến mãi', 'lưu ý', 'cách 1', 'cách 2', 'video', 'link', 'hướng dẫn', 'bước 1', 'bước 2'].includes(kLower)) {
        continue;
      }

      if (rawVal) {
        // Handle combined "Kích thước: ... | Trọng lượng: ..."
        if (kLower.includes('kích thước') && rawVal.includes('|')) {
          const parts = rawVal.split('|');
          const dim = parts[0].trim();
          if (dim && !specs['Kích thước']) specs['Kích thước'] = dim;
          if (parts[1]) {
            const wMatch = parts[1].match(/trọng lượng\s*[:~-]?\s*(.+)/i);
            const weight = (wMatch ? wMatch[1] : parts[1]).trim();
            if (weight && !specs['Trọng lượng']) specs['Trọng lượng'] = weight;
          }
          continue;
        }

        const normKey = normalizeSpecKey(rawKey);
        if (!specs[normKey]) {
          specs[normKey] = rawVal;
        }
        continue;
      }
    }

    // Capture standout feature bullets
    if (line.length >= 8 && line.length <= 150 && !line.includes('http') && !/freeship|bảo hành\s*1\s*đổi\s*1/i.test(line)) {
      if (!features.includes(line) && features.length < 8) {
        features.push(line);
      }
    }
  }

  // 3. Fallback to attributes if switch not found
  if (!specs['Switch']) {
    const switchAttr = attributes.find(a => /switch/i.test(a.name));
    if (switchAttr && switchAttr.terms && switchAttr.terms.length > 0) {
      specs['Switch'] = switchAttr.terms.map(t => t.name).join(', ');
    }
  }

  return { specs, features };
}

export function detectFormFactor(name: string, model: string = '', specs: Record<string, string> = {}): string {
  const combined = `${name} ${model} ${specs['Model'] || ''}`.toLowerCase();
  if (combined.includes('alice') || combined.includes('ergo')) return 'Alice/Ergonomic';
  if (combined.includes('108') || combined.includes('fullsize') || combined.includes('104 keys') || combined.includes('108 keys')) return 'Fullsize (100%)';
  if (combined.includes('98 keys') || combined.includes('96%') || combined.includes('3098')) return '96% / 1800-Compact';
  if (combined.includes('87 keys') || combined.includes('tkl') || combined.includes('3087') || combined.includes('tenkeyless')) return 'TKL (80%)';
  if (combined.includes('84 keys') || combined.includes('75%') || combined.includes('5075') || combined.includes('3084') || combined.includes('mod 007')) return '75%';
  if (combined.includes('68 keys') || combined.includes('65%') || combined.includes('3068')) return '65%';
  if (combined.includes('61 keys') || combined.includes('60%') || combined.includes('3061')) return '60%';
  return 'Standard';
}

export function detectConnectionTypes(specs: Record<string, string>, name: string): string[] {
  const text = `${specs['Kết nối'] || ''} ${name}`.toLowerCase();
  const types: string[] = [];
  if (text.includes('bluetooth')) types.push('Bluetooth');
  if (text.includes('2.4g') || text.includes('wireless') || text.includes('không dây')) types.push('Wireless 2.4Ghz');
  if (text.includes('type c') || text.includes('type-c') || text.includes('usb')) types.push('USB Type-C');
  if (types.length === 0) types.push('Có dây');
  return types;
}

export function detectLedType(specs: Record<string, string>, name: string): string {
  const text = `${specs['LED'] || ''} ${specs['Hệ thống led'] || ''} ${name}`.toLowerCase();
  if (text.includes('rgb')) return 'RGB';
  if (text.includes('đơn sắc') || text.includes('trắng') || text.includes('white led')) return 'Đơn sắc';
  if (text.includes('không led') || text.includes('non-led') || text.includes('no led')) return 'Không LED';
  return 'RGB';
}

export function detectCompatibility(specs: Record<string, string>): string[] {
  const text = (specs['Tương thích'] || '').toLowerCase();
  const comp: string[] = [];
  if (text.includes('win')) comp.push('Windows');
  if (text.includes('mac')) comp.push('macOS');
  if (text.includes('linux')) comp.push('Linux');
  if (text.includes('ios')) comp.push('iOS');
  if (text.includes('android')) comp.push('Android');
  if (comp.length === 0) return ['Windows', 'macOS'];
  return comp;
}

export function createTextDescription(raw: AkkoRawProduct, specs: Record<string, string>): string {
  // Extract text from short_description excluding promotional text
  if (raw.short_description) {
    const cleaned = decodeHtml(raw.short_description)
      .replace(/khuyến mãi[\s\S]*$/i, '')
      .replace(/khuyến mại[\s\S]*$/i, '')
      .replace(/freeship[\s\S]*$/i, '')
      .trim();
    if (cleaned.length > 20) return cleaned;
  }

  // Fallback: construct clear summary from parsed specs
  const parts: string[] = [];
  if (specs['Model']) parts.push(`Model: ${specs['Model']}`);
  if (specs['Kết nối']) parts.push(`Kết nối: ${specs['Kết nối']}`);
  if (specs['Switch']) parts.push(`Switch: ${specs['Switch']}`);
  if (specs['Keycap']) parts.push(`Keycap: ${specs['Keycap']}`);
  if (specs['LED']) parts.push(`LED: ${specs['LED']}`);

  if (parts.length > 0) {
    return `Bàn phím cơ AKKO chính hãng. ${parts.join(' | ')}.`;
  }

  return `${decodeHtml(raw.name)} - Bàn phím cơ AKKO chính hãng với thiết kế độc đáo và độ bền cao.`;
}

export function transformAkkoProduct(raw: AkkoRawProduct): AkkoParsedProduct {
  const { specs, features } = parseSpecsAndFeatures(raw.description, raw.short_description, raw.attributes);

  // Price parsing
  const regularPrice = Number.parseInt(raw.prices.regular_price || raw.prices.price, 10) || 0;
  const salePrice = Number.parseInt(raw.prices.sale_price || raw.prices.price, 10) || regularPrice;
  const finalOriginalPrice = regularPrice > 0 ? regularPrice : salePrice;
  const discount = finalOriginalPrice > salePrice && finalOriginalPrice > 0
    ? Math.round(((finalOriginalPrice - salePrice) / finalOriginalPrice) * 100)
    : 0;

  // Images: get best quality src
  const images = raw.images && raw.images.length > 0
    ? raw.images.map(img => img.src)
    : [];

  // Variants from attributes
  const variants = raw.attributes?.map(attr => ({
    id: attr.id,
    name: attr.name,
    options: attr.terms?.map(t => t.name) || [],
  })) || [];

  const cleanName = decodeHtml(raw.name);
  const formFactor = detectFormFactor(cleanName, specs['Model'], specs);
  const connectionTypes = detectConnectionTypes(specs, cleanName);
  const ledType = detectLedType(specs, cleanName);
  const compatibility = detectCompatibility(specs);
  const description = createTextDescription(raw, specs);

  return {
    name: cleanName,
    description,
    images,
    price_vnd: salePrice,
    price_virtual: Math.round(salePrice / 1000),
    original_price_vnd: finalOriginalPrice,
    category: 'keyboard',
    subcategory: 'Mechanical Keyboard',
    tags: raw.categories?.map(c => decodeHtml(c.name)) || ['AKKO', 'Keyboard'],
    type: 'physical',
    stock_status: raw.is_in_stock ? 'in_stock' : 'out_of_stock',
    featured: false,
    sku: raw.sku || '',
    brand: 'AKKO',
    specs,
    features,
    connection_types: connectionTypes,
    compatibility,
    form_factor: formFactor,
    led_type: ledType,
    review_count: 0,
    discount,
    variants,
    source: 'akko',
    source_id: raw.id,
    source_url: raw.permalink,
    source_synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}
