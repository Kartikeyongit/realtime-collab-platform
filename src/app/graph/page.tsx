'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Share2, Folder as FolderIcon, Unlink, Plus, Minus } from 'lucide-react';
import { showError } from '@/lib/toast';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

interface GraphNode {
  id: string;
  title: string;
  folderId: string | null;
  folderName: string | null;
  links: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

const FOLDER_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#16a34a', '#eab308', '#ec4899', '#06b6d4'];

function colorFor(folderId: string | null): string {
  if (!folderId) return '#a8a29e';
  let h = 0;
  for (let i = 0; i < folderId.length; i++) h = (h * 31 + folderId.charCodeAt(i)) >>> 0;
  return FOLDER_COLORS[h % FOLDER_COLORS.length];
}

function shortTitle(title: string, max = 18): string {
  return title.length > max ? title.slice(0, max - 1) + '…' : title;
}

export default function GraphPage() {
  const { status } = useSession();
  const router = useRouter();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (status !== 'authenticated') return;
    axios
      .get('/api/graph')
      .then(({ data }) => {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        const sorted = [...(data.nodes || [])].sort((a: GraphNode, b: GraphNode) => b.links - a.links);
        setCenterId(sorted[0]?.id ?? null);
      })
      .catch(() => showError('Failed to load graph'))
      .finally(() => setLoading(false));
  }, [status]);

  const neighborhood = useMemo(() => {
    if (!centerId) return { center: null as GraphNode | null, neighbors: [] as GraphNode[], isolated: [] as GraphNode[] };
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const center = byId.get(centerId) ?? null;
    const neighborIds = new Set<string>();
    for (const e of edges) {
      if (e.from === centerId) neighborIds.add(e.to);
      else if (e.to === centerId) neighborIds.add(e.from);
    }
    const neighbors = [...neighborIds].map((id) => byId.get(id)).filter((n): n is GraphNode => !!n);
    const connected = new Set<string>([centerId, ...neighborIds]);
    const isolated = nodes.filter((n) => !connected.has(n.id) && n.links === 0);
    return { center, neighbors, isolated };
  }, [nodes, edges, centerId]);

  if (status === 'loading' || loading) return <DashboardSkeleton />;

  const W = 800;
  const H = 560;
  const R = Math.min(200, 90 + neighborhood.neighbors.length * 12) * zoom;
  const cx = W / 2;
  const cy = H / 2;

  const placed = neighborhood.neighbors.map((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(neighborhood.neighbors.length, 1) - Math.PI / 2;
    return { node: n, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Share2 size={20} color="#f97316" />
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginRight: 'auto' }}>Graph</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.2).toFixed(1)))} title="Zoom in">
          <Plus size={14} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} title="Zoom out">
          <Minus size={14} />
        </button>
      </div>
      <p style={{ color: '#78716c', fontSize: 13, marginBottom: 16 }}>
        How your documents link together. Click any node to re-center — type <code style={{ background: '#fff7ed', padding: '1px 6px', borderRadius: 6, color: '#c2410c' }}>[[]]</code> in a doc to link it.
      </p>

      {nodes.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#a8a29e', fontSize: 14 }}>
          No documents yet — create one to start your graph.
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 8, marginBottom: 12, overflow: 'hidden' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Document link graph">
              {placed.map(({ node, x, y }) => (
                <line key={`e-${node.id}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#fed7aa" strokeWidth={1.5} />
              ))}
              {placed.map(({ node, x, y }) => (
                <g
                  key={node.id}
                  onClick={() => setCenterId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <title>{node.title}</title>
                  <circle cx={x} cy={y} r={16 + Math.min(node.links, 6) * 2} fill="white" stroke={colorFor(node.folderId)} strokeWidth={2.5} />
                  <text x={x} y={y + 34} textAnchor="middle" fontSize={12} fontWeight={600} fill="#44403c">
                    {shortTitle(node.title)}
                  </text>
                  {node.folderName && (
                    <text x={x} y={y + 48} textAnchor="middle" fontSize={10} fill="#a8a29e">
                      {shortTitle(node.folderName, 14)}
                    </text>
                  )}
                </g>
              ))}
              {neighborhood.center && (
                <g onClick={() => router.push(`/documents/${neighborhood.center!.id}`)} style={{ cursor: 'pointer' }}>
                  <title>{`${neighborhood.center.title} (open)`}</title>
                  <circle cx={cx} cy={cy} r={26} fill="#f97316" />
                  <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill="white">
                    {neighborhood.center.title.charAt(0).toUpperCase() || '•'}
                  </text>
                  <text x={cx} y={cy + 46} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1c1917">
                    {shortTitle(neighborhood.center.title, 24)}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {neighborhood.isolated.length > 0 && (
            <div className="card" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <Unlink size={13} /> Unlinked ({neighborhood.isolated.length})
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {neighborhood.isolated.slice(0, 30).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setCenterId(n.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#57534e', background: '#fafaf9', border: '1.5px solid #e7e5e4', borderRadius: 999, padding: '4px 11px', cursor: 'pointer' }}
                  >
                    <FolderIcon size={11} color={colorFor(n.folderId)} /> {shortTitle(n.title, 20)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
