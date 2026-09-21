'use client';

import { useParams } from 'next/navigation';
import VolunteersShell from '../VolunteersShell';

export default function NestedVolunteersPage() {
  const params = useParams() as { slug?: string[] } | undefined;
  return <VolunteersShell preselectedId={params?.slug?.[0]} />;
}