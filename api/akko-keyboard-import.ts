import { fetchAkkoProductsPage, fetchAllAkkoKeyboards } from '../src/lib/akko/client';
import type { AkkoParsedProduct } from '../src/lib/akko/types';

type RequestBody = {
  action?: 'fetch_page' | 'fetch_all' | 'fetch_range';
  page?: number;
  perPage?: number;
  pageRange?: string;
};

export default async function handler(
  req: { method?: string; body?: unknown },
  res: { status: (code: number) => { json: (data: object) => void } }
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body: RequestBody;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  try {
    // 1. Fetch All mode
    if (body.action === 'fetch_all' || body.pageRange === 'all') {
      const { total, products } = await fetchAllAkkoKeyboards();
      res.status(200).json({
        success: true,
        requestedPageRange: 'all',
        startPage: 1,
        endPage: Math.ceil(total / 100),
        expectedCount: total,
        fetchedCount: products.length,
        sourcePages: Math.ceil(total / 100),
        products,
      });
      return;
    }

    // 2. Fetch specific page (WooCommerce Store API pages have 100 or custom perPage)
    if (body.action === 'fetch_page') {
      const page = Math.max(1, body.page || 1);
      const perPage = Math.min(100, Math.max(1, body.perPage || 100));
      const pageResult = await fetchAkkoProductsPage(page, perPage);

      res.status(200).json({
        success: true,
        requestedPageRange: String(page),
        startPage: page,
        endPage: page,
        expectedCount: pageResult.totalProducts,
        fetchedCount: pageResult.parsedProducts.length,
        sourcePages: 1,
        totalPages: pageResult.totalPages,
        totalProducts: pageResult.totalProducts,
        products: pageResult.parsedProducts,
      });
      return;
    }

    // 3. Page range mode (e.g. "1" or "1-4" or legacy "2-5")
    const pageRangeStr = String(body.pageRange ?? '1').trim();
    const rangeMatch = pageRangeStr.match(/^(\d+)(?:\s*-\s*(\d+))?$/);

    if (!rangeMatch) {
      res.status(400).json({ error: 'Định dạng trang không hợp lệ. Ví dụ: "1" hoặc "1-4" hoặc "all".' });
      return;
    }

    const startPage = Number.parseInt(rangeMatch[1], 10);
    const endPage = rangeMatch[2] ? Number.parseInt(rangeMatch[2], 10) : startPage;

    if (startPage < 1 || endPage < startPage) {
      res.status(400).json({ error: 'Khoảng trang không hợp lệ (trang bắt đầu phải >= 1 và <= trang kết thúc).' });
      return;
    }

    const allProducts: AkkoParsedProduct[] = [];
    let totalProducts = 0;
    let totalPages = 1;

    for (let p = startPage; p <= endPage; p += 1) {
      const pageResult = await fetchAkkoProductsPage(p, 100);
      totalProducts = pageResult.totalProducts;
      totalPages = pageResult.totalPages;
      allProducts.push(...pageResult.parsedProducts);

      if (p >= pageResult.totalPages) break;
    }

    const baseTimestamp = Date.now();
    for (let i = 0; i < allProducts.length; i += 1) {
      allProducts[i].created_at = new Date(baseTimestamp - ((startPage - 1) * 100 + i) * 60000).toISOString();
    }

    res.status(200).json({
      success: true,
      requestedPageRange: pageRangeStr,
      startPage,
      endPage,
      totalPages,
      totalProducts,
      expectedCount: totalProducts,
      fetchedCount: allProducts.length,
      sourcePages: Math.min(endPage, totalPages) - startPage + 1,
      products: allProducts,
    });
  } catch (error) {
    console.error('akko-keyboard-import error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Không thể lấy dữ liệu từ Akko API',
    });
  }
}