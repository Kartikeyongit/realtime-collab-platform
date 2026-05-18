import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const AI_ACTIONS: Record<string, (text: string) => string> = {
  improve: (text) => {
    return text
      .replace(/\bvery\b/g, 'extremely')
      .replace(/\bgood\b/g, 'excellent')
      .replace(/\bbad\b/g, 'poor')
      .replace(/\bthing\b/g, 'aspect')
      .replace(/\s+/g, ' ')
      .trim();
  },
  grammar: (text) => {
    return text
      .replace(/\bi\b/g, 'I')
      .replace(/\bim\b/gi, "I'm")
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bwont\b/gi, "won't")
      .replace(/\bits\b/gi, "it's")
      .replace(/\btheres\b/gi, "there's")
      .replace(/\s+/g, ' ')
      .trim();
  },
  summarize: (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length <= 3) return sentences.join('. ') + '.';
    const first = sentences.slice(0, 1).join('. ');
    const last = sentences.slice(-1).join('. ');
    return first + '. ... ' + last + '.';
  },
  expand: (text) => {
    return text + '\n\nFurthermore, this concept has broader implications worth exploring. The key aspects include practical applications in modern workflows, potential integration with existing systems, and long-term benefits for organizational efficiency. Additionally, this approach aligns with current industry trends and best practices.';
  },
  translate: (text) => {
    // Simple word replacement demo
    const translations: Record<string, string> = {
      'hello': 'hola', 'world': 'mundo', 'thank': 'gracias',
      'good': 'bueno', 'morning': 'mañana', 'night': 'noche',
      'friend': 'amigo', 'love': 'amor', 'yes': 'sí', 'no': 'no',
    };
    return text.split(' ').map(w => translations[w.toLowerCase()] || w).join(' ') + ' [Spanish]';
  },
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, action, prompt } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    let result: string;
    
    if (action && AI_ACTIONS[action]) {
      result = AI_ACTIONS[action](text);
    } else if (prompt) {
      result = `[AI Response to: "${prompt}"]\n\nHere is the enhanced version based on your request:\n\n${text}`;
    } else {
      result = text;
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
