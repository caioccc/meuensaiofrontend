/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/components/AppLayout';
import SetlistPDF from '@/components/SetlistPDF';
import { useAuth } from '@/contexts/AuthContext';
import { Anchor, Breadcrumbs, Button, Container, Grid, Group, Loader, Text, TextInput, Title } from '@mantine/core';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { IconFileDownload, IconSearch } from '@tabler/icons-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import api from '../../../lib/axios';
import MusicCard from '../../components/MusicCard';

export default function SetlistViewPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const [setlist, setSetlist] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const { isPro } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    song.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <Container size="lg" py="xl">
        <Breadcrumbs mb="md">
          <Anchor onClick={() => router.push('/dashboard')}>{t('setlistsPage.breadcrumbHome')}</Anchor>
          <Anchor onClick={() => router.push('/setlists')}>{t('setlistsPage.breadcrumbSetlists')}</Anchor>
          <Text>{setlist?.name}</Text>
        </Breadcrumbs>
        <Group justify="space-between" mb="lg">
          <Title order={2}>{t('setlistsPage.title')}: {setlist?.name}</Title>
          {isClient && setlist && isPro && (
            <PDFDownloadLink
              document={<SetlistPDF setlist={setlist} />}
              fileName={`${setlist.name}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <Button
                  leftSection={<IconFileDownload size={18} />}
                  loading={pdfLoading}
                  disabled={pdfLoading}
                  variant="outline"
                  color="blue"
                >
                  {t('setlistsPage.exportPDF')}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </Group>
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
          leftSection={<IconSearch size={16} />}
          placeholder={t('setlistsPage.searchSongPlaceholder')}
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
                  duration={song.duration}
                  bpm={song.bpm}
                  thumbnail_url={song.thumbnail_url}
                  songKey={song.key}
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
          <Text color="dimmed" ta="center" mt="md">{t('setlistsPage.noSongsFound')}</Text>
        )}
      </Container>
    </AppLayout>
  );
}
