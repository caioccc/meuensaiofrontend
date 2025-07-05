/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ActionIcon, Badge, Button, Container, Grid, Group, Loader, LoadingOverlay, Menu, Modal, MultiSelect, NumberInput, ScrollArea, SegmentedControl, Select, Stack, Text, TextInput, Timeline, Title, Tooltip } from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconClock, IconEdit, IconEye, IconFilter, IconLayoutGrid, IconList, IconMusic, IconPlayerPlay, IconPlus, IconSearch, IconTable, IconTrash, IconWaveSine } from "@tabler/icons-react";
import { DataTable } from 'mantine-datatable';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../lib/axios";
import InfiniteScrollWrapper from "../components/InfiniteScrollWrapper";
import { ListView } from "../components/ListView";
import MusicCard from "../components/MusicCard";
import OrderSelect from "../components/OrderSelect";

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
  custom_bpm?: number | null;
  custom_key?: string | null;
  youtube_id?: string;
  published_time?: string;
  view_count?: number;
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
  const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'table'>('gallery');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongApi | null>(null);

  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)');

  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editBpm, setEditBpm] = useState<number | ''>(bpm ?? '');
  const [editKey, setEditKey] = useState<string>(key ?? '');
  const [history, setHistory] = useState<{ setlists: any[]; song: any } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Handler para remover música com notificação
  const handleDelete = async () => {
    setLoadingDelete(true);
    try {
      await api.delete(`songs/${selectedSong?.id}/`);
      setSongs(songs => songs.filter(s => s.id !== selectedSong?.id));
      notifications.show({
        color: 'green',
        title: 'Removida',
        message: 'Música removida com sucesso!',
        icon: <IconTrash size={18} />, position: 'top-right', autoClose: 2000
      });
    } catch {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Erro ao remover música',
        icon: <IconTrash size={18} />, position: 'top-right', autoClose: 2000
      });
    } finally {
      setLoadingDelete(false);
      setRemoveModalOpen(false);
    }
  };

  // Handler para editar música
  const handleEdit = async () => {
    setLoadingEdit(true);
    try {
      await api.patch(`/songs/${selectedSong?.id}/`, { custom_bpm: editBpm, custom_key: editKey });
      notifications.show({
        color: 'green',
        title: 'Atualizada',
        message: 'Música atualizada com sucesso!',
        icon: <IconEdit size={18} />, position: 'top-right', autoClose: 2000
      });
      setEditModalOpen(false);
    } catch {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Erro ao atualizar música',
        icon: <IconEdit size={18} />, position: 'top-right', autoClose: 2000
      });
    } finally {
      setLoadingEdit(false);
      setEditModalOpen(false);
    }
  };

  useEffect(() => {
    api.get("setlists/").then(res => setSetlists(res.data.results || res.data));
  }, []);


  useEffect(() => {
    if (editModalOpen && selectedSong) {
      setLoadingHistory(true);
      api.get(`/songs/${selectedSong.id}/history/`).then(res => {
        setHistory(res.data);
      }).finally(() => setLoadingHistory(false));
    }
  }, [editModalOpen, selectedSong]);

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
          <Group mb="md" align="center" justify="space-between" style={{ flexWrap: 'wrap' }}>
            <Group style={{ flex: 1, minWidth: 0 }}>
              {isMobile ? (
                <Stack gap="xs" style={{ width: '100%' }}>
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
                <Group align="center" style={{ flex: 1, minWidth: 0 }}>
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
            </Group>
          </Group>
          <Group mb="md" gap="xs" justify="flex-end" style={{ flexWrap: 'wrap' }}>
            <Text size="sm" fw={500}>Exibir como:</Text>
            <SegmentedControl
              value={viewMode}
              onChange={(v) => {
                setPage(1);
                setArtist("");
                setKey(null);
                setBpm([40, 220]);
                setSelectedSetlists([]);
                setViewMode(v);
              }}
              data={[
                { label: <IconLayoutGrid size={18} />, value: 'gallery' },
                { label: <IconList size={18} />, value: 'list' },
                { label: <IconTable size={18} />, value: 'table' },
              ]}
            />
          </Group>
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
                height: '100%',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              loader={<LoadingOverlay />}
            >
              {viewMode === 'gallery' && (

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
                        viewMode={viewMode}
                        onDelete={async () => {
                          await api.delete(`songs/${song.id}/`);
                          setSongs(songs => songs.filter(s => s.id !== song.id));
                        }}
                      />
                    </Grid.Col>
                  ))}
                </Grid>

              )}
              {viewMode === 'list' && (
                <ListView
                  items={songs}
                  getItemId={s => s.id}
                  getImageUrl={s => s.thumbnail_url}
                  fallbackIcon={null}
                  renderContent={s => (
                    <Stack gap={2}>
                      <Tooltip label={s.title} withArrow>
                        <Text fw={500} size="sm" lineClamp={2}>{s.title}</Text>
                      </Tooltip>
                      {/* {s.published_time && <Text size="xs" c="dimmed" lineClamp={2}>{s.published_time}</Text>} */}
                      {/* {s.view_count && <Text size="sm" c="dimmed">{s.view_count}</Text>} */}
                      {s.bpm && <Badge color={'blue'} leftSection={<IconWaveSine size={14} />}>{s.bpm} BPM</Badge>}
                      {s.key && <Badge color="teal" leftSection={<IconMusic size={14} />}>Tom: {s.key}</Badge>}
                      {s.duration && (
                        <Badge color="gray" leftSection={<IconClock size={14} />}>{s.duration}</Badge>
                      )}
                    </Stack>
                  )}
                  renderActions={s => (
                    <>
                      <Menu.Item leftSection={<IconPlayerPlay size={16} />} onClick={() => router.push({ pathname: '/player', query: { youtubeId: s.id, id: s.id } })}>
                        Tocar música
                      </Menu.Item>
                      <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => {
                        setSelectedSong(s);
                        setEditModalOpen(true);
                        setEditBpm(s.bpm ?? '');
                        setEditKey(s.key ?? '');
                      }}>
                        Editar música
                      </Menu.Item>
                      <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => {
                        setSelectedSong(s);
                        setRemoveModalOpen(true);
                      }}>
                        Remover
                      </Menu.Item>
                    </>
                  )}
                />
              )}
              {viewMode === 'table' && (
                <DataTable
                  withBorder
                  borderRadius="md"
                  highlightOnHover
                  verticalSpacing="sm"
                  horizontalSpacing="md"
                  minHeight={200}
                  noRecordsText="Nenhuma música encontrada."
                  columns={[
                    { accessor: 'title', title: 'Título', width: 180, sortable: true },
                    { accessor: 'duration', title: 'Duration', width: 140, sortable: true, render: s => s.duration || '-' },
                    { accessor: 'bpm', title: 'BPM', width: 80, sortable: true, render: s => s.bpm || '-' },
                    { accessor: 'key', title: 'Tom', width: 80, sortable: true, render: s => s.key || '-' },
                    {
                      accessor: 'actions',
                      title: '',
                      width: 130,
                      render: (s: SongApi) => (
                        <Group gap={4}>
                          <Tooltip label="Tocar música" withArrow>
                            <Button size="xs" variant="light" color="blue" onClick={() => router.push({ pathname: '/player', query: { youtubeId: s.id, id: s.id } })}><IconPlayerPlay size={16} /></Button>
                          </Tooltip>
                          <Tooltip label="Ver detalhes" withArrow>
                            <Button size="xs" variant="light" color="gray" onClick={() => {
                              setSelectedSong(s);
                              setEditModalOpen(true);
                              setEditBpm(s.custom_bpm ?? s.bpm ?? '');
                              setEditKey(s.custom_key ?? s.key ?? '');
                            }}><IconEdit size={16} /></Button>
                          </Tooltip>
                          <Tooltip label="Remover música" withArrow>
                            <Button size="xs" variant="light" color="red" onClick={async () => {
                              setSelectedSong(s);
                              setRemoveModalOpen(true);
                            }}>
                              <IconTrash size={16} />
                            </Button>
                          </Tooltip>
                        </Group>
                      ),
                    },
                  ]}
                  records={songs}
                  totalRecords={songs.length}
                  styles={{ table: { fontSize: 15 } }}
                  responsive
                  fetching={loading}
                  pagination={false}
                />
              )}
            </InfiniteScrollWrapper>
          )}
        </Container>
        <Modal opened={removeModalOpen} onClose={() => setRemoveModalOpen(false)} title="Remover música" centered>
          <Stack>
            <Text>Tem certeza que deseja remover {selectedSong?.title}?</Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setRemoveModalOpen(false)}>Cancelar</Button>
              <Button color="red" onClick={handleDelete} loading={loadingDelete}>Remover</Button>
            </Group>
          </Stack>
        </Modal>

        <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar música" size={isMobile ? 'xl' : 'xl'} centered>
          <Group align="flex-start" gap="xl">
            {/* Formulário de edição */}
            <Stack style={{ minWidth: 320, flex: 1 }}>
              <Text fw={600} mb="sm">{selectedSong?.title}</Text>
              <TextInput
                label="Tom customizado"
                value={editKey}
                onChange={e => setEditKey(e.currentTarget.value)}
                placeholder="Ex: C, D#, F#m..."
                mb="md"
              />
              <NumberInput
                label="BPM customizado"
                value={editBpm}
                onChange={value => setEditBpm(value === '' ? '' : Number(value))}
                min={30}
                max={300}
                step={1}
                placeholder="Ex: 120"
              />
              <Group mt="md" justify="flex-end">
                <Button variant="default" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                <Button color="blue" loading={loadingEdit} onClick={handleEdit}>Salvar</Button>
              </Group>
            </Stack>
            {/* Histórico/timeline */}
            <Stack style={{ minWidth: 320, flex: 1, maxWidth: 420 }}>
              <Text fw={600} mb="xs">Histórico de uso</Text>
              {loadingHistory ? (
                <Loader />
              ) : history && history.setlists.length > 0 ? (
                <>
                  <Text size="sm" color="dimmed" mb="xs">{history.setlists.length} setlist{history.setlists.length > 1 ? 's' : ''} encontrad{history.setlists.length > 1 ? 'os' : 'o'}</Text>
                  <ScrollArea h={260}>
                    <Timeline active={0} bulletSize={24} lineWidth={2}>
                      {history.setlists.map((setlist, idx) => (
                        <Timeline.Item
                          key={setlist.id}
                          title={<Text fw={500}>{setlist.name}</Text>}
                          bullet={<IconEye size={16} />}
                          lineVariant={idx === 0 ? 'dashed' : 'solid'}
                        >
                          <Text size="sm" color="dimmed">{setlist.date ? format(new Date(setlist.date), 'dd/MM/yyyy') : 'Sem data'}</Text>
                          {
                            setlist.songs && setlist.songs.length > 0 ? (
                              <Text size="xs" color="dimmed">
                                {setlist.songs.map((s) => s.title).join(', ')}
                              </Text>
                            ) : (
                              <Text size="xs" color="dimmed">Nenhuma música registrada</Text>
                            )
                          }

                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </ScrollArea>
                </>
              ) : (
                <Text size="sm" color="dimmed">Nenhum histórico encontrado.</Text>
              )}
            </Stack>
          </Group>
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
