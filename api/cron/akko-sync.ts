import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchAllAkkoKeyboards } from '../../src/lib/akko/client';
import type { AkkoParsedProduct } from '../../src/lib/akko/types';

function getAdminFirestore() {
  if (getApps().length === 0) {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountRaw) {
      throw new Error(
        'Missing FIREBASE_SERVICE_ACCOUNT environment variable. Please generate a Service Account private key in Firebase Console and set it in Vercel Environment Variables.'
      );
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } catch {
      // In case it was base64 encoded
      try {
        serviceAccount = JSON.parse(Buffer.from(serviceAccountRaw, 'base64').toString('utf8'));
      } catch (parseError) {
        throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ' + (parseError instanceof Error ? parseError.message : 'Invalid JSON'));
      }
    }

    if (serviceAccount && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

const normalizeName = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

export default async function handler(
  req: { method?: string; headers?: Record<string, string | undefined> },
  res: { status: (code: number) => { json: (data: object) => void } }
) {
  // Allow GET (standard Vercel Cron) and POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Optional: check CRON_SECRET if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers?.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized cron trigger' });
    return;
  }

  const startedAt = new Date().toISOString();
  console.log(`[AkkoSyncCron] Started at ${startedAt}`);

  let db;
  try {
    db = getAdminFirestore();
  } catch (initError) {
    console.error('[AkkoSyncCron] Firebase Admin init failed:', initError);
    res.status(500).json({
      success: false,
      error: initError instanceof Error ? initError.message : 'Firebase Admin init failed',
    });
    return;
  }

  try {
    // 1. Fetch all products from Akko Store API
    const { total, products: incomingProducts } = await fetchAllAkkoKeyboards();
    console.log(`[AkkoSyncCron] Fetched ${incomingProducts.length} keyboards from Akko.`);

    // 2. Fetch all existing keyboard products from Firestore
    const productsColl = db.collection('products');
    const existingSnapshot = await productsColl.where('category', '==', 'keyboard').get();

    const bySourceId = new Map<number | string, FirebaseFirestore.QueryDocumentSnapshot>();
    const byName = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();

    existingSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.source_id) {
        bySourceId.set(data.source_id, docSnap);
      }
      if (data.name) {
        byName.set(normalizeName(data.name), docSnap);
      }
    });

    const matchedExistingIds = new Set<string>();
    const toCreate: AkkoParsedProduct[] = [];
    const toUpdate: Array<{ docRef: FirebaseFirestore.DocumentReference; updates: Record<string, unknown> }> = [];

    // 3. Classify into new or update
    for (const incoming of incomingProducts) {
      let match = incoming.source_id ? bySourceId.get(incoming.source_id) : undefined;
      if (!match) {
        match = byName.get(normalizeName(incoming.name));
      }

      if (match) {
        matchedExistingIds.add(match.id);
        const matchData = match.data();

        const updates: Record<string, unknown> = {
          price_vnd: incoming.price_vnd,
          price_virtual: incoming.price_virtual,
          original_price_vnd: incoming.original_price_vnd,
          discount: incoming.discount,
          stock_status: incoming.stock_status,
          source: 'akko',
          source_id: incoming.source_id,
          source_url: incoming.source_url,
          source_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // If existing product had empty specs, enrich
        if (!matchData.specs || Object.keys(matchData.specs).length === 0) {
          updates.specs = incoming.specs;
        }
        if (!matchData.features || matchData.features.length === 0) {
          updates.features = incoming.features;
        }
        if (!matchData.variants || matchData.variants.length === 0) {
          updates.variants = incoming.variants;
        }

        toUpdate.push({ docRef: match.ref, updates });
      } else {
        toCreate.push(incoming);
      }
    }

    // 4. Mark removed Akko products as out_of_stock (never delete)
    const toMarkOutOfStock: FirebaseFirestore.DocumentReference[] = [];
    existingSnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        (data.source === 'akko' || data.brand?.toLowerCase() === 'akko') &&
        !matchedExistingIds.has(docSnap.id) &&
        data.stock_status !== 'out_of_stock'
      ) {
        toMarkOutOfStock.push(docSnap.ref);
      }
    });

    // 5. Commit in batches of 400 (Firestore Admin limit is 500)
    const batchSize = 400;

    // Creates (reverse to commit oldest first, newest last)
    const chronologicalToCreate = [...toCreate].reverse();
    for (let i = 0; i < chronologicalToCreate.length; i += batchSize) {
      const chunk = chronologicalToCreate.slice(i, i + batchSize);
      const batch = db.batch();
      for (const item of chunk) {
        const newRef = productsColl.doc();
        const cleaned = Object.fromEntries(
          Object.entries({
            ...item,
            created_at: item.created_at || new Date().toISOString(),
          }).filter(([, val]) => val !== undefined)
        );
        batch.set(newRef, cleaned);
      }
      await batch.commit();
    }

    // Updates
    for (let i = 0; i < toUpdate.length; i += batchSize) {
      const chunk = toUpdate.slice(i, i + batchSize);
      const batch = db.batch();
      for (const { docRef, updates } of chunk) {
        const cleaned = Object.fromEntries(
          Object.entries(updates).filter(([, val]) => val !== undefined)
        );
        batch.update(docRef, cleaned);
      }
      await batch.commit();
    }

    // Out of stock
    for (let i = 0; i < toMarkOutOfStock.length; i += batchSize) {
      const chunk = toMarkOutOfStock.slice(i, i + batchSize);
      const batch = db.batch();
      for (const docRef of chunk) {
        batch.update(docRef, {
          stock_status: 'out_of_stock',
          source_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      await batch.commit();
    }

    const completedAt = new Date().toISOString();
    const message = `Đồng bộ hoàn tất: ${toCreate.length} sản phẩm mới, ${toUpdate.length} cập nhật giá/tồn kho, ${toMarkOutOfStock.length} đánh dấu hết hàng.`;

    // 6. Record to scrape_logs collection
    await db.collection('scrape_logs').add({
      source: 'akko',
      type: 'cron',
      status: 'success',
      started_at: startedAt,
      completed_at: completedAt,
      total_scanned: total,
      new_count: toCreate.length,
      updated_count: toUpdate.length,
      out_of_stock_count: toMarkOutOfStock.length,
      error_count: 0,
      errors: [],
      message,
    });

    console.log(`[AkkoSyncCron] ${message}`);
    res.status(200).json({
      success: true,
      startedAt,
      completedAt,
      totalScanned: total,
      newCount: toCreate.length,
      updatedCount: toUpdate.length,
      outOfStockCount: toMarkOutOfStock.length,
      message,
    });
  } catch (syncError) {
    const errorMsg = syncError instanceof Error ? syncError.message : 'Unknown sync error';
    console.error('[AkkoSyncCron] Failed:', syncError);

    try {
      await db.collection('scrape_logs').add({
        source: 'akko',
        type: 'cron',
        status: 'failed',
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        total_scanned: 0,
        new_count: 0,
        updated_count: 0,
        out_of_stock_count: 0,
        error_count: 1,
        errors: [errorMsg],
        message: `Đồng bộ thất bại: ${errorMsg}`,
      });
    } catch {
      // ignore
    }

    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
}
