import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ScrapeLog } from '../types';

export class ScrapeLogsService {
  private static collection = collection(db, 'scrape_logs');

  // Get recent scrape logs
  static async getLogs(maxCount: number = 20): Promise<ScrapeLog[]> {
    try {
      const q = query(this.collection, orderBy('started_at', 'desc'), firestoreLimit(maxCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ScrapeLog[];
    } catch (error) {
      console.error('ScrapeLogsService - Error getting logs:', error);
      return [];
    }
  }

  // Add new scrape log
  static async addLog(logData: Omit<ScrapeLog, 'id'>): Promise<string> {
    try {
      const cleaned = Object.fromEntries(
        Object.entries(logData).filter(([, value]) => value !== undefined)
      );
      const docRef = await addDoc(this.collection, cleaned);
      return docRef.id;
    } catch (error) {
      console.error('ScrapeLogsService - Error adding log:', error);
      throw error;
    }
  }
}
