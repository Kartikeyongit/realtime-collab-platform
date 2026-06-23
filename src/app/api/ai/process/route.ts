export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
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

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`ai:${session.user.email || ip}`, 20, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: `Rate limited. Try again in ${Math.ceil(rl.resetIn / 1000)}s.` }, { status: 429 });
    }

    const body = await request.json();
    const { text, action, prompt: customPrompt } = body;

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
    let systemPrompt = SYSTEM_PROMPTS[action as string] || SYSTEM_PROMPTS.improve;

    if (action === 'custom' && customPrompt) {
      systemPrompt = `You are a writing assistant. The user gives you this instruction: "${customPrompt}". Apply it to their text below. Return only the modified text.`;
    }

    const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI process error:', error.message);
    return NextResponse.json({ error: error.message || 'AI processing failed' }, { status: 500 });
  }
}
