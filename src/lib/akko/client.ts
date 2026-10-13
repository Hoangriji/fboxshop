import type { AkkoRawProduct, AkkoParsedProduct } from './types';
import { transformAkkoProduct } from './parser';

export const AKKO_KEYBOARD_CATEGORY_ID = 17;
export const AKKO_API_BASE = 'https://akko.vn/wp-json/wc/store/v1';

export interface AkkoFetchPageResult {
  page: number;
  perPage: number;
  totalProducts: number;
  totalPages: number;
  rawProducts: AkkoRawProduct[];
  parsedProducts: AkkoParsedProduct[];
}

export async function fetchAkkoProductsPage(
  page: number = 1,
  perPage: number = 100
): Promise<AkkoFetchPageResult> {
  const url = `${AKKO_API_BASE}/products?category=${AKKO_KEYBOARD_CATEGORY_ID}&per_page=${perPage}&page=${page}&orderby=date&order=desc`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Akko API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const totalProducts = Number.parseInt(response.headers.get('x-wp-total') || '0', 10);
  const totalPages = Number.parseInt(response.headers.get('x-wp-totalpages') || '1', 10);
  const rawProducts = (await response.json()) as AkkoRawProduct[];
  const parsedProducts = rawProducts.map(transformAkkoProduct);

  // Assign created_at based on offset and index so newest items have newer timestamps
  const baseTimestamp = Date.now();
  const offset = (page - 1) * perPage;
  for (let i = 0; i < parsedProducts.length; i += 1) {
    parsedProducts[i].created_at = new Date(baseTimestamp - (offset + i) * 60000).toISOString();
  }

  return {
    page,
    perPage,
    totalProducts,
    totalPages,
    rawProducts,
    parsedProducts,
  };
}

export async function fetchAllAkkoKeyboards(
  onProgress?: (loaded: number, total: number, page: number, totalPages: number) => void
): Promise<{ total: number; products: AkkoParsedProduct[] }> {
  // 1. Fetch first page to know total pages
  const firstPage = await fetchAkkoProductsPage(1, 100);
  const allProducts: AkkoParsedProduct[] = [...firstPage.parsedProducts];
  const totalPages = firstPage.totalPages;
  const totalCount = firstPage.totalProducts || firstPage.rawProducts.length;

  if (onProgress) {
    onProgress(allProducts.length, totalCount, 1, totalPages);
  }

  // 2. Fetch remaining pages
  for (let page = 2; page <= totalPages; page += 1) {
    const pageResult = await fetchAkkoProductsPage(page, 100);
    allProducts.push(...pageResult.parsedProducts);
    if (onProgress) {
      onProgress(allProducts.length, totalCount, page, totalPages);
    }
  }

  // Ensure strict chronological ordering from newest (index 0) to oldest (index N - 1)
  const baseTimestamp = Date.now();
  for (let i = 0; i < allProducts.length; i += 1) {
    allProducts[i].created_at = new Date(baseTimestamp - i * 60000).toISOString();
  }

  return {
    total: allProducts.length,
    products: allProducts,
  };
}
