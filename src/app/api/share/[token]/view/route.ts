export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { DocLink } from '@/components/editor/extensions/DocLink';
import {
  CustomTable,
  CustomTableRow,
  CustomTableCell,
  CustomTableHeader,
} from '@/components/editor/extensions/tableExtensions';
import { FontSize } from '@/components/editor/extensions/FontSize';

/**
 * POST /api/share/[token]/view { password? } → public reading payload.
 * Same token/password/expiry checks as the editor shortcut, but returns
 * rendered content instead of a documentId. Strict quota: passwords are
 * brute-forceable, so this is the tightest bucket in the app.
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`share-view:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts — try again shortly' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const password = body.password as string | undefined;

    const { prisma } = await import('@/lib/prisma');

    const link = await prisma.shareLink.findUnique({
      where: { token: params.token },
      select: {
        id: true,
        password: true,
        expiresAt: true,
        role: true,
        document: {
          select: {
            title: true,
            content: true,
            updatedAt: true,
            owner: { select: { name: true } },
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    if (link.password) {
      if (!password) {
        return NextResponse.json(
          { needsPassword: true, documentTitle: link.document.title },
          { status: 200 }
        );
      }
      const { verifyPassword } = await import('@/lib/password');
      if (!verifyPassword(password, link.password)) {
        return NextResponse.json({ error: 'Wrong password' }, { status: 403 });
      }
    }

    return NextResponse.json({
      title: link.document.title,
      content: link.document.content,
      html: renderHtml(link.document.content),
      ownerName: link.document.owner?.name || 'Someone',
      updatedAt:
        link.document.updatedAt instanceof Date
          ? link.document.updatedAt.toISOString()
          : String(link.document.updatedAt),
      role: (link as { role?: string }).role ?? 'editor',
    });
  } catch (error) {
    console.error('Share view error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** TipTap JSON → static HTML for public reading (no editor JS for viewers). */
function renderHtml(content: unknown): string {
  try {
    if (!content || typeof content !== 'object') return '';
    return generateHTML(content as any, [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Image,
      Link,
      TextAlign,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Subscript,
      Superscript,
      CustomTable,
      CustomTableRow,
      CustomTableCell,
      CustomTableHeader,
      DocLink,
    ]);
  } catch {
    return '';
  }
}
