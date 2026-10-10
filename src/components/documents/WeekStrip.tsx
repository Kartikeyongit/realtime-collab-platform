'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

function dayStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Last-7-days journal strip. Dots mark days with a note; click opens
 * (or creates) that day's journal via /api/documents/daily.
 */
export function WeekStrip() {
  const router = useRouter();
  const [presence, setPresence] = useState<Record<string, string>>({});
  const [opening, setOpening] = useState<string | null>(null);

  const days: Date[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  useEffect(() => {
    const from = dayStr(days[0]);
    const to = dayStr(days[days.length - 1]);
    axios
      .get(`/api/documents/daily?from=${from}&to=${to}`)
      .then(({ data }) => setPresence(data.presence || {}))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // toast handled by caller page if needed; stay silent here
    } finally {
      setOpening(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {days.map((d) => {
        const ds = dayStr(d);
        const isToday = ds === dayStr(new Date());
        const has = !!presence[ds];
        return (
          <button
            key={ds}
            onClick={() => openDay(ds)}
            disabled={opening === ds}
            title={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            style={{
              width: 44,
              padding: '6px 0 5px',
              borderRadius: 12,
              border: isToday ? '1.5px solid #f97316' : '1.5px solid #e7e5e4',
              background: isToday ? '#fff7ed' : 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, color: isToday ? '#c2410c' : '#a8a29e', textTransform: 'uppercase' }}>
              {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#292524' }}>{d.getDate()}</span>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: has ? '#16a34a' : '#e7e5e4',
                marginTop: 1,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
