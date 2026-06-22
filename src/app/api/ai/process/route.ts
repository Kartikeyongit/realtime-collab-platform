export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const SYSTEM_PROMPTS: Record<string, string> = {
  improve: 'Improve the following text to make it more professional, clear, and engaging. Fix awkward phrasing and enhance vocabulary while preserving the original meaning. Return only the improved text.',
  grammar: 'Fix all grammar, spelling, and punctuation errors in the following text. Preserve the original meaning and style as much as possible. Return only the corrected text.',
  summarize: 'Summarize the following text concisely while preserving key points and meaning. Return only the summary.',
  expand: 'Expand the following text by adding more detail, examples, and depth. Maintain the original tone and style. Return only the expanded text.',
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, action } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY;
    const baseURL = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';

    if (!apiKey) {
      return NextResponse.json({
        result: text,
        note: 'AI is not configured. Set AI_API_KEY in your environment variables.',
      });
    }

    const client = new OpenAI({ apiKey, baseURL });

    const systemPrompt = SYSTEM_PROMPTS[action as string] || SYSTEM_PROMPTS.improve;
    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const result = completion.choices[0]?.message?.content?.trim() || text;

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('AI process error:', error.message);
    return NextResponse.json({
      result: '',
      note: 'AI processing failed. Please check your API key and try again.',
    });
  }
}
