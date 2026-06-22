'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { templates, Template } from '@/components/templates/templateData';

export default function TemplatesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [creating, setCreating] = useState<string | null>(null);

  const categories = ['All', ...new Set(templates.map(t => t.category))];
  const filtered = selectedCategory === 'All' ? templates : templates.filter(t => t.category === selectedCategory);

  const createFromTemplate = async (template: Template) => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    setCreating(template.id);
    try {
      const { data } = await axios.post('/api/documents', { title: template.name, content: template.content });
      toast.success(`Created "${template.name}"!`);
      router.push(`/documents/${data.id}`);
    } catch {
      toast.error('Failed to create document from template');
    } finally {
      setCreating(null);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Templates</h1>
        <p style={{ color: '#78716c', fontSize: '14px' }}>Choose a template to get started</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
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

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: '15px', color: '#78716c' }}>No templates in this category</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{template.name}</div>
                <div style={{ fontSize: '12px', color: '#78716c', lineHeight: 1.4 }}>{template.description}</div>
                <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 8px', background: '#f5f5f4', borderRadius: '4px', fontSize: '10px', color: '#a8a29e' }}>{template.category}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
