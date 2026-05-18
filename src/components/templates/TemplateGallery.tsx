'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { X, Sparkles, FileText, Loader2, Briefcase, BookOpen, Code2, Calendar, ClipboardList, PenTool } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  icon: any;
  description: string;
  category: string;
  content: any;
}

const templates: Template[] = [
  {
    id: 'meeting-notes', name: 'Meeting Notes', icon: Calendar,
    description: 'Structured meeting notes with agenda and action items',
    category: 'Business',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '📅 Date: [Insert Date]' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '👥 Attendees: [Names]' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 1' }] }] }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 1 - @owner - Due date' }] }] }] },
    ]}
  },
  {
    id: 'project-proposal', name: 'Project Proposal', icon: Briefcase,
    description: 'Professional project proposal with objectives and timeline',
    category: 'Business',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Proposal' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Executive Summary' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Brief overview of the project...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Objectives' }] },
      { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Primary objective' }] }] }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Phase 1: [Start] - [End]' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Budget' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Estimated: $[Amount]' }] },
    ]}
  },
  {
    id: 'technical-spec', name: 'Technical Spec', icon: Code2,
    description: 'Technical documentation with code blocks and API specs',
    category: 'Technical',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Technical Specification' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'System architecture and design...' }] },
      { type: 'codeBlock', content: [{ type: 'text', text: '// Architecture overview\nSystem {\n  Frontend: React\n  Backend: Node.js\n  Database: PostgreSQL\n}' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'API Endpoints' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'GET /api/v1/resource - Description' }] },
    ]}
  },
  {
    id: 'weekly-report', name: 'Weekly Report', icon: ClipboardList,
    description: 'Track weekly progress and accomplishments',
    category: 'Business',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Weekly Report' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Week of: [Date]' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Accomplishments' }] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Achievement 1' }] }] }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Challenges' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Next Week Plans' }] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Plan 1' }] }] }] },
    ]}
  },
  {
    id: 'blog-post', name: 'Blog Post', icon: PenTool,
    description: 'Ready-to-write blog post structure',
    category: 'Creative',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Blog Post Title' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'By [Author] · [Date]' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Introduction' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Hook your readers with an engaging opening...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Main Content' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Your main points here...' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Conclusion' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Wrap up and call to action...' }] },
    ]}
  },
  {
    id: 'research-notes', name: 'Research Notes', icon: BookOpen,
    description: 'Organize research findings and references',
    category: 'Academic',
    content: { type: 'doc', content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Research Notes' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Topic: [Research Topic]' }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Findings' }] },
      { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Finding 1 - Source: [Reference]' }] }] }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'References' }] },
      { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Author], [Title], [Year]' }] }] }] },
    ]}
  },
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function TemplateGallery({ isOpen, onClose, addToast }: TemplateGalleryProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [creating, setCreating] = useState<string | null>(null);

  const categories = ['All', 'Business', 'Technical', 'Creative', 'Academic'];
  const filtered = selectedCategory === 'All' ? templates : templates.filter(t => t.category === selectedCategory);

  const createFromTemplate = async (template: Template) => {
    setCreating(template.id);
    try {
      const { data } = await axios.post('/api/documents', { title: template.name, content: template.content });
      addToast(`Created "${template.name}"!`, 'success');
      onClose();
      router.push(`/documents/${data.id}`);
    } catch (error) {
      addToast('Failed to create document', 'error');
    } finally {
      setCreating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #e7e5e4', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', width: '100%', maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 20px 0', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '18px' }}>Templates</h2>
            <p style={{ fontSize: '13px', color: '#78716c' }}>Start with a pre-made template</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: '4px' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: '6px', padding: '16px 20px', borderBottom: '1.5px solid #e7e5e4', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px', fontSize: '12px', fontWeight: 500, borderRadius: '8px', border: '1.5px solid',
                borderColor: selectedCategory === cat ? '#f97316' : '#e7e5e4',
                background: selectedCategory === cat ? '#fff7ed' : 'white',
                color: selectedCategory === cat ? '#c2410c' : '#78716c',
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map(template => (
            <button key={template.id} onClick={() => createFromTemplate(template)} disabled={creating === template.id}
              style={{
                padding: '18px', textAlign: 'left', borderRadius: '12px', border: '1.5px solid #e7e5e4',
                background: 'white', cursor: 'pointer', transition: 'all 0.15s ease', display: 'flex', gap: '14px',
                opacity: creating === template.id ? 0.6 : 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d6d3d1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e7e5e4'}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {creating === template.id ? <Loader2 size={18} color="#f97316" className="animate-spin" /> : <template.icon size={18} color="#f97316" />}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{template.name}</div>
                <div style={{ fontSize: '12px', color: '#78716c', lineHeight: 1.4 }}>{template.description}</div>
                <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', background: '#f5f5f4', borderRadius: '4px', fontSize: '10px', color: '#a8a29e' }}>{template.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
