import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentData, Query, QuerySnapshot } from 'firebase/firestore';
import { getDocs, onSnapshot } from 'firebase/firestore';

type MapSnapshot<T> = (snapshot: QuerySnapshot<DocumentData>) => T[];

interface UseFirestoreListOptions<T> {
  enabled?: boolean;
  realtime?: boolean;
  mapSnapshot?: MapSnapshot<T>;
  initialData?: T[];
}

interface UseFirestoreListResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

const defaultMapSnapshot = <T,>(snapshot: QuerySnapshot<DocumentData>) => {
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};

export const useFirestoreList = <T,>(
  queryFactory: () => Query<DocumentData>,
  options: UseFirestoreListOptions<T> = {}
): UseFirestoreListResult<T> => {
  const {
    enabled = true,
    realtime = true,
    mapSnapshot,
    initialData = [],
  } = options;

  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const mapFn = useMemo(() => mapSnapshot ?? defaultMapSnapshot<T>, [mapSnapshot]);
  const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const query = queryFactory();

    if (realtime) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = onSnapshot(
        query,
        (snapshot) => {
          if (!active) return;
          setData(mapFn(snapshot));
          setLoading(false);
        },
        (err) => {
          if (!active) return;
          setError(err);
          setLoading(false);
        }
      );

      return () => {
        active = false;
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }

    getDocs(query)
      .then((snapshot) => {
        if (!active) return;
        setData(mapFn(snapshot));
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, realtime, refreshKey, queryFactory, mapFn]);

  return { data, loading, error, refresh };
};
