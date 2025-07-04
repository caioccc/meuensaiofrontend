/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/components/AppLayout';
import { Anchor, Breadcrumbs, Container, Grid, Loader, Text, TextInput, Title } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '../../../lib/axios';
import MusicCard from '../../components/MusicCard';

export default function SetlistViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [setlist, setSetlist] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/setlists/${id}/`).then(res => {
      setSetlist(res.data);
      setSongs(res.data.songs || []);
      setLoading(false);
    });
  }, [id]);

  // Filtro local (pode ser adaptado para backend se preferir)
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(search.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <Container size="lg" py="xl">
        <Breadcrumbs mb="md">
          <Anchor onClick={() => router.push('/')}>Início</Anchor>
          <Anchor onClick={() => router.push('/setlists')}>Setlists</Anchor>
          <Text>{setlist?.name}</Text>
        </Breadcrumbs>
        <Title order={2} mb="lg">Setlist: {setlist?.name}</Title>
        {setlist?.date && (
          <Text size="sm" color="dimmed" mb="md">
            {(() => {
              const [ano, mes, dia] = setlist.date.split('-');
              const dataLocal = new Date(Number(ano), Number(mes) - 1, Number(dia));
              return format(dataLocal, 'dd/MM/yyyy', { locale: ptBR });
            })()}
          </Text>
        )}
        <TextInput
          icon={<IconSearch size={16} />}
          placeholder="Buscar música por nome ou artista"
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          mb="md"
        />
        {loading ? <Loader /> : (
          <Grid>
            {filteredSongs.map(song => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={song.id}>
                <MusicCard
                  id={song.id}
                  title={song.title}
                  artist={song.artist}
                  duration={song.duration}
                  bpm={song.bpm}
                  chords_url={song.chords_url}
                  thumbnail_url={song.thumbnail_url}
                  songKey={song.key}
                  view_count={song.view_count}
                  onPlay={() => window.open(song.link, '_blank')}
                  onDelete={async () => {
                    await api.delete(`songs/${song.id}/`);
                    setSongs(songs => songs.filter(s => s.id !== song.id));
                  }}
                />
              </Grid.Col>
            ))}
          </Grid>
        )}
        {filteredSongs.length === 0 && !loading && (
          <Text color="dimmed" align="center" mt="md">Nenhuma música encontrada.</Text>
        )}
      </Container>
    </AppLayout>
  );
}
