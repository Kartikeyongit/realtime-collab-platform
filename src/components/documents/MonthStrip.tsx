'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function dayStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Month calendar of journal notes. Dots mark days with a note; click opens
 * (or creates) that day's journal via /api/documents/daily.
 */
export function MonthStrip() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [presence, setPresence] = useState<Record<string, string>>({});
  const [opening, setOpening] = useState<string | null>(null);

  const todayStr = dayStr(new Date());
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const atPresentMonth = year === now.getFullYear() && month === now.getMonth();

  useEffect(() => {
    const from = dayStr(new Date(year, month, 1));
    const to = dayStr(new Date(year, month, daysInMonth));
    axios
      .get(`/api/documents/daily?from=${from}&to=${to}`)
      .then(({ data }) => setPresence(data.presence || {}))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const openDay = async (ds: string) => {
    if (presence[ds]) {
      router.push(`/documents/${presence[ds]}`);
      return;
    }
    setOpening(ds);
    try {
      const { data } = await axios.get(`/api/documents/daily?date=${ds}`);
      setPresence((p) => ({ ...p, [ds]: data.document.id }));
      router.push(`/documents/${data.document.id}`);
    } catch {
      // stay silent; user stays on dashboard
    } finally {
      setOpening(null);
    }
  };

  const cells: Array<{ key: string; day: number | null; ds: string | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ key: `blank-${i}`, day: null, ds: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dayStr(new Date(year, month, d));
    cells.push({ key: ds, day: d, ds });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, marginRight: 'auto' }}>{monthLabel}</span>
        <button onClick={() => shift(-1)} title="Previous month" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#78716c', padding: 5, borderRadius: 8, display: 'inline-flex' }}>
          <ChevronLeft size={15} />
        </button>
        {!atPresentMonth && (
          <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} title="Back to this month" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f97316', fontSize: 12, fontWeight: 700, padding: '5px 8px' }}>
            Today
          </button>
        )}
        <button onClick={() => shift(1)} title="Next month" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#78716c', padding: 5, borderRadius: 8, display: 'inline-flex' }}>
          <ChevronRight size={15} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#a8a29e', paddingBottom: 2 }}>{w}</div>
        ))}
        {cells.map((c) => {
          if (c.day === null || !c.ds) return <span key={c.key} />;
          const ds = c.ds;
          const isToday = ds === todayStr;
          const has = !!presence[ds];
          const future = ds > todayStr;
          return (
            <button
              key={c.key}
              onClick={() => openDay(ds)}
              disabled={opening === ds}
              title={new Date(year, month, c.day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              style={{
                border: isToday ? '1.5px solid #f97316' : '1.5px solid #e7e5e4',
                background: isToday ? '#fff7ed' : 'white',
                opacity: future && !has ? 0.55 : 1,
                borderRadius: 10,
                cursor: 'pointer',
                padding: '5px 0 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#c2410c' : '#292524' }}>{c.day}</span>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: has ? '#16a34a' : '#e7e5e4' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
