import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const [users, members, volunteers, events, donations] = await Promise.all([
    prisma.user.count(),
    prisma.member.count(),
    prisma.volunteer.count(),
    prisma.event.count(),
    prisma.donation.count()
  ]);

  return NextResponse.json({
    summary: {
      users,
      members,
      volunteers,
      events,
      donations
    }
  });
}
