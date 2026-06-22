import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  const password = hashPassword('password123');

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password,
    },
  });

  const meetingNotes = await prisma.document.create({
    data: {
      title: 'Meeting Notes - Q3 Planning',
      ownerId: user.id,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Q3 Planning Meeting' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Date: June 15, 2026' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alice' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bob' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Charlie' }] }] },
          ]},
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Decisions' }] },
          { type: 'orderedList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Launch new feature by August 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hire two additional engineers' }] }] },
          ]},
        ],
      },
    },
  });

  const projectProposal = await prisma.document.create({
    data: {
      title: 'Project Proposal - Dashboard Redesign',
      ownerId: user.id,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Dashboard Redesign Proposal' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'This proposal outlines the need for a modernized dashboard experience.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Motivation' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'The current dashboard has not been updated in 3 years and users have reported usability issues.' }] },
        ],
      },
    },
  });

  await prisma.document.create({
    data: {
      title: 'Weekly Report - Week 25',
      ownerId: user.id,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Weekly Report' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'This week we made significant progress on the authentication system.' }] },
        ],
      },
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Great notes! Should we also discuss the budget timeline?',
      documentId: meetingNotes.id,
      userId: user.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'I think we should prioritize the mobile view first.',
      documentId: projectProposal.id,
      userId: user.id,
    },
  });

  console.log('Seeded database:');
  console.log(`  User: test@example.com / password123`);
  console.log(`  Documents: 3 created`);
  console.log(`  Comments: 2 created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
