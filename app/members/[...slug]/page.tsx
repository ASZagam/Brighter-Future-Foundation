'use client';

import { useParams } from 'next/navigation';
import MembersShell from '../MembersShell';
import { resolveMemberId } from '../MembersRoster';

export default function NestedMembersPage() {
  const params = useParams() as { slug?: string[] } | undefined;
  const selectedId = resolveMemberId(params?.slug);
  return <MembersShell preselectedId={selectedId} />;
}