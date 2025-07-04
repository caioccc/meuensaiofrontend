/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ActionIcon, Button, Container, Grid, Group, Loader, Modal, MultiSelect, Pagination, RangeSlider, Select, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconFilter, IconPlus, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../lib/axios";
import MusicCard, { MusicCardProps } from "../components/MusicCard";
import MusicPreviewModal from "../components/MusicPreviewModal";
import OrderSelect from "../components/OrderSelect";
import { useMediaQuery } from '@mantine/hooks';

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
  const [total, setTotal] = useState(1);
  const [preview, setPreview] = useState<MusicCardProps | null>(null);
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState<string | null>(null);
  const [bpm, setBpm] = useState<[number, number]>([40, 220]);
  const [setlists, setSetlists] = useState<SetlistApi[]>([]);
  const [selectedSetlists, setSelectedSetlists] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [order, setOrder] = useState("-created_at");

  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)');

  useEffect(() => {
    api.get("setlists/").then(res => setSetlists(res.data.results || res.data));
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

  useEffect(() => {
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
        setSongs(res.data.results || res.data);
        setTotal(res.data.count ? Math.ceil(res.data.count / 10) : 1);
      })
      .finally(() => setLoading(false));
  }, [search, artist, key, bpm, selectedSetlists, page, order]);

  const orderOptions = [
    { value: "-created_at", label: "Mais recente" },
    { value: "created_at", label: "Mais antigo" },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <Container size="100%" py="md">
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
              <OrderSelect value={order} onChange={v => setOrder(v || "-created_at")} options={orderOptions} />
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
              <OrderSelect value={order} onChange={v => setOrder(v || "-created_at")} options={orderOptions} />
              <ActionIcon variant="light" color="blue" size="lg" onClick={() => setModalOpen(true)} title="Filtros avançados">
                <IconFilter size={20} />
              </ActionIcon>
            </Group>
          )}
          <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Filtros avançados" centered>
            <Stack>
              <Text size="sm" fw={500}>Artista</Text>
              <TextInput
                placeholder="Artista"
                value={artist}
                onChange={e => setArtist(e.currentTarget.value)}
                mb="sm"
              />
              <Text size="sm" fw={500}>Tom</Text>
              <Select
                placeholder="Tom"
                data={KEY_OPTIONS}
                value={key}
                onChange={v => setKey(v)}
                clearable
                mb="sm"
              />
              <Text size="sm" fw={500}>BPM</Text>
              <RangeSlider
                min={40}
                max={220}
                value={bpm}
                onChange={v => setBpm(v as [number, number])}
                label={val => `${val} bpm`}
                marks={[
                  { value: 60, label: '60' },
                  { value: 120, label: '120' },
                  { value: 180, label: '180' },
                  { value: 220, label: '220' },
                ]}
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
              <Group mt="md" position="right">
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
          {loading ? (
            <Group justify="center" py="xl"><Loader /></Group>
          ) : songs.length === 0 ? (
            <Text align="center" color="dimmed">Nenhuma música encontrada.</Text>
          ) : (
            <Grid>
              {songs.map(song => (
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
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={total} />
          </Group>
          <MusicPreviewModal opened={!!preview} onClose={() => setPreview(null)} music={preview} />
        </Container>
      </AppLayout>
    </ProtectedRoute>
  );
}
