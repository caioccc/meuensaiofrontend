import AppLayout from '@/components/AppLayout';
import {
  Anchor,
  Breadcrumbs,
  Button,
  Card, Container, Divider,
  Group,
  Image,
  Loader, Paper, ScrollArea,
  Stack,
  Stepper,
  Text,
  TextInput, Title,
  Tooltip
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconCheck, IconPlaylist, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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
  const router = useRouter();

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
  }, []);

  // Busca músicas (agora usando /api/search/)
  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const res = await api.get(`/search/?q=${encodeURIComponent(search)}`);
      setSearchResults(res.data.results || []);
    } finally {
      setSearchLoading(false);
    }
  };

  // Adiciona música selecionada
  const addSong = (song: any) => {
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
        const res = await api.post('/setlists/', { name, description, songs_ids: songIds });
        if (res.status !== 201) {
          showNotification({ color: 'red', message: 'Erro ao salvar setlist' });
          return;
        }
      } else {
        const res = await api.post('/setlists/', { name, description, songs_data: enriched });
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

  const fetchSavedSongs = async () => {
    setSavedLoading(true);
    try {
      const res = await api.get('/songs/?limit=1000');
      setSavedSongs(res.data.results || []);
    } finally {
      setSavedLoading(false);
    }
  };

  // Carrega músicas salvas ao entrar no passo 3 se fonte for 'saved'
  useEffect(() => {
    if (active === 2 && source === 'saved' && savedSongs.length === 0) {
      fetchSavedSongs();
    }
  }, [active, source]);

  return (
    <AppLayout>
      <Container size="100%" py="xl">
        <Breadcrumbs mb="md">
          <Anchor onClick={() => router.push('/')}>Início</Anchor>
          <Anchor onClick={() => router.push('/setlists')}>Setlists</Anchor>
        </Breadcrumbs>
        <Title order={2} mb="lg">Criar novo Setlist</Title>
        <Paper shadow="md" p="xl" radius="md" withBorder>
          <Stepper active={active} onStepClick={setActive} breakpoint="sm">
            <Stepper.Step label="Fonte" description="Escolha a fonte das músicas">
              <Group position="center" spacing="xl" mt="xl" style={{ justifyContent: 'center', width: '100%' }}>
                <Card
                  shadow={source === 'saved' ? 'md' : 'xs'}
                  withBorder
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
                  onClick={() => setSource('saved')}
                >
                  <IconPlaylist size={48} color={source === 'saved' ? '#228be6' : '#888'} />
                  <Title order={4} mb="sm" mt="md">Músicas Salvas</Title>
                  <Text align="center">Selecionar músicas já salvas no sistema</Text>
                </Card>
                <Card
                  shadow={source === 'new' ? 'md' : 'xs'}
                  withBorder
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
                  onClick={() => setSource('new')}
                >
                  <IconPlus size={48} color={source === 'new' ? '#228be6' : '#888'} />
                  <Title order={4} mb="sm" mt="md">Novo Setlist</Title>
                  <Text align="center">Buscar músicas novas no YouTube (processamento assíncrono)</Text>
                </Card>
              </Group>
              <Group mt="xl" style={{ justifyContent: 'flex-end' }}>
                <Button onClick={() => { setActive(1); }} disabled={!source}>Próximo</Button>
              </Group>
            </Stepper.Step>
            <Stepper.Step label="Nome" description="Defina o nome">
              <TextInput label="Nome do setlist" value={name} onChange={(e) => setName(e.currentTarget.value)} autoFocus required />
              <TextInput label="Descrição" value={description} onChange={(e) => setDescription(e.currentTarget.value)} mt="md" />
              <Group mt="md" style={{ justifyContent: 'flex-end' }}>
                <Button variant="default" onClick={() => setActive(0)}>Voltar</Button>
                <Button onClick={() => setActive(2)} disabled={!name}>Próximo</Button>
              </Group>
            </Stepper.Step>
            <Stepper.Step label="Músicas" description="Escolha músicas">
              <Group align="flex-start" noWrap>
                <div style={{ flex: 2, minWidth: 0 }}>
                  {source === 'saved' ? (
                    <>
                      <TextInput
                        icon={<IconSearch size={16} />}
                        placeholder="Buscar nas músicas salvas"
                        value={savedSearch}
                        onChange={e => setSavedSearch(e.currentTarget.value)}
                        mb="md"
                      />
                      <ScrollArea h={250} mb="md">
                        <Group spacing="md" noWrap style={{ flexWrap: 'wrap' }}>
                          {savedLoading ? <Loader /> : savedSongs.filter(song =>
                            song.title.toLowerCase().includes(savedSearch.toLowerCase()) ||
                            (song.artist && song.artist.toLowerCase().includes(savedSearch.toLowerCase()))
                          ).map(song => (
                            <Card key={song.id} shadow="xs" withBorder style={{ width: 220, marginBottom: 12, borderColor: selected.find(s => s.id === song.id) ? '#228be6' : undefined, borderWidth: selected.find(s => s.id === song.id) ? 2 : 1 }}>
                              <Image src={song.thumbnail_url} width={200} height={120} radius="sm" alt={song.title} />
                              <Text weight={500} mt={4}>{song.title}</Text>
                              <Text size="xs" color="dimmed">{song.artist}</Text>
                              <Text size="xs">{song.duration} | {song.view_count}</Text>
                              <Button size="xs" mt={8} fullWidth color={selected.find(s => s.id === song.id) ? 'red' : 'blue'} onClick={() => selected.find(s => s.id === song.id) ? removeSong(song.id) : setSelected([...selected, song])} leftIcon={selected.find(s => s.id === song.id) ? <IconX size={14} /> : <IconCheck size={14} />}>{selected.find(s => s.id === song.id) ? 'Remover' : 'Selecionar'}</Button>
                            </Card>
                          ))}
                        </Group>
                      </ScrollArea>
                    </>
                  ) : (
                    <>
                      <Group mb="md">
                        <TextInput
                          icon={<IconSearch size={16} />}
                          placeholder="Buscar músicas"
                          value={search}
                          onChange={(e) => setSearch(e.currentTarget.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          style={{ flex: 1 }}
                        />
                        <Button onClick={handleSearch} loading={searchLoading}>Buscar</Button>
                      </Group>
                      <ScrollArea h={320} mb="md">
                        <Group spacing="md" noWrap style={{ flexWrap: 'wrap' }}>
                          {searchResults.map((song) => (
                            <Card key={song.youtube_id} shadow="xs" withBorder style={{ width: 220, marginBottom: 12 }}>
                              <Image src={song.thumbnail_url} width={200} height={120} radius="sm" alt={song.title} />
                              <Text weight={500} mt={4}>{song.title}</Text>
                              <Text size="xs" color="dimmed">{song.artist || song.channel_name}</Text>
                              <Text size="xs">{song.duration} | {song.view_count}</Text>
                              <Button size="xs" mt={8} fullWidth onClick={() => addSong(song)} leftIcon={<IconCheck size={14} />}>Selecionar</Button>
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
                    <Divider orientation="vertical" mx="lg" style={{ height: 320 }} />
                    <div style={{ flex: 1, minWidth: 260, maxWidth: 340 }}>
                      <Title order={5} mb="xs">Selecionadas</Title>
                      <ScrollArea h={320}>
                        <Stack spacing="sm">
                          {selected.map((song) => (
                            <Card key={song.id || song.youtube_id} shadow="xs" withBorder>
                              <Group noWrap align="center" spacing="md">
                                <Image src={song.thumbnail_url} width={60} height={60} radius="sm" alt={song.title} />
                                <div style={{ flex: 1 }}>
                                  <Text weight={500}>{song.title}</Text>
                                  <Text size="xs" color="dimmed">{song.artist || song.channel_name}</Text>
                                  <Text size="xs">{song.duration} | {song.view_count}</Text>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 60 }}>
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
                <Group spacing="md" noWrap style={{ flexWrap: 'wrap' }}>
                  {(source === 'saved' ? selected : enriched).map((song) => {
                    const missingData = !song.derivedBpm || !song.derivedKey;
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
                          <Text weight={600} mt={4}>{song.title}</Text>
                          <Text size="sm" color="dimmed">{song.artist || song.channel_name}</Text>
                          <Text size="xs">{song.duration} | {song.view_count}</Text>
                          <Text size="xs">BPM: {song.derivedBpm}</Text>
                          <Text size="xs">Tom: {song.derivedKey}</Text>
                          <Text size="xs">ID: {song.youtube_id}</Text>
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
