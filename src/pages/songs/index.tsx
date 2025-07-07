/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ActionIcon, Button, Container, Grid, Group, LoadingOverlay, Modal, MultiSelect, Select, Stack, Text, TextInput, Title } from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { IconFilter, IconPlus, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import MusicCard from "@/components/MusicCard";
import OrderSelect from "@/components/OrderSelect";
import api from "../../../lib/axios";
import InfiniteScrollWrapper from "@/components/InfiniteScrollWrapper";

interface SongApi {
  id: number;
  title: string;
  artist?: string;
  duration?: string;
  bpm?: number | null;
  chords_url?: string;
  thumbnail_url?: string;
  description?: string;
  key?: string;
}

interface SetlistApi {
  id: number;
  name: string;
}

const KEY_OPTIONS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
].map(k => ({ value: k, label: k }));

export default function DashboardPage() {
  const [songs, setSongs] = useState<SongApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // valor realmente buscado
  const [searchInput, setSearchInput] = useState(""); // valor do input
  const [page, setPage] = useState(1);
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState<string | null>(null);
  const [bpm, setBpm] = useState<[number, number]>([40, 220]);
  const [setlists, setSetlists] = useState<SetlistApi[]>([]);
  const [selectedSetlists, setSelectedSetlists] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [order, setOrder] = useState("-created_at");
  const [hasMore, setHasMore] = useState(true);

  const [totalSongs, setTotalSongs] = useState(0);
  const [totalSetlists, setTotalSetlists] = useState(0);

  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)');

  useEffect(() => {
    api.get("setlists/").then(res => {
      setSetlists(res.data.results || []);
      setTotalSetlists(res.data.count || 0);
    });
  }, []);

  // Debounce para busca
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput.length === 0 || searchInput.length >= 3) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchSongs = async (append = false) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (artist) params.append("artist", artist);
    if (key) params.append("key", key);
    if (bpm[0] !== 40) params.append("bpm_min", String(bpm[0]));
    if (bpm[1] !== 220) params.append("bpm_max", String(bpm[1]));
    if (selectedSetlists.length > 0) params.append("setlist", selectedSetlists.join(","));
    params.append("page", String(page));
    if (order) params.append("ordering", order);
    api.get(`songs/?${params.toString()}`)
      .then(res => {
        if (append) {
          setSongs(prev => [...prev, ...(res.data.results || res.data)]);
        } else {
          setSongs(res.data.results || res.data);
        }
        setTotalSongs(res.data.count || 0);
        setHasMore(!!res.data.next);
      })
      .finally(() => setLoading(false));
  };

  // Scroll infinito: carrega mais ao chegar no fim
  const loadMore = () => {
    setPage(prev => prev + 1);
    // Removido fetchSongs(true) para evitar duplicidade
  };

  useEffect(() => {
    setPage(1);
    fetchSongs();
    // eslint-disable-next-line
  }, [search, artist, key, bpm, selectedSetlists, order]);

  useEffect(() => {
    if (page > 1) {
      fetchSongs(true);
    }
    // eslint-disable-next-line
  }, [page]);

  const orderOptions = [
    { value: "-created_at", label: "Mais recente" },
    { value: "created_at", label: "Mais antigo" },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        {/*
          IMPORTANTE: Para evitar múltiplos scrolls, não defina height ou overflow no Container ou no InfiniteScrollWrapper.
          O scroll infinito já usa o scroll global (window) por padrão.
        */}
        <Container size="100%" py="md" /* style={{ overflow: 'visible' }} */>
          <Group justify="space-between" mb="md" style={{ flexWrap: 'wrap' }}>
            <Title order={2}>Minhas Músicas</Title>
            <Button
              leftSection={<IconPlus />}
              onClick={() => {
                router.push("/addmusic");
              }}
              color="blue"
              style={{ marginLeft: 'auto' }}
            >
              Adicionar Música
            </Button>
          </Group>
          <Group mb="md" gap="xs" align="center" style={{ width: '100%' }}>
            <Text size="sm" color="dimmed">
              Total de {totalSongs} música{totalSongs !== 1 ? 's' : ''}
            </Text>
            <Text size="sm" color="dimmed">|</Text>
            <Text size="sm" color="dimmed">
              {totalSetlists} setlist{totalSetlists !== 1 ? 's' : ''}
            </Text>
          </Group>
          {/* Barra de busca e filtros */}

          {isMobile ? (
            <Stack mb="md" gap="xs">
              <Group gap="xs" align="center" style={{ width: '100%' }}>
                <TextInput
                  placeholder="Buscar por título..."
                  leftSection={<IconSearch size={18} />}
                  value={searchInput}
                  onChange={e => setSearchInput(e.currentTarget.value)}
                  style={{ flex: 7, minWidth: 0 }}
                />
                <ActionIcon variant="light" color="blue" size="lg" onClick={() => setModalOpen(true)} title="Filtros avançados">
                  <IconFilter size={20} />
                </ActionIcon>
              </Group>
              <OrderSelect value={order} onChange={v => {
                setPage(1);
                setOrder(v || "-created_at")
              }} options={orderOptions} />
            </Stack>
          ) : (
            <Group mb="md" align="center">
              <TextInput
                placeholder="Buscar por título..."
                leftSection={<IconSearch size={18} />}
                value={searchInput}
                onChange={e => setSearchInput(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <OrderSelect value={order} onChange={v => {
                setPage(1);
                setOrder(v || "-created_at")
              }} options={orderOptions} />
              <ActionIcon variant="light" color="blue" size="lg" onClick={() => setModalOpen(true)} title="Filtros avançados">
                <IconFilter size={20} />
              </ActionIcon>
            </Group>
          )}
          <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Filtros avançados" centered>
            <Stack>
              <Text size="sm" fw={500}>Tom</Text>
              <Select
                placeholder="Tom"
                data={KEY_OPTIONS}
                value={key}
                onChange={v => setKey(v)}
                clearable
                mb="sm"
              />
              <Text size="sm" fw={500}>Setlists</Text>
              <MultiSelect
                placeholder="Setlists"
                data={setlists.map(s => ({ value: String(s.id), label: s.name }))}
                value={selectedSetlists}
                onChange={v => setSelectedSetlists(v)}
                clearable
                mb="sm"
              />
              <Group mt="md" justify="flex-end">
                <Button variant="default" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button variant="outline" color="gray" onClick={() => {
                  setArtist("");
                  setKey(null);
                  setBpm([40, 220]);
                  setSelectedSetlists([]);
                }}>Limpar filtros</Button>
                <Button onClick={() => { setPage(1); setModalOpen(false); }}>Filtrar</Button>
              </Group>
            </Stack>
          </Modal>
          {loading && page === 1 ? (
            <Group justify="center" py="xl"><LoadingOverlay
              visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }}
            /></Group>
          ) : songs.length === 0 ? (
            <Text ta="center" color="dimmed">Nenhuma música encontrada.</Text>
          ) : (
            <InfiniteScrollWrapper
              dataLength={songs.length}
              next={loadMore}
              hasMore={hasMore}
              style={{
                overflow: 'auto',
                overflowX: 'hidden',
                height: '100%', // Ajuste conforme necessário
                //esconder os scroll
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // Internet Explorer 10+
              }}
              loader={<LoadingOverlay />}>
              <Grid>
                {songs.map(song => (
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
            </InfiniteScrollWrapper>
          )}
        </Container>
      </AppLayout>
    </ProtectedRoute>
  );
}
