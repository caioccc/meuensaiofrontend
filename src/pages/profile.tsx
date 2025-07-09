/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import InfiniteScrollWrapper from "@/components/InfiniteScrollWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { getMusicStats, getUserSetlists, getUserSongs, updateUserProfile } from "@/lib/profileApi";
import { Carousel } from '@mantine/carousel';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title
} from "@mantine/core";
import { showNotification } from '@mantine/notifications';
import {
  IconCalendar,
  IconChartBar,
  IconClock,
  IconCrown,
  IconEdit,
  IconFlame,
  IconHeart,
  IconKey,
  IconMail,
  IconMusic,
  IconPlayerPlay,
  IconPlaylist,
  IconShare
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface UserStats {
  totalSongs: number;
  totalSetlists: number;
  practiceTime: string;
  favoriteGenre: string;
  weeklyGoal: number;
  currentStreak: number;
  level: number;
  experience: number;
  maxExperience: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  bpm: number;
  genre: string;
  duration: string;
  isFavorite: boolean;
  lastPlayed?: Date;
  playCount: number;
}

// interface Achievement {
//   id: string;
//   title: string;
//   description: string;
//   icon: React.ReactNode;
//   unlocked: boolean;
//   progress?: number;
//   maxProgress?: number;
// }

export default function ProfilePage() {
  const { user, subscription, isPro } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Dados reais e mockados
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<any[]>([]);
  const [musicStats, setMusicStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Paginação e infinite scroll para músicas
  const [songsPage, setSongsPage] = useState(1);
  const [songsHasMore, setSongsHasMore] = useState(true);
  const [songsLoadingMore, setSongsLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastSongRef = (node: HTMLDivElement | null) => {
    if (songsLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && songsHasMore) {
        loadMoreSongs();
      }
    });
    if (node) observer.current.observe(node);
  };

  // Função para carregar mais músicas (infinite scroll)
  async function loadMoreSongs() {
    setSongsLoadingMore(true);
    try {
      const nextPage = songsPage + 1;
      const res = await getUserSongs(nextPage);
      const newSongs = Array.isArray(res) ? res : res.results || [];
      setSongs(prev => {
        const ids = new Set(prev.map(s => s.id));
        return [...prev, ...newSongs.filter((s: Song) => !ids.has(s.id))];
      });
      setSongsPage(nextPage);
      setSongsHasMore(!!res.next);
    } finally {
      setSongsLoadingMore(false);
    }
  }

  // Paginação e infinite scroll para setlists
  const [setlistsPage, setSetlistsPage] = useState(1);
  const [setlistsHasMore, setSetlistsHasMore] = useState(true);
  const [setlistsLoadingMore, setSetlistsLoadingMore] = useState(false);
  const setlistsObserver = useRef<IntersectionObserver | null>(null);
  const lastSetlistRef = (node: HTMLDivElement | null) => {
    if (setlistsLoadingMore) return;
    if (setlistsObserver.current) setlistsObserver.current.disconnect();
    setlistsObserver.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && setlistsHasMore) {
        loadMoreSetlists();
      }
    });
    if (node) setlistsObserver.current.observe(node);
  };

  // Função para carregar mais setlists (infinite scroll)
  async function loadMoreSetlists() {
    setSetlistsLoadingMore(true);
    try {
      const nextPage = setlistsPage + 1;
      const res = await getUserSetlists(nextPage);
      const newSetlists = Array.isArray(res) ? res : res.results || [];
      setSetlists(prev => {
        const ids = new Set(prev.map((s: any) => s.id));
        return [...prev, ...newSetlists.filter((s: any) => !ids.has(s.id))];
      });
      setSetlistsPage(nextPage);
      setSetlistsHasMore(!!res.next);
    } finally {
      setSetlistsLoadingMore(false);
    }
  }

  // Calcula o tempo total de prática somando a duração de cada música em cada setlist
  function getPracticeTimeFromSetlists(setlists: any[]): string {
    let totalSeconds = 0;
    setlists.forEach((setlist) => {
      if (setlist.songs && Array.isArray(setlist.songs)) {
        setlist.songs.forEach((song: any) => {
          // Considera formato 'mm:ss' ou 'hh:mm:ss'
          if (song.duration) {
            const parts = song.duration.split(':').map(Number);
            let seconds = 0;
            if (parts.length === 3) {
              seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              seconds = parts[0] * 60 + parts[1];
            }
            totalSeconds += seconds;
          }
        });
      }
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}` : `${minutes}min`;
  }

  // Estatísticas reais ou mockadas
  const userStats: UserStats = musicStats ? {
    totalSongs: musicStats.totalSongs || 0,
    totalSetlists: musicStats.playlists,
    practiceTime: getPracticeTimeFromSetlists(setlists),
    favoriteGenre: musicStats.favorite_genre || 'Rock',
    weeklyGoal: musicStats.weekly_goal || 10,
    currentStreak: musicStats.current_streak || 0,
    level: musicStats.level || 1,
    experience: musicStats.experience || 0,
    maxExperience: musicStats.max_experience || 1000
  } : {
    totalSongs: 0,
    totalSetlists: 0,
    practiceTime: '0h',
    favoriteGenre: '',
    weeklyGoal: 0,
    currentStreak: 0,
    level: 0,
    experience: 0,
    maxExperience: 0
  };

  // Recentes: usa as músicas reais se disponíveis
  const recentSongs: Song[] = songs.length > 0 ? songs.slice(0, 3).map((s: any) => ({
    id: s.id,
    title: s.title,
    artist: s.artist || '-',
    key: s.key || '-',
    bpm: s.bpm || 0,
    genre: s.genre || '-',
    duration: s.duration || '-',
    isFavorite: !!s.is_favorite,
    playCount: s.play_count || 0,
    lastPlayed: s.last_played ? new Date(s.last_played) : undefined
  })) : []


  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      try {
        const [songsData, setlistsData, statsData] = await Promise.all([
          getUserSongs(1),
          getUserSetlists(1),
          getMusicStats(),
        ]);
        const initialSongs = Array.isArray(songsData) ? songsData : songsData.results || [];
        setSongs(initialSongs);
        const initialSetlists = Array.isArray(setlistsData) ? setlistsData : setlistsData.results || [];
        setSetlists(initialSetlists);
        setMusicStats(statsData);
        setSongsPage(1);
        setSetlistsPage(1);
        setSongsHasMore(!!songsData.next);
        setSetlistsHasMore(!!setlistsData.next);
      } catch (e) {
        showNotification({
          color: 'red',
          title: 'Erro ao carregar dados',
          message: 'Não foi possível carregar suas músicas e setlists. Tente novamente mais tarde.',
          autoClose: 5000,
        });
        console.log('Erro ao buscar dados do perfil:', e);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Estado local para edição do perfil (deve ficar ANTES do if (!user))
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEditFirstName(user.first_name || '');
      setEditLastName(user.last_name || '');
    }
  }, [user, editModalOpen]);

  if (!user) {
    router.push('/login');
    return null;
  }

  const planName = isPro ? 'PRO' : (subscription?.plan?.name || 'Gratuito');
  const planColor = isPro ? 'blue' : (subscription ? 'yellow' : 'gray');


  const StatCard = ({ icon, value, label, color = 'blue' }: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    color?: string;
  }) => (
    <Paper p="md" radius="md" withBorder>
      <Group>
        <ThemeIcon size={40} radius="md" color={color}>
          {icon}
        </ThemeIcon>
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

  // Função para compartilhar música
  function handleShareSong(song: Song) {
    const url = `${window.location.origin}/player?id=${song.id}`;
    const shareText = `🎵 ${song.title} - ${song.artist}\nTom: ${song.key} | BPM: ${song.bpm} | Duração: ${song.duration}\nOuça no Setlistify: ${url}`;
    if (navigator.share) {
      navigator.share({
        title: `${song.title} - ${song.artist}`,
        text: shareText,
        url
      });
    } else {
      // fallback: copia para área de transferência
      navigator.clipboard.writeText(shareText);
      showNotification({
        title: 'Link copiado!',
        message: 'Informações da música copiadas para compartilhar.',
        color: 'blue'
      });
    }
  }

  const SongCard = ({ song }: { song: Song }) => (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <div style={{ flex: 1 }}>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm" truncate>
              {song.title}
            </Text>
            {song.isFavorite && (
              <IconHeart size={16} color="red" fill="red" />
            )}
          </Group>
          <Group gap="xs">
            <Badge size="xs" color="blue">
              {song.key}
            </Badge>
            <Badge size="xs" color="green">
              {song.bpm} BPM
            </Badge>
            <Text size="xs" c="dimmed">
              {song.duration}
            </Text>
          </Group>
        </div>
        <Group gap="xs">
          <ActionIcon variant="subtle" size="sm" onClick={() => router.push(`/player?id=${song.id}${song.youtubeId ? `&youtubeId=${song.youtubeId}` : ''}`)}>
            <IconPlayerPlay size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm" onClick={() => handleShareSong(song)}>
            <IconShare size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );

  // const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
  //   <Paper
  //     p="md"
  //     radius="md"
  //     withBorder
  //     opacity={achievement.unlocked ? 1 : 0.6}
  //     style={{
  //       backgroundColor: achievement.unlocked ? undefined : 'var(--mantine-color-gray-0)',
  //       borderColor: achievement.unlocked ? 'var(--mantine-color-blue-4)' : undefined
  //     }}
  //   >
  //     <Group>
  //       <ThemeIcon
  //         size={40}
  //         radius="md"
  //         color={achievement.unlocked ? 'blue' : 'gray'}
  //       >
  //         {achievement.unlocked ? achievement.icon : <IconX size={20} />}
  //       </ThemeIcon>
  //       <div style={{ flex: 1 }}>
  //         <Text fw={500} size="sm">
  //           {achievement.title}
  //         </Text>
  //         <Text size="xs" c="dimmed">
  //           {achievement.description}
  //         </Text>
  //         {achievement.progress && achievement.maxProgress && (
  //           <Progress
  //             value={(achievement.progress / achievement.maxProgress) * 100}
  //             size="xs"
  //             mt="xs"
  //             color="blue"
  //           />
  //         )}
  //       </div>
  //       {achievement.unlocked && (
  //         <ActionIcon color="blue" variant="light" size="sm">
  //           <IconCheck size={16} />
  //         </ActionIcon>
  //       )}
  //     </Group>
  //   </Paper>
  // );

  // Função utilitária para calcular duração total de um setlist
  function getSetlistTotalDuration(songs: Song[] = []): string {
    let totalSeconds = 0;
    songs.forEach((song) => {
      if (song.duration) {
        const parts = song.duration.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 3) {
          seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          seconds = parts[0] * 60 + parts[1];
        }
        totalSeconds += seconds;
      }
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}` : `${minutes}min`;
  }

  // Handler para abrir modal de edição de perfil
  function handleEditProfile() {
    setEditModalOpen(true);
  }

  // Função para salvar edição do perfil
  async function handleSaveProfile() {
    setEditLoading(true);
    try {
      await updateUserProfile(
        user.id,
        {
          first_name: editFirstName,
          last_name: editLastName
        });
      showNotification({
        title: 'Perfil atualizado',
        message: 'Suas informações foram salvas com sucesso!',
        color: 'green'
      });
      setEditModalOpen(false);
      window.location.reload();
    } catch (e) {
      showNotification({
        title: 'Erro',
        message: 'Não foi possível atualizar o perfil.',
        color: 'red'
      });
      console.log('Erro ao salvar perfil:', e);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <AppLayout>
      {
        loadingData && <LoadingOverlay visible={loadingData} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      }
      <Container size="lg" py="xl">
        {/* Header do Perfil */}
        <Card shadow="md" p="xl" radius="md" withBorder mb="xl">
          <Group align="flex-start" gap="xl">
            <Box pos="relative">
              <Avatar
                size={120}
                radius="xl"
                color="blue"
                style={{ fontSize: 48, fontWeight: 700 }}
              >
                {user.email[0]?.toUpperCase()}
              </Avatar>
              <ActionIcon
                pos="absolute"
                bottom={0}
                right={0}
                color="blue"
                size="sm"
                onClick={handleEditProfile}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Box>

            <Stack gap="sm" style={{ flex: 1 }}>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={2} mb="xs">
                    {user.email.split('@')[0]}
                  </Title>
                  <Group gap="sm" mb="xs">
                    <Badge
                      color={planColor}
                      size="lg"
                      radius="sm"
                      variant="filled"
                      leftSection={isPro ? <IconCrown size={16} /> : undefined}
                    >
                      {planName}
                    </Badge>
                    {/* <Badge color="gray" size="md" variant="light">
                      Nível {userStats.level}
                    </Badge> */}
                  </Group>
                  <Text size="sm" c="dimmed" mb="sm">
                    Apaixonado por música e performance. Sempre criando setlists únicas para cada ocasião.
                  </Text>
                  <Group gap="sm">
                    <Text size="sm" c="dimmed">
                      <IconCalendar size={16} style={{ marginRight: 4 }} />
                      Membro desde {new Date(user.date_joined).toLocaleDateString('pt-BR')}
                    </Text>
                    <Text size="sm" c="dimmed">
                      <IconMail size={16} style={{ marginRight: 4 }} />
                      {user.email}
                    </Text>
                  </Group>
                </div>

                {/* <Group gap="sm">
                  <Button leftSection={<IconDownload size={16} />} onClick={handleExportData}>
                    Exportar Dados
                  </Button>
                  <Button
                    variant="outline"
                    leftSection={<IconUpload size={16} />}
                    onClick={handleImportSetlists}
                  >
                    Importar Setlists
                  </Button>
                </Group> */}
              </Group>

              {/* Barra de Progresso do Nível */}
              {/* <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>Progresso do Nível</Text>
                  <Text size="sm" c="dimmed">
                    {userStats.experience}/{userStats.maxExperience} XP
                  </Text>
                </Group>
                <Progress
                  value={(userStats.experience / userStats.maxExperience) * 100}
                  size="md"
                  color="blue"
                  radius="md"
                />
              </Box> */}
            </Stack>
          </Group>
        </Card>

        {/* Estatísticas */}
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md" mb="xl">
          <StatCard
            icon={<IconMusic size={24} />}
            value={userStats.totalSongs}
            label="Músicas"
            color="blue"
          />
          <StatCard
            icon={<IconPlaylist size={24} />}
            value={userStats.totalSetlists}
            label="Setlists Criados"
            color="green"
          />
          <StatCard
            icon={<IconClock size={24} />}
            value={userStats.practiceTime}
            label="Tempo de Prática"
            color="orange"
          />
          <StatCard
            icon={<IconKey size={24} />}
            value={musicStats?.mostCommonKey || '-'}
            label="Tom mais comum"
            color="violet"
          />
          <StatCard
            icon={<IconFlame size={24} />}
            value={musicStats?.avgBPM ? Math.round(musicStats.avgBPM) : '-'}
            label="BPM médio"
            color="red"
          />
        </SimpleGrid>

        {/* Tabs de Conteúdo */}
        <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
              Visão Geral
            </Tabs.Tab>
            <Tabs.Tab value="songs" leftSection={<IconMusic size={16} />}>
              Minhas Músicas
            </Tabs.Tab>
            <Tabs.Tab value="setlists" leftSection={<IconPlaylist size={16} />}>
              Setlists
            </Tabs.Tab>
          </Tabs.List>

          {/* Visão Geral */}
          <Tabs.Panel value="overview" pt="md">
            <Grid>
              <Grid.Col>
                <Card shadow="sm" p="md" radius="md" withBorder mb="md">
                  <Group justify="space-between" mb="md">
                    <Title order={4}>Atividade Recente</Title>
                    <Anchor size="sm" href="#" onClick={(e) => { e.preventDefault(); router.push('/songs'); }}>
                      Ver tudo
                    </Anchor>
                  </Group>
                  <Stack gap="sm">
                    {recentSongs.map((song) => (
                      <SongCard key={song.id} song={song} />
                    ))}
                  </Stack>
                </Card>
              </Grid.Col>

              {/* <Grid.Col span={{ base: 12, md: 4 }}>
                <Card shadow="sm" p="md" radius="md" withBorder mb="md">
                  <Title order={4} mb="md">Meta Semanal</Title>
                  <Center>
                    <RingProgress
                      size={120}
                      thickness={12}
                      sections={[
                        { value: (userStats.currentStreak / userStats.weeklyGoal) * 100, color: 'blue' }
                      ]}
                      label={
                        <Text ta="center" size="xl" fw={700}>
                          {userStats.currentStreak}/{userStats.weeklyGoal}
                        </Text>
                      }
                    />
                  </Center>
                  <Text ta="center" size="sm" c="dimmed" mt="md">
                    Dias de prática esta semana
                  </Text>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder>
                  <Title order={4} mb="md">Gênero Favorito</Title>
                  <Group>
                    <ThemeIcon size={40} color="violet">
                      <IconMusic size={24} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500}>{userStats.favoriteGenre}</Text>
                      <Text size="sm" c="dimmed">
                        60% das suas músicas
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Grid.Col> */}
            </Grid>
          </Tabs.Panel>

          {/* Minhas Músicas */}
          <Tabs.Panel value="songs" pt="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={4}>Minhas Músicas ({userStats.totalSongs})</Title>
                <Button size="sm" leftSection={<IconMusic size={16} />} onClick={() => router.push('/songs/add')}>
                  Adicionar Música
                </Button>
              </Group>
              <Box style={{ maxHeight: 400, overflowY: 'auto' }}>
                <InfiniteScrollWrapper
                  dataLength={songs.length}
                  next={loadMoreSongs}
                  hasMore={songsHasMore}
                  loader={<Text ta="center">Carregando mais músicas...</Text>}
                  style={{ overflow: 'visible' }}
                >
                  <Stack gap="sm">
                    {songs.map((song, idx) => (
                      <div key={song.id} ref={idx === songs.length - 1 ? lastSongRef : undefined}>
                        <SongCard song={song} />
                      </div>
                    ))}
                  </Stack>
                </InfiniteScrollWrapper>
                {!songsHasMore && !songsLoadingMore && (
                  <Text ta="center" c="dimmed" mt="md">Todas as músicas carregadas.</Text>
                )}
              </Box>
            </Card>
          </Tabs.Panel>

          {/* Setlists */}
          <Tabs.Panel value="setlists" pt="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={4}>Meus Setlists ({userStats.totalSetlists})</Title>
                <Button size="sm" leftSection={<IconPlaylist size={16} />} onClick={() => router.push('/setlists/add')}>
                  Novo Setlist
                </Button>
              </Group>
              {setlists && setlists.length > 0 ? (
                <Box style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <InfiniteScrollWrapper
                    dataLength={setlists.length}
                    next={loadMoreSetlists}
                    hasMore={setlistsHasMore}
                    loader={<Text ta="center">Carregando mais setlists...</Text>}
                    style={{ overflow: 'visible' }}
                  >
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      {setlists.map((setlist: any, idx: number) => (
                        <div key={setlist.id} ref={idx === setlists.length - 1 ? lastSetlistRef : undefined}>
                          <Paper p="md" radius="md" withBorder shadow="xs" style={{ minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <Text fw={600} size="md" mb="xs" truncate>{setlist.name || setlist.title || 'Setlist sem nome'}</Text>
                              <Text size="xs" c="dimmed" mb="xs">
                                {setlist.songs ? `${setlist.songs.length} músicas` : '0 músicas'}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Duração total: {getSetlistTotalDuration(setlist.songs)}
                              </Text>
                            </div>
                            <Group justify="space-between" mt="8">
                              <Button fullWidth size="xs" variant="light" leftSection={<IconPlaylist size={16} />} onClick={() => router.push(`/setlists/${setlist.id}`)}>
                                Ver Setlist
                              </Button>
                            </Group>
                          </Paper>
                        </div>
                      ))}
                    </SimpleGrid>
                  </InfiniteScrollWrapper>
                  {!setlistsHasMore && !setlistsLoadingMore && (
                    <Text ta="center" c="dimmed" mt="md">Todos os setlists carregados.</Text>
                  )}
                </Box>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Seus setlists aparecerão aqui
                </Text>
              )}
            </Card>
          </Tabs.Panel>

        </Tabs>

        {/* Destaques do Setlistify */}
        <Card shadow="sm" p="md" radius="md" withBorder mt="xl">
          <Title order={4} mb="md">Destaques do Setlistify</Title>
          <Carousel slideSize="60%" height={180} align="start" slideGap="md" loop withIndicators>
            <Carousel.Slide>
              <Paper p="md" shadow="sm" radius="md" h="100%">
                <Text fw={700}>Acesso a cifras sincronizadas</Text>
                <Text size="sm" color="dimmed">Visualize acordes em tempo real enquanto toca suas músicas favoritas.</Text>
              </Paper>
            </Carousel.Slide>
            <Carousel.Slide>
              <Paper p="md" shadow="sm" radius="md" h="100%">
                <Text fw={700}>Pads e sons ambientes</Text>
                <Text size="sm" color="dimmed">Crie atmosferas únicas com pads exclusivos para cada tom.</Text>
              </Paper>
            </Carousel.Slide>
            <Carousel.Slide>
              <Paper p="md" shadow="sm" radius="md" h="100%">
                <Text fw={700}>Monte e compartilhe setlists</Text>
                <Text size="sm" color="dimmed">Organize suas músicas e compartilhe listas com sua banda.</Text>
              </Paper>
            </Carousel.Slide>
            <Carousel.Slide>
              <Paper p="md" shadow="sm" radius="md" h="100%">
                <Text fw={700}>Assinatura PRO</Text>
                <Text size="sm" color="dimmed">Desbloqueie todos os recursos e tenha a melhor experiência musical.</Text>
              </Paper>
            </Carousel.Slide>
          </Carousel>
        </Card>
      </Container>

      {/* Modal de Edição de Perfil */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Perfil"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Nome"
            placeholder="Digite seu nome"
            value={editFirstName}
            onChange={e => setEditFirstName(e.currentTarget.value)}
          />
          <TextInput
            label="Sobrenome"
            placeholder="Digite seu sobrenome"
            value={editLastName}
            onChange={e => setEditLastName(e.currentTarget.value)}
          />
          <TextInput
            label="E-mail"
            value={user.email}
            disabled
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={editLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProfile} loading={editLoading}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppLayout>
  );
}