import AppLayout from '@/components/AppLayout';
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
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconChevronRight,
  IconHeart,
  IconMusic,
  IconPlayerPlay,
  IconPlaylist,
  IconShare
} from '@tabler/icons-react';
import React from 'react';

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
  // Dados mockados
  const setlistsOfWeek: Playlist[] = [
    {
      id: '1',
      name: 'Electronic Vibes',
      description: 'Latest electronic and house tracks',
      songCount: 18,
      duration: '1h 25m',
      image: '/api/placeholder/300/200',
    },
    {
      id: '2',
      name: 'Rock Classics',
      description: 'Best rock hits from the 80s and 90s',
      songCount: 24,
      duration: '2h 15m',
      image: '/api/placeholder/300/200',
    },
    {
      id: '3',
      name: 'Acoustic Sessions',
      description: 'Unplugged and acoustic favorites',
      songCount: 15,
      duration: '1h 45m',
      image: '/api/placeholder/300/200',
    },
  ];

  const mostPlayedSongs: Song[] = [
    {
      id: '1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      duration: '5:55',
      plays: 1247,
      image: '/api/placeholder/60/60',
      genre: 'Rock',
    },
    {
      id: '2',
      title: 'Lose Yourself',
      artist: 'Eminem',
      duration: '5:26',
      plays: 986,
      image: '/api/placeholder/60/60',
      genre: 'Hip-Hop',
    },
    {
      id: '3',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      duration: '3:20',
      plays: 1435,
      image: '/api/placeholder/60/60',
      genre: 'Pop',
    },
  ];

  const topTracks: Song[] = [
    {
      id: '1',
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      duration: '3:53',
      plays: 2500,
      image: '/api/placeholder/50/50',
      genre: 'Pop',
    },
    {
      id: '2',
      title: 'Watermelon Sugar',
      artist: 'Harry Styles',
      duration: '2:54',
      plays: 1850,
      image: '/api/placeholder/50/50',
      genre: 'Pop',
    },
    {
      id: '3',
      title: "Don't Stop Me Now",
      artist: 'Queen',
      duration: '3:29',
      plays: 1620,
      image: '/api/placeholder/50/50',
      genre: 'Rock',
    },
  ];

  const personalRanking: Song[] = [
    {
      id: '1',
      title: 'Hotel California',
      artist: 'Eagles',
      duration: '6:30',
      plays: 2347,
      image: '/api/placeholder/50/50',
      genre: 'Rock',
    },
    {
      id: '2',
      title: 'Fly Me to the Moon',
      artist: 'Frank Sinatra',
      duration: '2:28',
      plays: 1567,
      image: '/api/placeholder/50/50',
      genre: 'Jazz',
    },
    {
      id: '3',
      title: 'Mr. Brightside',
      artist: 'The Killers',
      duration: '3:42',
      plays: 1654,
      image: '/api/placeholder/50/50',
      genre: 'Alternative',
    },
  ];

  const musicStats: MusicStats = {
    totalSongs: 1247,
    playlists: 23,
    mostCommonKey: 'C Major',
    avgBPM: 120,
  };

  const SongCard: React.FC<{ song: Song; showPlays?: boolean }> = ({ song, showPlays = false }) => (
    <Paper p="md" radius="md" withBorder>
      <Group>
        <Avatar src={song.image} size={50} radius="md" />
        <Box style={{ flex: 1 }}>
          <Text fw={500} size="sm" truncate>
            {song.title}
          </Text>
          <Text size="xs" c="dimmed">
            {song.artist}
          </Text>
          {showPlays && (
            <Text size="xs" c="dimmed">
              {song.plays.toLocaleString()} plays
            </Text>
          )}
        </Box>
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {song.duration}
          </Text>
          <ActionIcon variant="subtle" size="sm">
            <IconPlayerPlay size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm">
            <IconHeart size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm">
            <IconShare size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );

  const PlaylistCard: React.FC<{ playlist: Playlist }> = ({ playlist }) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <div
          style={{
            height: 200,
            backgroundImage: `url(${playlist.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActionIcon size="xl" variant="filled" color="blue" radius="xl">
              <IconPlayerPlay size={24} />
            </ActionIcon>
          </div>
        </div>
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Title order={4}>{playlist.name}</Title>
        <Text size="sm" c="dimmed">
          {playlist.description}
        </Text>
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
      <Container size="xl">
        <Stack gap="xl">
          {/* Setlists da Semana */}
          <section>
            <Group justify="space-between" mb="md">
              <Title order={2}>Setlists da Semana</Title>
              <Button variant="subtle" rightSection={<IconChevronRight size={16} />}>
                Ver todos
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {setlistsOfWeek.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </SimpleGrid>
          </section>

          {/* Músicas mais tocadas */}
          <section>
            <Group justify="space-between" mb="md">
              <Title order={2}>Músicas mais tocadas</Title>
              <ActionIcon variant="subtle">
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {mostPlayedSongs.map((song) => (
                <SongCard key={song.id} song={song} showPlays />
              ))}
            </SimpleGrid>
          </section>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              {/* Suas músicas favoritas */}
              <section>
                <Title order={2} mb="md">Suas músicas favoritas</Title>
                <Stack gap="sm">
                  {topTracks.map((song, index) => (
                    <Paper key={song.id} p="sm" radius="md" withBorder>
                      <Group>
                        <Center w={30} h={30}>
                          <Text fw={700} size="sm">
                            {index + 1}
                          </Text>
                        </Center>
                        <Avatar src={song.image} size={40} radius="md" />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} size="sm" truncate>
                            {song.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {song.artist}
                          </Text>
                        </Box>
                        <Group gap="xs">
                          <ActionIcon variant="subtle" size="sm">
                            <IconPlayerPlay size={14} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" size="sm">
                            <IconHeart size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </section>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              {/* Seu ranking pessoal */}
              <section>
                <Title order={2} mb="md">Seu ranking pessoal</Title>
                <Stack gap="sm">
                  {personalRanking.map((song, index) => (
                    <Paper key={song.id} p="sm" radius="md" withBorder>
                      <Group>
                        <Center w={30} h={30}>
                          <Text fw={700} size="sm">
                            {index + 1}
                          </Text>
                        </Center>
                        <Avatar src={song.image} size={40} radius="md" />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} size="sm" truncate>
                            {song.title}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {song.artist}
                          </Text>
                        </Box>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">
                            {song.plays.toLocaleString()} execuções
                          </Text>
                          <ActionIcon variant="subtle" size="sm">
                            <IconPlayerPlay size={14} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" size="sm">
                            <IconHeart size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </section>
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
    </AppLayout>
  );
};

export default MusicDashboard;