'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Share2, Folder as FolderIcon, Unlink, Plus, Minus, MousePointerClick } from 'lucide-react';
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

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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
  const [hoverId, setHoverId] = useState<string | null>(null);
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

  const dimmed = (id: string) => hoverId !== null && hoverId !== id && hoverId !== centerId;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <style>{`
        .graph-node { transition: transform 0.15s ease, opacity 0.2s ease; transform-box: fill-box; transform-origin: center; }
        .graph-node:hover { transform: scale(1.1); }
        .graph-flow { stroke-dasharray: 2 10; animation: graphFlow 1.1s linear infinite; }
        @keyframes graphFlow { to { stroke-dashoffset: -12; } }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Share2 size={20} color="#f97316" />
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginRight: 'auto' }}>Graph</h1>
        <span style={{ fontSize: 12, color: '#a8a29e', fontWeight: 600 }}>
          {nodes.length} doc{nodes.length === 1 ? '' : 's'} · {edges.length} link{edges.length === 1 ? '' : 's'}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.2).toFixed(1)))} title="Zoom in">
          <Plus size={14} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} title="Zoom out">
          <Minus size={14} />
        </button>
      </div>
      <p style={{ color: '#78716c', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <MousePointerClick size={13} />
        <span>Click a neighbor to re-center · click the center to open it · type <code style={{ background: '#fff7ed', padding: '1px 6px', borderRadius: 6, color: '#c2410c' }}>[[]]</code> in a doc to link it.</span>
      </p>

      {nodes.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#a8a29e', fontSize: 14 }}>
          No documents yet — create one to start your graph.
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 8, marginBottom: 12, overflow: 'hidden', background: '#fffdf9' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Document link graph">
              <defs>
                <radialGradient id="graph-center" cx="35%" cy="30%" r="80%">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#ea580c" />
                </radialGradient>
                <filter id="graph-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="3" stdDeviation="7" floodColor="#f97316" floodOpacity="0.45" />
                </filter>
                <filter id="graph-soft" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1c1917" floodOpacity="0.12" />
                </filter>
                <pattern id="graph-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1.5" fill="#f5f0e8" />
                </pattern>
              </defs>

              <rect width={W} height={H} fill="url(#graph-dots)" />

              {placed.map(({ node, x, y }) => (
                <g key={`e-${node.id}`} opacity={dimmed(node.id) ? 0.2 : 1} style={{ transition: 'opacity 0.2s ease' }}>
                  <line x1={cx} y1={cy} x2={x} y2={y} stroke="#ffe3c2" strokeWidth={3} strokeLinecap="round" />
                  <line x1={cx} y1={cy} x2={x} y2={y} stroke="#f97316" strokeWidth={1.6} strokeLinecap="round" className="graph-flow" opacity={0.75} />
                </g>
              ))}

              {placed.map(({ node, x, y }) => {
                const c = colorFor(node.folderId);
                const r = 19 + Math.min(node.links, 6) * 2;
                return (
                  <g
                    key={node.id}
                    className="graph-node"
                    onClick={() => setCenterId(node.id)}
                    onMouseEnter={() => setHoverId(node.id)}
                    onMouseLeave={() => setHoverId(null)}
                    opacity={dimmed(node.id) ? 0.35 : 1}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{node.title}</title>
                    <circle cx={x} cy={y} r={r} fill={tint(c, 0.14)} stroke={c} strokeWidth={2.5} filter="url(#graph-soft)" />
                    <text x={x} y={y + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill={c}>
                      {node.title.charAt(0).toUpperCase() || '•'}
                    </text>
                    <text x={x} y={y + r + 16} textAnchor="middle" fontSize={12} fontWeight={600} fill="#44403c">
                      {shortTitle(node.title)}
                    </text>
                    {node.folderName ? (
                      <text x={x} y={y + r + 30} textAnchor="middle" fontSize={10} fill="#a8a29e">
                        {shortTitle(node.folderName, 14)}
                      </text>
                    ) : (
                      <text x={x} y={y + r + 30} textAnchor="middle" fontSize={10} fill="#d6d3d1">
                        {node.links} link{node.links === 1 ? '' : 's'}
                      </text>
                    )}
                  </g>
                );
              })}

              {neighborhood.center && (
                <g
                  onClick={() => router.push(`/documents/${neighborhood.center!.id}`)}
                  onMouseEnter={() => setHoverId(neighborhood.center!.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`${neighborhood.center.title} (click to open)`}</title>
                  <circle cx={cx} cy={cy} r={30} fill="none" stroke="#fed7aa" strokeWidth={2}>
                    <animate attributeName="r" values="30;42" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r={27} fill="url(#graph-center)" filter="url(#graph-glow)" />
                  <text x={cx} y={cy + 7} textAnchor="middle" fontSize={20} fontWeight={700} fill="white">
                    {neighborhood.center.title.charAt(0).toUpperCase() || '•'}
                  </text>
                  <text x={cx} y={cy + 50} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1c1917">
                    {shortTitle(neighborhood.center.title, 26)}
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
