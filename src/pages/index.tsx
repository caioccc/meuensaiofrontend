/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/components/AppLayout';
import { Carousel } from '@mantine/carousel';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Card,
  Center,
  Container,
  Grid,
  Group,
  LoadingOverlay,
  Menu,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import {
  IconDotsVertical,
  IconMusic,
  IconPlayerPlay,
  IconPlaylist,
  IconPlus
} from '@tabler/icons-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  plays: number;
  image: string;
  genre: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  songCount: number;
  duration: string;
  image: string;
}

interface MusicStats {
  totalSongs: number;
  playlists: number;
  mostCommonKey: string;
  avgBPM: number;
}

const MusicDashboard: React.FC = () => {
  // Estados para dados reais
  const [setlistsOfWeek, setSetlistsOfWeek] = useState<Playlist[]>([]);
  const [mostPlayedSongs, setMostPlayedSongs] = useState<Song[]>([]);
  const [personalRanking, setPersonalRanking] = useState<Song[]>([]);
  const [musicStats, setMusicStats] = useState<MusicStats>({ totalSongs: 0, playlists: 0, mostCommonKey: 'Nenhum', avgBPM: 0 });
  const [loading, setLoading] = useState(true);

  const isMobile = useMediaQuery('(max-width: 48em)');
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [selectedSetlist, setSelectedSetlist] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/setlists/of-the-week/'),
      api.get('/songs/most-popular/'),
      api.get('/songs/personal-ranking/'),
      api.get('/songs/music-stats/')
    ]).then(([setlistsRes, mostPopularRes, rankingRes, statsRes]) => {
      setSetlistsOfWeek((setlistsRes.data.results || []).map((s: any) => {
        // Soma as durações das músicas (formato mm:ss)
        let totalSeconds = 0;
        if (s.songs && Array.isArray(s.songs)) {
          s.songs.forEach((song: any) => {
            if (song.duration) {
              const parts = song.duration.split(':').map((p: string) => parseInt(p, 10));
              if (parts.length === 2) totalSeconds += parts[0] * 60 + parts[1];
              else if (parts.length === 3) totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
          });
        }
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        const duration = totalSeconds > 0 ? `${min}m ${sec.toString().padStart(2, '0')}s` : '';
        return {
          id: String(s.id),
          name: s.name,
          description: s.description,
          songCount: s.songs?.length || 0,
          duration,
          image: s.songs?.[0]?.thumbnail_url || '/api/placeholder/300/200',
          songs: s.songs || [],
        };
      }));
      setMostPlayedSongs((mostPopularRes.data.results || []).map((s: any) => ({
        title: s.title,
        artist: s.artist,
        duration: s.duration,
        plays: typeof s.num_setlists === 'number' ? s.num_setlists : (s.setlists?.length || 0), // usa num_setlists se vier do annotate
        image: s.thumbnail_url || '/api/placeholder/60/60',
        bpm: s.bpm || 0,
        key: s.key || '',
        genre: '',
        youtube_id: s.youtube_id || '',
        id: String(s.id),
      })));
      setPersonalRanking((rankingRes.data.results || []).map((s: any) => ({
        id: String(s.id),
        title: s.title,
        artist: s.artist,
        duration: s.duration,
        plays: typeof s.num_repeats === 'number' ? s.num_repeats : (s.setlists?.length || 0), // usa num_repeats se vier do annotate
        image: s.thumbnail_url || '/api/placeholder/50/50',
        genre: '',
        youtube_id: s.youtube_id || '',
        key: s.key || '',
        bpm: s.bpm || 0,
      })));
      if (!statsRes.data.mostCommonKey) {
        setMusicStats({
          totalSongs: statsRes.data.total_songs || 0,
          playlists: statsRes.data.playlists || 0,
          mostCommonKey: 'Nenhum',
          avgBPM: statsRes.data.avg_bpm || 0,
        });
      } else {
        setMusicStats(statsRes.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleAddSetlist = async () => {
    if (!selectedSetlist) return;
    setAddLoading(true);
    try {
      const enrichedFiltered = (selectedSetlist.songs || []).map((s: any) => ({
        title: s.title,
        duration: s.duration,
        youtube_id: s.youtube_id,
        thumbnail_url: s.thumbnail_url,
        derivedKey: s.key,
        bpm: s.bpm,
        derivedBPM: s.bpm,
        key: s.key,
        chords: s.chords,
        description: s.description,
      }));
      await api.post('/setlists/', {
        name: selectedSetlist.name,
        description: selectedSetlist.description,
        date: undefined,
        songs_data: enrichedFiltered,
      });
      showNotification({ color: 'green', message: 'Setlist adicionada com sucesso!' });
      setAddModalOpen(false);
    } catch (e: any) {
      console.log(e);
      showNotification({ color: 'red', message: 'Erro ao adicionar setlist. Tente novamente mais tarde.' });
    } finally {
      setAddLoading(false);
    }
  };

  const SongCard: React.FC<{ song: Song; showPlays?: boolean }> = ({ song, showPlays = false }) => (
    <Tooltip label={song.title} withArrow>
      <Paper p="md" radius="md" withBorder>
        <Group align="flex-start" wrap="nowrap">
          <Box style={{ flex: '0 0 64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar src={song.image} size={64} radius="md" />
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>

            <Text fw={500} size="sm" truncate title={song.title} style={{ maxWidth: '100%', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {song.title}
            </Text>

            <Text size="xs" c="dimmed">
              {song.bpm} bpm
            </Text>
            <Text size="xs" c="dimmed">
              Tom: {song.key}
            </Text>
            {showPlays && (
              <Text size="xs" c="dimmed">
                {song.plays.toLocaleString()} plays
              </Text>
            )}
          </Box>
        </Group>
        <Group gap="xs" mt="xs" justify="space-between" >
          <Text size="xs" c="dimmed">
            {song.duration}
          </Text>
          <Group gap="xs">
            <ActionIcon variant="subtle" size="sm">
              <Tooltip label="Tocar música" withArrow>
                <IconPlayerPlay size={16} onClick={() => router.push({ pathname: '/player', query: { youtubeId: song.youtube_id, id: song.id } })} />
              </Tooltip>
            </ActionIcon>
            {/* <ActionIcon variant="subtle" size="sm">
              <IconShare size={16} />
            </ActionIcon> */}
          </Group>
        </Group>
      </Paper>
    </Tooltip>
  );

  const PlaylistCard: React.FC<{ playlist: Playlist & { songs?: any[] } }> = ({ playlist }) => {
    const getRandomDelay = () => Math.floor(Math.random() * 16) * 100 + 1000;
    const autoplay = React.useRef(Autoplay({ delay: getRandomDelay(), stopOnInteraction: false }));
    const hasImages = playlist.songs && playlist.songs.some(song => song.thumbnail_url);
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section style={{ position: 'relative' }}>
          {/* Meatball menu no topo direito */}
          <Menu shadow="md" width={180} withinPortal>
            <Menu.Target>
              <ActionIcon color="gray" size="lg" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                <IconDotsVertical size={22} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconPlayerPlay size={16} />} onClick={() => router.push(`/player/setlist/${playlist.id}`)}>
                Tocar Setlist
              </Menu.Item>
              <Menu.Item leftSection={<IconPlus size={16} />} onClick={() => { setSelectedSetlist(playlist); setAddModalOpen(true); }}>
                Adicionar à minha lista
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          {isMobile ? (
            hasImages && playlist.songs && playlist.songs[0]?.thumbnail_url ? (
              <Image src={playlist.songs[0].thumbnail_url} width={400} height={120} alt={playlist.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: 120, background: '#f3f3f3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconMusic size={48} color="#bbb" />
              </div>
            )
          ) : (
            hasImages && playlist.songs && playlist.songs.length > 0 ? (
              <Carousel
                slideSize="100%"
                slideGap="xs"
                controlsOffset="xs"
                withControls={false}
                withIndicators
                plugins={playlist.songs.length > 1 ? [autoplay.current] : []}
                onMouseEnter={playlist.songs.length > 1 ? autoplay.current.stop : undefined}
                onMouseLeave={playlist.songs.length > 1 ? () => autoplay.current && autoplay.current.play && autoplay.current.play() : undefined}
                style={{ width: '100%', maxWidth: 400 }}
              >
                {playlist.songs.slice(0, 5).map((song, idx) => (
                  <Carousel.Slide key={idx}>
                    <Image src={song.thumbnail_url || '/api/placeholder/300/200'} width={400} height={300} alt={song.title} style={{ objectFit: 'cover', width: '100%', height: 200 }} />
                  </Carousel.Slide>
                ))}
              </Carousel>
            ) : (
              <div style={{ width: '100%', height: 120, background: '#f3f3f3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconMusic size={48} color="#bbb" />
              </div>
            )
          )}
        </Card.Section>

        <Stack gap="xs" mt="md">
          <Title order={4}>{playlist.name}</Title>
          <Text size="sm" c="dimmed">
            {playlist.description}
          </Text>
          {/* Lista de músicas, até 3 por card */}
          {playlist.songs && playlist.songs.length > 0 && (
            <Stack gap={0} mb={2}>
              {playlist.songs.slice(0, 3).map((m, idx) => (
                <Text key={idx} size="xs" c="dimmed" style={{ lineHeight: 1.2 }} lineClamp={1}>
                  {m.title}
                </Text>
              ))}
              {playlist.songs.length > 3 && (
                <Text size="xs" c="dimmed">...</Text>
              )}
            </Stack>
          )}
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {playlist.songCount} músicas
            </Text>
            <Text size="sm" c="dimmed">
              {playlist.duration}
            </Text>
          </Group>
        </Stack>
      </Card>
    );
  };

  const StatCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string }> = ({
    icon,
    value,
    label,
  }) => (
    <Paper p="md" radius="md" withBorder>
      <Group>
        <div style={{ color: 'var(--mantine-color-blue-6)' }}>{icon}</div>
        <div>
          <Text size="xl" fw={700}>
            {value}
          </Text>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        </div>
      </Group>
    </Paper>
  );

  return (
    <AppLayout>
      <Container size="xl" style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <Stack gap="xl">
          {/* Setlists da Semana */}
          {setlistsOfWeek.length > 0 && (
            <section>
              <Group justify="space-between" mb="md">
                <Title order={2}>Setlists da Semana</Title>
                {/* <Button variant="subtle" rightSection={<IconChevronRight size={16} />}>
                  Ver todos
                </Button> */}
              </Group>

              {/* Carousel com autoplay animado */}
              <Carousel
                slideGap="md"
                align={isMobile ? 'start' : 'start'}
                withControls={isMobile ? false : setlistsOfWeek.length > 1}
                slideSize="320px"
                slidesToScroll={isMobile ? 1 : 2}
                draggable
                loop={setlistsOfWeek.length > 2}
                styles={{ viewport: { padding: '8px 0' } }}
                breakpoints={[
                  { maxWidth: '48em', slideSize: '90%', align: 'center' }
                ]}
                plugins={[Autoplay({ delay: Math.floor(Math.random() * 16) * 100 + 3000, stopOnInteraction: false })]}
              >
                {setlistsOfWeek.map((playlist) => (
                  <Carousel.Slide key={playlist.id}>
                    <PlaylistCard playlist={playlist} />
                  </Carousel.Slide>
                ))}
              </Carousel>
            </section>
          )}

          {/* Músicas mais tocadas */}
          <section>
            <Group justify="space-between" mb="md">
              <Title order={2}>Músicas mais tocadas</Title>
              {/* <ActionIcon variant="subtle">
                <IconChevronRight size={16} />
              </ActionIcon> */}
            </Group>

            <Carousel
              slideGap="md"
              align={isMobile ? 'start' : 'start'}
              withControls={isMobile ? false : mostPlayedSongs.length > 1}
              slideSize="320px"
              slidesToScroll={isMobile ? 1 : 2}
              draggable
              loop={mostPlayedSongs.length > 2}
              styles={{ viewport: { padding: '8px 0' } }}
              breakpoints={[
                { maxWidth: '48em', slideSize: '100vw', align: 'center' }
              ]}
              plugins={[Autoplay({ delay: Math.floor(Math.random() * 16) * 100 + 3000, stopOnInteraction: false })]}
            >
              {mostPlayedSongs.map((song) => (
                <Carousel.Slide key={song.id}>
                  <Box style={{ maxWidth: isMobile ? '95vw' : 320, width: '100%', margin: '0 auto' }}>
                    <SongCard song={song} showPlays />
                  </Box>
                </Carousel.Slide>
              ))}
            </Carousel>
          </section>

          <Grid>
            <Grid.Col>
              {/* Seu ranking pessoal */}
              {personalRanking.length > 0 && (
                <section>
                  <Title order={2} mb="md">Seu ranking pessoal</Title>
                  <Stack gap="sm">
                    {personalRanking.map((song, index) => (
                      <Paper key={song.id} p={isMobile ? 'md' : 'sm'} radius="md" withBorder>
                        <Group align="flex-start" wrap="nowrap">
                          <Box style={{ position: 'relative', flex: isMobile ? '0 0 90px' : '0 0 90px', width: isMobile ? 90 : 90, height: isMobile ? 64 : 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Avatar src={song.image} size={isMobile ? 80 : 80} radius="md" style={{ width: 90, height: 64, objectFit: 'cover' }} />
                            <Center w={28} h={28} style={{ position: 'absolute', top: -8, left: -8, background: 'light-dark(#f1f3f5, #0082ff)', borderRadius: 12, boxShadow: '0 2px 8px #0002', zIndex: 2 }}>
                              <Text fw={700} size="xs">{index + 1}</Text>
                            </Center>
                          </Box>
                          <Box style={{ flex: 1, minWidth: 0 }}>

                            <Text fw={500} size="sm" truncate title={song.title} style={{ maxWidth: '100%', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {song.title}
                            </Text>

                            <Text size="xs" c="dimmed">
                              Tom: {song.key} - {song.bpm} bpm
                            </Text>
                            <Text size="xs" c="dimmed">
                              {song.plays.toLocaleString()} setlists
                            </Text>
                          </Box>
                          <ActionIcon variant="subtle" size="sm">
                            <Tooltip label="Tocar música" withArrow>
                              <IconPlayerPlay size={14} onClick={() => router.push({ pathname: '/player', query: { youtubeId: song.youtube_id, id: song.id } })} />
                            </Tooltip>
                          </ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </section>
              )}
            </Grid.Col>
          </Grid>

          {/* Suas estatísticas musicais */}
          <section>
            <Title order={2} mb="md">Suas estatísticas musicais</Title>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              <StatCard
                icon={<IconMusic size={24} />}
                value={musicStats.totalSongs.toLocaleString()}
                label="Total de músicas"
              />
              <StatCard
                icon={<IconPlaylist size={24} />}
                value={musicStats.playlists}
                label="Playlists"
              />
              <StatCard
                icon={<IconMusic size={24} />}
                value={musicStats.mostCommonKey}
                label="Tom mais comum"
              />
              <StatCard
                icon={<IconMusic size={24} />}
                value={musicStats.avgBPM}
                label="BPM médio"
              />
            </SimpleGrid>
          </section>
        </Stack>
      </Container>

      {/* Modal de confirmação para adicionar setlist */}
      <Modal opened={addModalOpen} onClose={() => setAddModalOpen(false)} title="Adicionar setlist" centered>
        <Text>Deseja adicionar esta setlist à sua lista?</Text>
        <Group mt="md" justify="flex-end">
          <Button variant="default" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
          <Button color="blue" loading={addLoading} onClick={handleAddSetlist}>Adicionar</Button>
        </Group>
      </Modal>
    </AppLayout>
  );
};

export default MusicDashboard;