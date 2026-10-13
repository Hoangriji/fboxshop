import React, { useEffect, useMemo, useState } from 'react';
import { ActivityLogsService } from '../../../services/activityLogsService';
import type { ActivityLog } from '../../../types';
import './ActivityHistory.css';

const MONTHS = 2;

const ACTION_STYLES: Record<string, { color: string; icon: string; text: string }> = {
  create: { color: '#10b981', icon: 'fa-plus-circle', text: 'Thêm mới' },
  update: { color: '#3b82f6', icon: 'fa-edit', text: 'Cập nhật' },
  delete: { color: '#ef4444', icon: 'fa-trash-alt', text: 'Xóa' },
  feature: { color: '#f59e0b', icon: 'fa-star', text: 'Đặt nổi bật' },
  unfeature: { color: '#6b7280', icon: 'fa-star-half-alt', text: 'Bỏ nổi bật' },
};
const DEFAULT_STYLE = { color: '#a855f7', icon: 'fa-info-circle', text: 'Khác' };
const getStyle = (action: string) => ACTION_STYLES[action] || DEFAULT_STYLE;

const toDate = (ts: unknown): Date => {
  if (ts && typeof ts === 'object' && 'toDate' in ts) return (ts as { toDate: () => Date }).toDate();
  return new Date(ts as string);
};

const dayLabel = (d: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ActivityHistory: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = ActivityLogsService.subscribeToLogsSince(MONTHS, (data) => {
        setLogs(data);
        setLoading(false);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được lịch sử');
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    logs.forEach(l => { c[l.action] = (c[l.action] || 0) + 1; });
    return c;
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(l =>
      (actionFilter === 'all' || l.action === actionFilter) &&
      (!q || l.productName?.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q))
    );
  }, [logs, search, actionFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: ActivityLog[] }>();
    filtered.forEach(l => {
      const d = toDate(l.timestamp);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, { label: dayLabel(d), items: [] });
      map.get(key)!.items.push(l);
    });
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div className="activity-history">
      <div className="ah-header">
        <div>
          <h2><i className="fa-solid fa-clock-rotate-left"></i> Lịch sử thao tác</h2>
          <p>Toàn bộ thao tác trong {MONTHS} tháng gần nhất · {logs.length} thao tác</p>
        </div>
      </div>

      <div className="ah-toolbar">
        <div className="ah-search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            id="activity-history-search"
            type="text"
            placeholder="Tìm theo tên sản phẩm, chi tiết..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ah-filters">
          <button
            id="ah-filter-all"
            className={`ah-chip ${actionFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActionFilter('all')}
          >
            Tất cả <span>{logs.length}</span>
          </button>
          {Object.entries(ACTION_STYLES).map(([key, s]) => (
            <button
              key={key}
              id={`ah-filter-${key}`}
              className={`ah-chip ${actionFilter === key ? 'active' : ''}`}
              style={{ '--chip-color': s.color } as React.CSSProperties}
              onClick={() => setActionFilter(key)}
            >
              <i className={`fas ${s.icon}`}></i> {s.text} <span>{counts[key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="ah-empty"><i className="fas fa-spinner fa-spin"></i><p>Đang tải...</p></div>
      ) : error ? (
        <div className="ah-empty"><i className="fas fa-triangle-exclamation"></i><p>{error}</p></div>
      ) : groups.length === 0 ? (
        <div className="ah-empty"><i className="fas fa-inbox"></i><p>Không có thao tác nào</p></div>
      ) : (
        <div className="ah-timeline">
          {groups.map(g => (
            <section key={g.label} className="ah-group">
              <h3 className="ah-day">{g.label} <span>{g.items.length}</span></h3>
              <ul>
                {g.items.map(log => {
                  const s = getStyle(log.action);
                  const d = toDate(log.timestamp);
                  return (
                    <li key={log.id} className="ah-item" style={{ '--item-color': s.color } as React.CSSProperties}>
                      <div className="ah-icon"><i className={`fas ${s.icon}`}></i></div>
                      <div className="ah-body">
                        <div className="ah-row">
                          <span className="ah-action">{s.text}</span>
                          <time>{d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time>
                        </div>
                        <p className="ah-product">{log.productName}</p>
                        {log.details && <span className="ah-desc">{log.details}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityHistory;
