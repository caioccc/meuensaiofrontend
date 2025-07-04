/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/components/AppLayout';
import SetlistPlayer from '@/components/SetlistPlayer';
import { Container, Loader } from '@mantine/core';
import { useRouter } from 'next/router';

export default function SetlistPlayerPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) return <Loader />;

  return (
    <AppLayout>
      <Container>
        <SetlistPlayer setlistId={id as string} />
      </Container>
    </AppLayout>
  );
}
