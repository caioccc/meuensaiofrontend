/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/components/AppLayout';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useState } from 'react';

import { Anchor, Breadcrumbs, Button, Card, Container, Grid, Group, Image, Loader, Paper, Select, Stack, Stepper, Text, TextInput, Title } from "@mantine/core";
import { notifications, showNotification } from '@mantine/notifications';
import { IconCheck, IconChevronLeft, IconChevronRight, IconMusic, IconSearch, IconX } from "@tabler/icons-react";
import { useRouter } from "next/router";
import api from "../../../lib/axios";

interface YoutubeResult {
  youtube_id: string;
  title: string;
  duration: string;
  thumbnail_url: string;
  link: string;
  channel_name: string;
  view_count?: string;
}

export default function AddMusicPage() {

  useEffect(() => {
    setActive(0);
    setSearch("");
    setLoading(false);
    setResults([]);
    setSelected(null);
    setBpm(null);
    setKey(null);
    setChords(null);
    setSetlistId(null);
  }, []);

  const [active, setActive] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<YoutubeResult[]>([]);
  const [selected, setSelected] = useState<YoutubeResult | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [chords, setChords] = useState<string | null>(null)
  const [setlistId, setSetlistId] = useState<string | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const KEY_OPTIONS = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  ].map(k => ({ value: k, label: k }));

  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)'); // 768px

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    setSelected(null);

    try {
      const res = await api.get(`/search/?q=${encodeURIComponent(search)}`);
      console.log(res.data);
      setResults(res.data.results || []);
      setActive(1);
    } catch {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Erro ao buscar no YouTube',
        icon: <IconX />,
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selected) {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Selecione uma música antes de salvar',
        icon: <IconX />,
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    };
    setLoading(true);
    try {
      await api.post("songs/", {
        ...selected,
        bpm,
        key,
        chords,
        setlists: setlistId ? [setlistId] : [],
      });
      showNotification({
        color: 'green',
        title: 'Sucesso',
        message: 'Música adicionada com sucesso!',
        icon: <IconCheck />,
        position: 'top-right',
        autoClose: 2000,
      });
      router.push("/songs");
    } catch (err: any) {
      if (err.response?.status === 403 && err.response.data.detail?.includes('Plano gratuito')) {
        showNotification({
          color: 'red',
          message: err.response.data.detail || 'Você precisa de um plano pago para criar mais músicas.',
        });
        return;
      }
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Erro ao salvar música',
        icon: <IconX />,
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Stepper: ao avançar do passo 2 para 3, buscar bpm/tom
  const handleNext = async () => {
    if (active === 1 && selected) {
      setFetchingDetails(true);
      try {
        const res = await api.get(`/chordify-data/?youtube_id=${selected.youtube_id}`);
        console.log(res.data);
        // Novo formato: buscar dentro de chordInfo
        const chordInfo = res.data.chordInfo || {};
        // BPM
        if (chordInfo.derivedBpm) setBpm(chordInfo.derivedBpm);
        else if (res.data.derivedBpm) setBpm(res.data.derivedBpm);
        // Tom: extrair só a nota (ex: F:maj -> F)
        const rawKey = chordInfo.derivedKey || res.data.derivedKey;
        if (rawKey) {
          const keyMatch = rawKey.match(/^[A-G]#?/);
          setKey(keyMatch ? keyMatch[0] : rawKey);
        }
        // Acordes: extrair do chordInfo
        if (chordInfo.chords) setChords(chordInfo.chords);
        else if (res.data.chords) setChords(res.data.chords);

      } catch { }
      setFetchingDetails(false);
    }
    setActive(a => a + 1);
  };

  return (
    <AppLayout>
      <Container size="100%" py="xl">
        <Breadcrumbs mb="md">
          <Anchor onClick={() => router.push('/')}>Início</Anchor>
          <Anchor onClick={() => router.push('/songs')}>Minhas músicas</Anchor>
          <Text>Adicionar Música</Text>
        </Breadcrumbs>
        <Title order={2} mb="lg">Adicionar Música</Title>
        <Paper shadow="md" p="xl" radius="md" withBorder>
          <Stepper active={active} onStepClick={setActive}>
            <Stepper.Step label="Buscar" description="YouTube">
              <Text mb="xs">Busque por uma música no YouTube. Apenas o primeiro resultado será adicionado.</Text>
              {isMobile ? (
                <Stack>
                  <TextInput
                    placeholder="Digite o nome da música ou artista"
                    value={search}
                    onChange={e => setSearch(e.currentTarget.value)}
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button fullWidth leftSection={loading ? <Loader size={16} /> : <IconSearch size={16} />} onClick={handleSearch} loading={loading} disabled={!search.trim()}>
                    Buscar
                  </Button>
                </Stack>
              ) : (
                <Group>
                  <TextInput
                    placeholder="Digite o nome da música ou artista"
                    value={search}
                    onChange={e => setSearch(e.currentTarget.value)}
                    style={{ flex: 1 }}
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button leftSection={loading ? <Loader size={16} /> : <IconSearch size={16} />} onClick={handleSearch} loading={loading} disabled={!search.trim()}>
                    Buscar
                  </Button>
                </Group>
              )}
            </Stepper.Step>
            <Stepper.Step label="Selecionar" description="Resultado">
              <Text mb="xs">Selecione a música desejada dos resultados abaixo:</Text>
              {loading ? <Loader /> : (
                <Grid gutter="md">
                  {results.map((r) => (
                    <Grid.Col span={{ base: 12, sm: 12, md: 6, lg: 4, xl: 3 }} key={r.youtube_id}>
                      <Card
                        shadow={selected?.youtube_id === r.youtube_id ? "lg" : "sm"}
                        padding="xs"
                        radius="md"
                        withBorder
                        style={{ border: selected?.youtube_id === r.youtube_id ? '6px solid #228be6' : undefined, cursor: 'pointer' }}
                        onClick={() => setSelected(r)}
                      >
                        <Card.Section>
                          <Image src={r.thumbnail_url} height={120} alt={r.title} />
                        </Card.Section>
                        <Text fw={700} size="sm" mt="xs" lineClamp={2}>{r.title}</Text>
                        <Text size="xs" color="dimmed">{r.channel_name}</Text>
                        <Group gap={4} mt="xs">
                          <Text size="xs">{r.duration}</Text>
                          {r.view_count && <Text size="xs" color="dimmed">{r.view_count}</Text>}
                          <Button component="a" href={r.link} target="_blank" size="xs" variant="subtle" leftSection={<IconMusic size={14} />}>YouTube</Button>
                        </Group>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Stepper.Step>
            <Stepper.Step label="Detalhes" description="Preview">
              {selected && (
                <Stack>
                  {isMobile ? (
                    <Card withBorder shadow="sm" p="md">
                      <Group align="center" gap="md">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 8 }}>
                          <Image src={selected.thumbnail_url} width={100} height={100} radius="sm" alt={selected.title} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Text>{selected.title}</Text>
                          <Text size="xs" color="dimmed">{selected.channel_name}</Text>
                          <Text size="xs">Duração: {selected.duration} | {selected.view_count}</Text>
                        </div>
                      </Group>
                    </Card>
                  ) : (
                    <Group align="center" gap="md">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 8 }}>
                        <Image src={selected.thumbnail_url} width={100} height={100} radius="sm" alt={selected.title} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Text>{selected.title}</Text>
                        <Text size="xs" color="dimmed">{selected.channel_name}</Text>
                        <Text size="xs">Duração: {selected.duration} | {selected.view_count}</Text>
                      </div>
                    </Group>
                  )}
                  <Group grow>
                    <TextInput
                      label="BPM"
                      value={bpm ?? ""}
                      readOnly
                      description="Detectado automaticamente. Você pode editar no player."
                      leftSection={<IconMusic size={16} />} min={40} max={220}
                    />
                    <Select
                      label="Tom"
                      data={KEY_OPTIONS}
                      value={key}
                      readOnly
                      description="Detectado automaticamente. Você pode editar no player."
                      leftSection={<IconMusic size={16} />}
                    />
                  </Group>
                </Stack>
              )}
            </Stepper.Step>
          </Stepper>
          {!isMobile && (
            <Group mt="md" style={{ justifyContent: 'space-between' }}>
              <Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => setActive(a => Math.max(0, a - 1))} disabled={active === 0}>Voltar</Button>
              {active < 2 && <Button rightSection={<IconChevronRight size={16} />} onClick={handleNext} disabled={active === 0 || (active === 1 && !selected) || (active === 1 && fetchingDetails)} loading={fetchingDetails}>Próximo</Button>}
              {active === 2 && (
                <Button leftSection={loading ? <Loader size={16} /> : <IconCheck size={16} />} onClick={handleSave} loading={loading}>
                  Salvar música
                </Button>
              )}
            </Group>
          )}
          {
            isMobile && (
              <Stack gap={8} mt="md">
                {
                  active === 2 && (
                    <Button fullWidth leftSection={loading ? <Loader size={16} /> : <IconCheck size={16} />} onClick={handleSave} loading={loading} mt="md">
                      Salvar música
                    </Button>
                  )
                }
                {
                  active < 2 && active > 0 && (
                    <Button fullWidth rightSection={<IconChevronRight size={16} />} onClick={handleNext} disabled={active === 0 || (active === 1 && !selected) || (active === 1 && fetchingDetails)} loading={fetchingDetails}>
                      Próximo
                    </Button>
                  )
                }
                <Button fullWidth variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => setActive(a => Math.max(0, a - 1))} disabled={active === 0}>
                  Voltar
                </Button>
              </Stack>
            )
          }
        </Paper>
      </Container>
    </AppLayout>
  );
}
