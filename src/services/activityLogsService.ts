import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  limit,
  onSnapshot,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ActivityLog } from '../types';

// Activity Logs Service
export class ActivityLogsService {
  private static collection = collection(db, 'activityLogs');

  // Add activity log
  static async addLog(log: Omit<ActivityLog, 'id'>): Promise<string> {
    const docRef = await addDoc(this.collection, {
      ...log,
      timestamp: new Date().toISOString()
    });
    
    return docRef.id;
  }

  // Get recent activity logs (limit to specific number)
  static async getRecentLogs(limitCount: number = 15): Promise<ActivityLog[]> {
    const q = query(
      this.collection, 
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityLog[];
  }

  // Subscribe to activity logs with real-time updates
  static subscribeToLogs(limitCount: number = 15, callback: (logs: ActivityLog[]) => void) {
    const q = query(
      this.collection, 
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      
      callback(logs);
    });
  }

  // Subscribe to all logs within the last N months (real-time)
  static subscribeToLogsSince(months: number, callback: (logs: ActivityLog[]) => void) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const q = query(
      this.collection,
      where('timestamp', '>=', since.toISOString()),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[]);
    });
  }
}
