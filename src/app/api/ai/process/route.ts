import { NextResponse } from 'next/server';

const AI_ACTIONS: Record<string, (text: string) => string> = {
  improve: (text) => text.replace(/\bvery\b/g, 'extremely').replace(/\s+/g, ' ').trim(),
  grammar: (text) => text.replace(/\bi\b/g, 'I').replace(/\s+/g, ' ').trim(),
  summarize: (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, 2).join('. ') + '.';
  },
  expand: (text) => text + '\n\nFurthermore, this concept has broader implications worth exploring.',
  translate: (text) => text.split(' ').map(() => 'palabra').join(' ') + ' [Spanish]',
};

export async function POST(request: Request) {
  try {
    const { text, action } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const result = action && AI_ACTIONS[action] 
      ? AI_ACTIONS[action](text) 
      : text;

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
