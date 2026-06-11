import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Product } from '../types';
import { ActivityLogsService } from './activityLogsService';

// Products Service
export class ProductsService {
  private static collection = collection(db, 'products');

  // Get all products with real-time updates
  static subscribeToProducts(callback: (products: Product[]) => void) {
    const q = query(this.collection, orderBy('created_at', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      callback(products);
    });
  }

  // Get paginated products (for initial load and lazy loading)
  static async getPaginatedProducts(
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ products: Product[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    let q = query(
      this.collection, 
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );
    
    if (lastDoc) {
      q = query(
        this.collection,
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { products, lastDoc: lastVisible };
  }

  // Get products by category
  static async getProductsByCategory(category: string): Promise<Product[]> {
    const q = query(this.collection, where('category', '==', category));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  }

  // Get featured products
  static async getFeaturedProducts(): Promise<Product[]> {
    const q = query(this.collection, where('featured', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  }

  // Get single product by ID (optimized for detail page)
  static async getProduct(id: string): Promise<Product | null> {
    const docRef = doc(this.collection, id);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Product;
    }
    
    return null;
  }

  // Get single product by ID (alias for clarity)
  static async getProductById(id: string): Promise<Product | null> {
    return this.getProduct(id);
  }

  // Get multiple products by IDs (for featured/related products)
  static async getProductsByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    
    const promises = ids.map(id => this.getProductById(id));
    const results = await Promise.all(promises);
    
    return results.filter((p): p is Product => p !== null);
  }

  // Get products by category (lightweight, no realtime)
  static async getProductsByCategoryOptimized(
    category: string,
    limit_count: number = 20
  ): Promise<Product[]> {
    const q = query(
      this.collection,
      where('category', '==', category),
      orderBy('created_at', 'desc'),
      limit(limit_count)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  }

  // Get paginated products by category
  static async getPaginatedProductsByCategory(
    category: string,
    pageSize: number = 12,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ products: Product[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    // Query without orderBy to avoid index requirement
    // Sort client-side instead
    let q = query(
      this.collection,
      where('category', '==', category),
      limit(pageSize * 2) // Get more to ensure enough after filtering
    );
    
    if (lastDoc) {
      q = query(
        this.collection,
        where('category', '==', category),
        startAfter(lastDoc),
        limit(pageSize * 2)
      );
    }
    
    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    
    // Sort by created_at descending on client side
    products = products.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    }).slice(0, pageSize);
    
    const lastVisible = snapshot.docs[Math.min(pageSize - 1, snapshot.docs.length - 1)] || null;
    
    return { products, lastDoc: lastVisible };
  }

  // Get product counts by category with real-time listener
  static subscribeToProductCounts(callback: (counts: Record<string, number>, total: number) => void) {
    const q = query(this.collection);
    
    return onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const product = doc.data() as Product;
        const category = product.category;
        counts[category] = (counts[category] || 0) + 1;
      });
      
      const total = snapshot.size;
      callback(counts, total);
    });
  }

  // Get product counts by category (one-time fetch)
  static async getProductCountsByCategory(): Promise<Record<string, number>> {
    const snapshot = await getDocs(this.collection);
    const counts: Record<string, number> = {};
    
    snapshot.docs.forEach(doc => {
      const product = doc.data() as Product;
      const category = product.category;
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
  }

  // Subscribe to products in a category with real-time updates
  static subscribeToProductsByCategory(
    category: string,
    callback: (products: Product[]) => void,
    limitCount: number = 100
  ) {
    let q;
    if (category === 'all') {
      q = query(this.collection, limit(limitCount));
    } else {
      q = query(this.collection, where('category', '==', category), limit(limitCount));
    }
    
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Sort by created_at descending
      products.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      callback(products);
    });
  }

  // Get total products count
  static async getTotalProductsCount(): Promise<number> {
    const snapshot = await getDocs(this.collection);
    return snapshot.size;
  }

  // Create product
  static async createProduct(product: Omit<Product, 'id'>): Promise<string> {
    try {
      // Remove undefined fields (Firebase doesn't accept undefined)
      const cleanedProduct = Object.fromEntries(
        Object.entries({
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).filter(([, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(this.collection, cleanedProduct);
      
      // Log activity
      await ActivityLogsService.addLog({
        action: 'create',
        productId: docRef.id,
        productName: product.name,
        timestamp: new Date().toISOString(),
        category: product.category,
        details: `Đã thêm sản phẩm mới`
      });
      
      return docRef.id;
    } catch (error) {
      console.error('FirebaseService - Error creating product:', error);
      throw error;
    }
  }

  // Update product
  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(this.collection, id);
      
      // Get product name for logging
      const productDoc = await getDoc(docRef);
      const productName = productDoc.exists() ? (productDoc.data() as Product).name : 'Unknown';
      
      // Remove undefined fields (Firebase doesn't accept undefined)
      const cleanedUpdates = Object.fromEntries(
        Object.entries({
          ...updates,
          updated_at: new Date().toISOString()
        }).filter(([, value]) => value !== undefined)
      );
      
      await updateDoc(docRef, cleanedUpdates);
      
      // Log activity
      await ActivityLogsService.addLog({
        action: 'update',
        productId: id,
        productName,
        timestamp: new Date().toISOString(),
        details: `Đã cập nhật sản phẩm`
      });
    } catch (error) {
      console.error('FirebaseService - Error updating product:', error);
      throw error;
    }
  }

  // Delete product
  static async deleteProduct(id: string): Promise<void> {
    const docRef = doc(this.collection, id);
    
    // Get product info before deletion
    const productDoc = await getDoc(docRef);
    const productName = productDoc.exists() ? (productDoc.data() as Product).name : 'Unknown';
    const category = productDoc.exists() ? (productDoc.data() as Product).category : undefined;
    
    await deleteDoc(docRef);
    
    // Log activity
    await ActivityLogsService.addLog({
      action: 'delete',
      productId: id,
      productName,
      timestamp: new Date().toISOString(),
      category,
      details: `Đã xóa sản phẩm`
    });
  }

  // Bulk delete products
  static async deleteProducts(ids: string[]): Promise<{ success: string[], failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };
    
    // Delete products in parallel
    await Promise.all(
      ids.map(async (id) => {
        try {
          await this.deleteProduct(id);
          results.success.push(id);
        } catch (error) {
          console.error(`Failed to delete product ${id}:`, error);
          results.failed.push(id);
        }
      })
    );
    
    return results;
  }

  // Bulk create products (for import)
  static async bulkCreateProducts(
    products: Omit<Product, 'id'>[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: string[], failed: Array<{ index: number, error: string }> }> {
    const results = { 
      success: [] as string[], 
      failed: [] as Array<{ index: number, error: string }> 
    };
    
    // Process products sequentially to avoid rate limiting
    for (let i = 0; i < products.length; i++) {
      try {
        const productId = await this.createProduct(products[i]);
        results.success.push(productId);
        
        if (onProgress) {
          onProgress(i + 1, products.length);
        }
      } catch (error) {
        console.error(`Failed to create product at index ${i}:`, error);
        results.failed.push({ 
          index: i, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        if (onProgress) {
          onProgress(i + 1, products.length);
        }
      }
    }
    
    // Log bulk import activity
    await ActivityLogsService.addLog({
      action: 'create',
      productId: 'bulk_import',
      productName: `Bulk Import (${results.success.length} products)`,
      timestamp: new Date().toISOString(),
      details: `Imported ${results.success.length} products successfully, ${results.failed.length} failed`
    });
    
    return results;
  }

  // Upload product images
  static async uploadImages(files: File[], productId: string): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `products/${productId}/image_${index}_${Date.now()}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    });

    return await Promise.all(uploadPromises);
  }

  // Delete product images
  static async deleteImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map(async (url) => {
      try {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Failed to delete image:', url, error);
      }
    });

    await Promise.all(deletePromises);
  }
}

// Categories Service
export class CategoriesService {
  private static collection = collection(db, 'categories');

  // Get all categories
  static async getCategories() {
    const snapshot = await getDocs(this.collection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '',
      description: doc.data().description || '',
      icon: doc.data().icon || '',
      type: doc.data().type || 'physical',
      subcategories: doc.data().subcategories || [],
      ...doc.data()
    }));
  }

  // Subscribe to categories changes
  static subscribeToCategories(callback: (categories: Array<Record<string, unknown>>) => void) {
    return onSnapshot(this.collection, (snapshot) => {
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        description: doc.data().description || '',
        icon: doc.data().icon || '',
        type: doc.data().type || 'physical',
        subcategories: doc.data().subcategories || [],
        ...doc.data()
      }));
      
      callback(categories);
    });
  }
}

// Featured Products Configuration Service
export class FeaturedService {
  private static docRef = doc(db, 'config', 'featured');

  // Get featured configuration
  static async getFeaturedConfig() {
    const snapshot = await getDoc(this.docRef);
    
    if (snapshot.exists()) {
      return snapshot.data();
    }
    
    return {
      featuredProducts: [],
      freeDigitalProducts: []
    };
  }

  // Update featured products
  static async updateFeaturedProducts(productIds: string[]): Promise<void> {
    // Get current featured products to determine changes
    const currentConfig = await this.getFeaturedConfig();
    const currentFeatured = currentConfig.featuredProducts || [];
    
    await updateDoc(this.docRef, {
      featuredProducts: productIds,
      updatedAt: new Date().toISOString()
    });

    // Update featured flag on products
    const productsCollection = collection(db, 'products');
    const allProductsSnapshot = await getDocs(productsCollection);
    
    const updatePromises = allProductsSnapshot.docs.map(async (productDoc) => {
      const productData = productDoc.data() as Product;
      const isNowFeatured = productIds.includes(productDoc.id);
      const wasFeatured = currentFeatured.includes(productDoc.id);
      
      await updateDoc(doc(productsCollection, productDoc.id), {
        featured: isNowFeatured
      });
      
      // Log activity for featured/unfeatured changes
      if (isNowFeatured && !wasFeatured) {
        await ActivityLogsService.addLog({
          action: 'feature',
          productId: productDoc.id,
          productName: productData.name,
          timestamp: new Date().toISOString(),
          category: productData.category,
          details: `Đã đặt làm sản phẩm nổi bật`
        });
      } else if (!isNowFeatured && wasFeatured) {
        await ActivityLogsService.addLog({
          action: 'unfeature',
          productId: productDoc.id,
          productName: productData.name,
          timestamp: new Date().toISOString(),
          category: productData.category,
          details: `Đã bỏ khỏi danh sách nổi bật`
        });
      }
    });

    await Promise.all(updatePromises);
  }

  // Update free digital products
  static async updateFreeDigitalProducts(productIds: string[]): Promise<void> {
    await updateDoc(this.docRef, {
      freeDigitalProducts: productIds,
      updatedAt: new Date().toISOString()
    });

    // Update is_free flag on digital products
    const productsCollection = collection(db, 'products');
    const digitalProductsQuery = query(
      productsCollection, 
      where('type', '==', 'digital')
    );
    const digitalProductsSnapshot = await getDocs(digitalProductsQuery);
    
    const updatePromises = digitalProductsSnapshot.docs.map(async (productDoc) => {
      const isNowFree = productIds.includes(productDoc.id);
      await updateDoc(doc(productsCollection, productDoc.id), {
        is_free: isNowFree
      });
    });

    await Promise.all(updatePromises);
  }

  // Subscribe to featured config changes
  static subscribeToFeaturedConfig(callback: (config: {featuredProducts: string[]; freeDigitalProducts: string[]; updatedAt?: string}) => void) {
    return onSnapshot(this.docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          featuredProducts: data.featuredProducts || [],
          freeDigitalProducts: data.freeDigitalProducts || [],
          updatedAt: data.updatedAt
        });
      } else {
        callback({
          featuredProducts: [],
          freeDigitalProducts: []
        });
      }
    });
  }
}

// Admin Authentication Service
export class AdminAuthService {
  private static docRef = doc(db, 'admin', 'credentials');

  // Validate admin credentials
  static async validateCredentials(username: string, password: string): Promise<boolean> {
    try {
      const snapshot = await getDoc(this.docRef);

      if (snapshot.exists()) {
        const adminData = snapshot.data();
        return adminData.username === username && adminData.password === password;
      }

      return false;
    } catch (error) {
      console.error('Error validating credentials:', error);
      return false;
    }
  }

  // Update admin credentials
  static async updateCredentials(newCredentials: {
    username?: string;
    password?: string;
    email?: string;
  }): Promise<void> {
    await updateDoc(this.docRef, {
      ...newCredentials,
      updatedAt: new Date().toISOString()
    });
  }

  // Update last login
  static async updateLastLogin(): Promise<void> {
    await updateDoc(this.docRef, {
      lastLogin: new Date().toISOString()
    });
  }
}

// Site Configuration Service
export class SiteConfigService {
  private static docRef = doc(db, 'config', 'site');

  // Get site configuration
  static async getSiteConfig() {
    try {
      const snapshot = await getDoc(this.docRef);
      
      if (snapshot.exists()) {
        return snapshot.data();
      }
      
      // Return default config if not exists
      return {
        site: {
          name: 'Fbox Shop',
          tagline: 'Gaming & Digital Store',
          description: 'Your one-stop shop for gaming peripherals and digital products',
            hero_product_ids: [],
          currency: {
            primary: 'VNĐ',
            virtual: 'UPoints'
          }
        },
        contact: {
          email: 'contact@uside.shop',
          phone: '+84 123 456 789',
          address: 'Vietnam'
        },
        social: {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: ''
        }
      };
    } catch (error) {
      console.error('Error getting site config:', error);
      throw error;
    }
  }

  // Subscribe to site config changes
  static subscribeToSiteConfig(callback: (config: Record<string, unknown>) => void) {
    return onSnapshot(this.docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      } else {
        // Return default config
        callback({
          site: {
            name: 'Fbox Shop',
            tagline: 'Gaming & Digital Store',
            description: 'Your one-stop shop for gaming peripherals and digital products',
            hero_product_ids: [],
            currency: {
              primary: 'VNĐ',
              virtual: 'UPoints'
            }
          },
          contact: {
            email: 'contact@uside.shop',
            phone: '+84 123 456 789',
            address: 'Vietnam'
          },
          social: {
            facebook: '',
            instagram: '',
            twitter: '',
            youtube: ''
          }
        });
      }
    });
  }

  // Update site configuration
  static async updateSiteConfig(config: Record<string, unknown>): Promise<void> {
    await updateDoc(this.docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    });
  }
}