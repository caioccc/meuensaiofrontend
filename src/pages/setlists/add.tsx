/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/components/AppLayout';
import {
  Anchor,
  Breadcrumbs,
  Button,
  Card, Container, Divider,
  Group,
  Image,
  LoadingOverlay, Paper, ScrollArea,
  Stack,
  Stepper,
  Text,
  TextInput, Title,
  Tooltip
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { IconPlaylist, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../../../lib/axios';

export default function AddSetlistPage() {
  const [active, setActive] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState<any[]>([]);
  const [enriched, setEnriched] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'saved' | 'new' | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const searchResultsRef = useRef<HTMLDivElement | null>(null);

  const [hasSongs, setHasSongs] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Limpa o modal sempre que abrir
  useEffect(() => {
    setActive(0);
    setName('');
    setDescription('');
    setSearch('');
    setSearchResults([]);
    setSearchLoading(false);
    setSelected([]);
    setEnriched([]);
    setLoading(false);
    setSource(null);
    setSavedSongs([]);
    setSavedLoading(false);
    setSavedSearch('');

    setLoadingSongs(true);
    api.get('/songs/').then(res => {
      setHasSongs(res.data.results.length > 0 || res.data.count > 0);
      setLoadingSongs(false);
    }).catch(() => {
      setHasSongs(false);
      setLoadingSongs(false);
    });

  }, []);

  // Busca músicas (agora usando /api/search/)
  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const res = await api.get(`/search/?q=${encodeURIComponent(search)}`);
      setSearchResults(res.data.results || []);
      // Scrolla para o topo APENAS após busca
      setTimeout(() => {
        if (searchResultsRef.current) searchResultsRef.current.scrollTop = 0;
      }, 0);
    } finally {
      setSearchLoading(false);
    }
  };

  // Adiciona música selecionada
  const addSong = (song: any) => {
    if (source === 'new' && selected.length >= 10) {
      showNotification({
        color: 'red',
        message: 'No modo "Novo Setlist" só é permitido adicionar até 10 músicas por setlist.'
      });
      return;
    }
    if (!selected.find((s) => s.youtube_id === song.youtube_id)) {
      setSelected([...selected, song]);
    }
  };
  // Remove música selecionada (compatível com ambos os fluxos)
  const removeSong = (idOrYoutubeId: string | number) => {
    setSelected(selected.filter((s) => (s.id ?? s.youtube_id) !== idOrYoutubeId));
  };

  // Enriquecer músicas com dados do backend
  const enrichSongs = async () => {
    setLoading(true);
    try {
      const res = await api.post('/enrich-songs/', { youtube_ids: selected.map((s) => s.youtube_id) });
      //set selected to enriched results
      const selectedUpdated = selected.map((s) => {
        const enrichedSong = res.data.results.find((e: any) => e.youtube_id === s.youtube_id);
        return enrichedSong ? { ...s, ...enrichedSong } : s;
      });
      console.log(selectedUpdated);
      setEnriched(selectedUpdated);
      setActive(3);
    } catch {
      showNotification({ color: 'red', message: 'Erro ao processar músicas' });
    } finally {
      setLoading(false);
    }
  };

  // Salvar setlist
  const saveSetlist = async () => {
    setLoading(true);
    try {
      if (source === 'saved') {
        const songIds = selected.map((s) => s.id);
        const res = await api.post('/setlists/', { name, description, date: date ? date.toISOString().slice(0, 10) : undefined, songs_ids: songIds });
        if (res.status !== 201) {
          showNotification({ color: 'red', message: 'Erro ao salvar setlist' });
          return;
        }
      } else {
        const enrichedFiltered = enriched.filter((s) => s.derivedBpm && s.derivedKey);
        const res = await api.post('/setlists/', { name, description, date: date ? date.toISOString().slice(0, 10) : undefined, songs_data: enrichedFiltered });
        if (res.status !== 201) {
          showNotification({ color: 'red', message: 'Erro ao salvar setlist' });
          return;
        }
      }
      showNotification({ color: 'green', message: 'Setlist criado com sucesso!' });
      router.push('/setlists'); // Redireciona para a página de setlists
    } catch {
      showNotification({ color: 'red', message: 'Erro ao salvar setlist' });
    } finally {
      setLoading(false);
    }
  };

  // Busca músicas salvas do backend
  const [savedSongs, setSavedSongs] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedSearch, setSavedSearch] = useState('');
  const [savedPage, setSavedPage] = useState(1);
  const [savedHasMore, setSavedHasMore] = useState(true);
  const SAVED_LIMIT = 20;

  const fetchSavedSongs = async (reset = false) => {
    setSavedLoading(true);
    try {
      const page = reset ? 1 : savedPage;
      const params = new URLSearchParams({
        limit: SAVED_LIMIT.toString(),
        page: page.toString(),
      });
      if (savedSearch) params.append('search', savedSearch);
      const res = await api.get(`/songs/?${params.toString()}`);
      const results = res.data.results || [];
      if (reset) {
        setSavedSongs(results);
        setSavedPage(2);
      } else {
        setSavedSongs(prev => [...prev, ...results]);
        setSavedPage(prev => prev + 1);
      }
      setSavedHasMore(!!res.data.next);
    } finally {
      setSavedLoading(false);
    }
  };

  // Atualiza busca ao abrir ou ao buscar
  useEffect(() => {
    if (active === 2 && source === 'saved') {
      fetchSavedSongs(true);
    }
    // eslint-disable-next-line
  }, [active, source]);

  // Atualiza busca ao digitar na busca
  useEffect(() => {
    if (active === 2 && source === 'saved') {
      fetchSavedSongs(true);
    }
    // eslint-disable-next-line
  }, [savedSearch]);

  return (
    <AppLayout>
      {
        loadingSongs && (
          <LoadingOverlay visible={loadingSongs} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        )
      }
      <Container size="100%" py="xl">
        <Breadcrumbs mb="md">
          <Anchor onClick={() => router.push('/')}>Início</Anchor>
          <Anchor onClick={() => router.push('/setlists')}>Setlists</Anchor>
          <Text>Adicionar Setlist</Text>
        </Breadcrumbs>
        <Title order={2} mb="lg">Criar novo Setlist</Title>
        <Paper shadow="md" p="xl" radius="md" withBorder>
          <Stepper active={active} onStepClick={setActive}>
            <Stepper.Step label="Fonte" description="Escolha a fonte das músicas">
              <Group justify="center" gap="xl" mt="xl" style={{ justifyContent: 'center', width: '100%' }}>
                {
                  hasSongs && (
                    <Card
                      shadow={source === 'saved' ? 'md' : 'xs'}
                      withBorder
                      tabIndex={0}
                      style={{
                        width: 280,
                        height: 180,
                        cursor: 'pointer',
                        borderColor: source === 'saved' ? '#228be6' : undefined,
                        borderWidth: source === 'saved' ? 3 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'border-width 0.2s',
                      }}
                      onClick={() => {
                        setSource('saved');
                        setSelected([]);
                        setEnriched([]);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSource('saved');
                          setSelected([]);
                          setEnriched([]);
                          setTimeout(() => {
                            if (source === 'saved') setActive(1);
                          }, 0);
                        }
                      }}
                    >
                      <IconPlaylist size={48} color={source === 'saved' ? '#228be6' : '#888'} />
                      <Title order={4} mb="sm" mt="md">Músicas Salvas</Title>
                      <Text ta="center">Selecionar músicas já salvas no sistema</Text>
                    </Card>
                  )
                }
                <Card
                  shadow={source === 'new' ? 'md' : 'xs'}
                  withBorder
                  tabIndex={0}
                  style={{
                    width: 280,
                    height: 180,
                    cursor: 'pointer',
                    borderColor: source === 'new' ? '#228be6' : undefined,
                    borderWidth: source === 'new' ? 3 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-width 0.2s',
                  }}
                  onClick={() => {
                    setSource('new');
                    setSelected([]);
                    setEnriched([]);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSource('new');
                      setSelected([]);
                      setEnriched([]);
                      setTimeout(() => {
                        if (source === 'new') setActive(1);
                      }, 0);
                    }
                  }}
                >
                  <IconPlus size={48} color={source === 'new' ? '#228be6' : '#888'} />
                  <Title order={4} mb="sm" mt="md">Novo Setlist</Title>
                  <Text ta="center">Buscar músicas novas no YouTube (processamento assíncrono)</Text>
                </Card>
              </Group>
              <Group mt="xl" style={{ justifyContent: 'flex-end' }}>
                <Button onClick={() => { setActive(1); }} disabled={!source}>Próximo</Button>
              </Group>
            </Stepper.Step>
            <Stepper.Step label="Nome" description="Defina o nome">
              <TextInput
                onKeyDown={(e) => e.key === 'Enter' && setActive(2)}
                label="Nome do setlist" value={name} onChange={(e) => setName(e.currentTarget.value)} autoFocus required />
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data do setlist (opcional)"
                  value={date}
                  onChange={setDate}
                  slotProps={{ textField: { fullWidth: true, size: 'small', margin: 'normal', placeholder: 'Selecione a data' } }}
                  format="dd/MM/yyyy"
                />
              </LocalizationProvider>
              <TextInput label="Descrição" value={description} onChange={(e) => setDescription(e.currentTarget.value)} mt="md" />
              <Group mt="md" style={{ justifyContent: 'flex-end' }}>
                <Button variant="default" onClick={() => setActive(0)}>Voltar</Button>
                <Button onClick={() => setActive(2)} disabled={!name}>Próximo</Button>
              </Group>
            </Stepper.Step>
            <Stepper.Step label="Músicas" description="Escolha músicas">
              <Group align="flex-start">
                <div style={{ flex: 2, minWidth: 0 }}>
                  {source === 'saved' ? (
                    <>
                      <TextInput
                        leftSection={<IconSearch size={16} />}
                        placeholder="Buscar nas músicas salvas"
                        value={savedSearch}
                        onChange={e => setSavedSearch(e.currentTarget.value)}
                        mb="md"
                      />
                      <div id="scrollableSavedSongs" style={{ height: 250, overflow: 'auto' }}>
                        <InfiniteScroll
                          dataLength={savedSongs.length}
                          next={() => fetchSavedSongs()}
                          hasMore={savedHasMore}
                          loader={<LoadingOverlay visible={savedLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />}
                          scrollableTarget="scrollableSavedSongs"
                          style={{ overflow: 'visible' }}
                        >
                          <Group gap="xs" style={{ flexWrap: 'wrap' }}>
                            {savedSongs.map(song => (
                              <Card
                                key={song.id}
                                shadow="xs"
                                onClick={() =>
                                  selected.find(s => s.id === song.id)
                                    ? removeSong(song.id)
                                    : setSelected([...selected, song])
                                }
                                withBorder
                                style={{
                                  width: 220,
                                  marginBottom: 12,
                                  borderColor: selected.find(s => s.id === song.id) ? '#228be6' : undefined,
                                  borderWidth: selected.find(s => s.id === song.id) ? 2 : 1,
                                  cursor: 'pointer',
                                }}
                              >
                                <Card.Section>
                                  <Image src={song.thumbnail_url} height={120} alt={song.title} fallbackSrc="/no-image.png" />
                                </Card.Section>
                                <Tooltip label={"" + song.title + ""} position="top" withArrow>
                                  <Text fw={500} mt={4} lineClamp={1}>{song.title}</Text>
                                </Tooltip>
                                <Text size="xs">{song.duration} | {song.view_count}</Text>
                              </Card>
                            ))}
                          </Group>
                        </InfiniteScroll>
                      </div>
                    </>
                  ) : (
                    <>
                      {isMobile ? (
                        <Stack mb="md">
                          <TextInput
                            leftSection={<IconSearch size={16} />}
                            placeholder="Buscar músicas"
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          />
                          <Button onClick={handleSearch} loading={searchLoading} fullWidth>Buscar</Button>
                        </Stack>
                      ) : (
                        <Group mb="md">
                          <TextInput
                            leftSection={<IconSearch size={16} />}
                            placeholder="Buscar músicas"
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{ flex: 1 }}
                          />
                          <Button onClick={handleSearch} loading={searchLoading}>Buscar</Button>
                        </Group>
                      )}
                      <ScrollArea h={320} mb="xs" viewportRef={searchResultsRef}>
                        <Group gap="xs" style={{ flexWrap: 'wrap' }}>
                          {searchResults.map((song) => (
                            <Card
                              onClick={() =>
                                selected.find(s => s.youtube_id === song.youtube_id)
                                  ? removeSong(song.youtube_id)
                                  : addSong(song)
                              }
                              withBorder
                              style={{
                                width: 220,
                                marginBottom: 12,
                                borderColor: selected.find(s => s.youtube_id === song.youtube_id) ? '#228be6' : undefined,
                                borderWidth: selected.find(s => s.youtube_id === song.youtube_id) ? 2 : 1,
                                cursor: 'pointer', // Adiciona o ícone de mouse de seleção
                              }}
                              gap="xs" key={song.youtube_id} shadow="xs">
                              <Card.Section>
                                <Image src={song.thumbnail_url} height={80} radius="sm" alt={song.title} fallbackSrc="/no-image.png" />
                              </Card.Section>
                              <Group align="center" gap="xs">
                                <div style={{ flex: 1 }}>
                                  <Tooltip label={"" + song.title + ""} position="top" withArrow>
                                    <Text fw={500} size="sm" lineClamp={1}>{song.title}</Text>
                                  </Tooltip>
                                  <Text size="sm" color="dimmed" lineClamp={1}>{song.channel_name}</Text>
                                  <Text size="xs" lineClamp={1}>{song.duration} | {song.view_count}</Text>
                                </div>
                              </Group>
                            </Card>
                          ))}
                        </Group>
                      </ScrollArea>
                    </>
                  )}
                </div>
                {/* Divider e barra lateral de selecionadas */}
                {selected.length > 0 && (
                  <>
                    <Divider orientation="vertical" mx="xs" style={{ height: 320 }} />
                    <div style={{ flex: 1, minWidth: 260, maxWidth: 340 }}>
                      <Title order={5} mb="xs">Selecionadas ({selected.length})</Title>
                      <ScrollArea h={320}>
                        <Stack gap="sm">
                          {selected.map((song) => (
                            <Card key={song.id || song.youtube_id} shadow="xs" withBorder style={{ width: '100%', minWidth: 0, padding: 8 }}>
                              <Group align="center" gap="md">
                                <Image src={song.thumbnail_url} width={48} height={48} radius="sm" alt={song.title} />
                                <div style={{ flex: 1 }}>
                                  <Tooltip label={"" + song.title + ""} position="top" withArrow>
                                    <Text fw={500} size="sm" lineClamp={1}>{song.title}</Text>
                                  </Tooltip>
                                  <Text size="xs" color="dimmed" lineClamp={1}>{song.channel_name}</Text>
                                  <Text size="xs" lineClamp={1}>{song.duration} | {song.view_count}</Text>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 48 }}>
                                  <Button size="xs" color="red" style={{ alignSelf: 'flex-end' }} onClick={() => removeSong(song.id || song.youtube_id)} leftIcon={<IconX size={14} />}>Remover</Button>
                                </div>
                              </Group>
                            </Card>
                          ))}
                        </Stack>
                      </ScrollArea>
                    </div>
                  </>
                )}
              </Group>
              <Group mt="md" style={{ justifyContent: 'flex-end' }}>
                <Button variant="default" onClick={() => setActive(1)}>Voltar</Button>
                <Button onClick={source === 'saved' ? () => setActive(3) : enrichSongs} loading={loading} disabled={selected.length === 0}>Próximo</Button>
              </Group>
            </Stepper.Step>
            <Stepper.Step label="Preview" description="Confirme e salve">
              <Title order={4} mb="md">Preview do Setlist</Title>
              <ScrollArea>
                <Group gap="md" style={{ flexWrap: 'wrap' }}>
                  {(source === 'saved' ? selected : enriched).map((song) => {
                    const missingData = source === 'saved'
                      ? !song.bpm || !song.key
                      : !song.derivedBpm || !song.derivedKey;
                    return (
                      <Tooltip
                        label={missingData ? 'Não foi possível capturar BPM e Tom. Este item não será salvo.' : ''}
                        color="red"
                        withArrow
                        disabled={!missingData}
                        key={song.id || song.youtube_id}
                      >
                        <Card
                          shadow="md"
                          mb="md"
                          withBorder
                          style={{
                            width: 220,
                            marginBottom: 12,
                            border: missingData ? '2px solid #fa5252' : undefined,
                          }}
                        >
                          <Image src={song.thumbnail_url} width={200} height={120} radius="sm" alt={song.title} />
                          <Tooltip label={"" + song.title + ""} position="top" withArrow>
                            <Text fw={600} mt={4} lineClamp={1}>{song.title}</Text>
                          </Tooltip>
                          <Text size="sm" color="dimmed">{song.channel_name}</Text>
                          <Text size="xs">{song.duration} | {song.view_count}</Text>
                          <Text size="xs">BPM: {source === 'saved' ? song.bpm : song.derivedBpm}</Text>
                          <Text size="xs">Tom: {source === 'saved' ? song.key : song.derivedKey}</Text>
                        </Card>
                      </Tooltip>
                    );
                  })}
                </Group>
              </ScrollArea>
              <Group mt="md" style={{ justifyContent: 'flex-end' }}>
                <Button variant="default" onClick={() => setActive(2)}>Voltar</Button>
                <Button
                  onClick={saveSetlist}
                  loading={loading}
                  disabled={selected.length === 0}
                >
                  Salvar
                </Button>
              </Group>
            </Stepper.Step>
          </Stepper>
        </Paper>
      </Container>
    </AppLayout>
  );
}
