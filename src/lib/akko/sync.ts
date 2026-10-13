import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Product, ScrapeLog } from '../../types';
import type { AkkoParsedProduct } from './types';
import { ScrapeLogsService } from '../../services/scrapeLogsService';

export interface SyncAkkoResult {
  totalScanned: number;
  newCount: number;
  updatedCount: number;
  outOfStockCount: number;
  errorCount: number;
  errors: string[];
}

export const normalizeName = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Syncs Akko products with Firestore database.
 * Follows user preferences:
 * - Existing products: updates price + stock_status + source tracking, preserves user edits.
 * - New products: created with full parsed specs & features.
 * - Removed products: marked as 'out_of_stock' (never deleted).
 */
export async function syncAkkoProductsWithFirestore(
  incomingProducts: AkkoParsedProduct[],
  type: 'manual' | 'cron' = 'manual',
  onProgress?: (progress: { stage: string; current: number; total: number }) => void
): Promise<SyncAkkoResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  try {
    // 1. Fetch all current keyboard products
    if (onProgress) onProgress({ stage: 'Đang kiểm tra sản phẩm hiện có...', current: 0, total: 1 });
    const productsColl = collection(db, 'products');
    const q = query(productsColl, where('category', '==', 'keyboard'));
    const snapshot = await getDocs(q);

    const existingProducts = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Product[];

    // Index existing by source_id and normalized name
    const bySourceId = new Map<number | string, Product>();
    const byName = new Map<string, Product>();

    for (const p of existingProducts) {
      if (p.source_id) {
        bySourceId.set(p.source_id, p);
      }
      byName.set(normalizeName(p.name), p);
    }

    const matchedExistingIds = new Set<string>();
    const toCreate: AkkoParsedProduct[] = [];
    const toUpdate: Array<{ id: string; updates: Partial<Product> }> = [];

    // 2. Classify incoming products
    for (const incoming of incomingProducts) {
      // Find match
      let match = incoming.source_id ? bySourceId.get(incoming.source_id) : undefined;
      if (!match) {
        match = byName.get(normalizeName(incoming.name));
      }

      if (match) {
        matchedExistingIds.add(match.id);
        // Build updates (preserve manual edits, update price & stock)
        const updates: Partial<Product> = {
          price_vnd: incoming.price_vnd,
          price_virtual: incoming.price_virtual,
          original_price_vnd: incoming.original_price_vnd,
          discount: incoming.discount,
          stock_status: incoming.stock_status,
          source: 'akko',
          source_id: incoming.source_id,
          source_url: incoming.source_url,
          source_synced_at: new Date().toISOString(),
        };

        // If existing product had empty specs, enrich with newly parsed specs
        if (!match.specs || Object.keys(match.specs).length === 0) {
          updates.specs = incoming.specs;
        }
        if (!match.features || match.features.length === 0) {
          updates.features = incoming.features;
        }
        if (!match.variants || match.variants.length === 0) {
          updates.variants = incoming.variants;
        }

        toUpdate.push({ id: match.id, updates });
      } else {
        toCreate.push(incoming);
      }
    }

    // 3. Mark removed Akko products as out_of_stock
    const toMarkOutOfStock: Product[] = [];
    for (const existing of existingProducts) {
      if (
        (existing.source === 'akko' || existing.brand?.toLowerCase() === 'akko') &&
        !matchedExistingIds.has(existing.id) &&
        existing.stock_status !== 'out_of_stock'
      ) {
        toMarkOutOfStock.push(existing);
      }
    }

    // 4. Commit writes in chunks of 100
    const totalOperations = toCreate.length + toUpdate.length + toMarkOutOfStock.length;
    let completedOps = 0;

    // Apply creations (reverse so oldest are committed first and newest last)
    const chronologicalToCreate = [...toCreate].reverse();
    const batchSize = 100;
    for (let i = 0; i < chronologicalToCreate.length; i += batchSize) {
      const chunk = chronologicalToCreate.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(productsColl);
        const cleaned = Object.fromEntries(
          Object.entries({
            ...item,
            created_at: item.created_at || new Date().toISOString(),
          }).filter(([, val]) => val !== undefined)
        );
        batch.set(docRef, cleaned);
      }
      await batch.commit();
      completedOps += chunk.length;
      if (onProgress) {
        onProgress({ stage: 'Đang thêm sản phẩm mới...', current: completedOps, total: totalOperations });
      }
    }

    // Apply updates
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const chunk = toUpdate.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const { id, updates } of chunk) {
        const docRef = doc(productsColl, id);
        const cleaned = Object.fromEntries(
          Object.entries({
            ...updates,
            updated_at: new Date().toISOString()
          }).filter(([, val]) => val !== undefined)
        );
        batch.update(docRef, cleaned);
      }
      await batch.commit();
      completedOps += chunk.length;
      if (onProgress) {
        onProgress({ stage: 'Đang cập nhật giá & tồn kho...', current: completedOps, total: totalOperations });
      }
    }

    // Apply out of stock markings
    for (let i = 0; i < toMarkOutOfStock.length; i += batchSize) {
      const chunk = toMarkOutOfStock.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const p of chunk) {
        const docRef = doc(productsColl, p.id);
        batch.update(docRef, {
          stock_status: 'out_of_stock',
          source_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      await batch.commit();
      completedOps += chunk.length;
      if (onProgress) {
        onProgress({ stage: 'Đang cập nhật trạng thái hết hàng...', current: completedOps, total: totalOperations });
      }
    }

    const completedAt = new Date().toISOString();
    const result: SyncAkkoResult = {
      totalScanned: incomingProducts.length,
      newCount: toCreate.length,
      updatedCount: toUpdate.length,
      outOfStockCount: toMarkOutOfStock.length,
      errorCount: errors.length,
      errors,
    };

    // 5. Log this scrape operation
    const logData: Omit<ScrapeLog, 'id'> = {
      source: 'akko',
      type,
      status: errors.length > 0 ? 'partial' : 'success',
      started_at: startedAt,
      completed_at: completedAt,
      total_scanned: incomingProducts.length,
      new_count: toCreate.length,
      updated_count: toUpdate.length,
      out_of_stock_count: toMarkOutOfStock.length,
      error_count: errors.length,
      errors: errors.slice(0, 10),
      message: `Đồng bộ hoàn tất: ${toCreate.length} mới, ${toUpdate.length} cập nhật, ${toMarkOutOfStock.length} hết hàng.`
    };
    await ScrapeLogsService.addLog(logData).catch(err => {
      console.warn('Could not record scrape log:', err);
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    errors.push(message);
    const completedAt = new Date().toISOString();

    await ScrapeLogsService.addLog({
      source: 'akko',
      type,
      status: 'failed',
      started_at: startedAt,
      completed_at: completedAt,
      total_scanned: incomingProducts.length,
      new_count: 0,
      updated_count: 0,
      out_of_stock_count: 0,
      error_count: 1,
      errors: [message],
      message: `Đồng bộ thất bại: ${message}`
    }).catch(() => {});

    throw error;
  }
}
