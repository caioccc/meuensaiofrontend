import AppLayout from '@/components/AppLayout';
import { Container, Paper, Title, Breadcrumbs, Anchor, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import AddMusicModal from '../components/AddMusicModal';

export default function AddMusicPage() {
  const [setlists, setSetlists] = useState([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/setlists/').then(res => setSetlists(res.data.results || res.data));
  }, []);

  return (
    <AppLayout>
      <Container size="100%" py="xl">
        <Breadcrumbs mb="md">
          <Anchor href="/">Início</Anchor>
          <Text>Adicionar Música</Text>
        </Breadcrumbs>
        <Title order={2} mb="lg">Adicionar Música</Title>
        <Paper shadow="md" p="xl" radius="md" withBorder>
          <AddMusicModal
            opened={true}
            setlists={setlists}
          />
        </Paper>
      </Container>
    </AppLayout>
  );
}
