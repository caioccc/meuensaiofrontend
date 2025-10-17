/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useState } from 'react';

import LandingLayout from '@/components/LandingLayout';
import { Anchor, Breadcrumbs, Button, Card, Container, Grid, Group, Image, Loader, Select, Stack, Stepper, Text, TextInput, Title } from "@mantine/core";
import { notifications, showNotification } from '@mantine/notifications';
import { IconCheck, IconChevronLeft, IconChevronRight, IconMusic, IconSearch, IconX } from "@tabler/icons-react";
import { useTranslation } from 'next-i18next';
import { useRouter } from "next/router";
import api from '../../lib/axios';
import { transposeKey } from '@/components/transposeUtils';

interface YoutubeResult {
  youtube_id: string;
  title: string;
  duration: string;
  thumbnail_url: string;
  link: string;
  channel_name: string;
  view_count?: string;
}

export default function TonePage() {
  const { t } = useTranslation('common');

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
    setFetchingDetails(false);
    setFetchingDownload(false);
    setFetchingUpload(false);
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
  const [fetchingDownload, setFetchingDownload] = useState(false);
  const [fetchingUpload, setFetchingUpload] = useState(false);
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
      setResults(res.data.results || []);
      setActive(1);
    } catch {
      notifications.show({
        color: 'red',
        title: t('addSong.notification.errorTitle', 'Erro'),
        message: t('addSong.error', 'Erro ao buscar no YouTube'),
        icon: <IconX />,
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const processDownloadMusic = async () => {
    console.log('selected', selected, fetchingDownload, fetchingUpload);
    setLoading(true);
    setFetchingDownload(true);
    try {
      const res = await api.post('/youtube-audio/step1-download/', { url: selected.link });
      setSelected(s => s ? { ...s, file_path: res.data.file_path, video_id: res.data.video_id, audio_url: res.data.audio_url } : s);
      setActive(a => a + 1);
    } catch (e: any) {
      notifications.show({ color: 'red', title: 'Erro', message: e?.response?.data?.error || 'Erro ao processar áudio.' });
    } finally {
      setLoading(false);
      setFetchingDownload(false);
    }
  }

  const processUploadMusic = async () => {
    console.log('selected', selected, fetchingDownload, fetchingUpload);
    setLoading(true);
    setFetchingUpload(true);
    try {
      const res = await api.post('/youtube-audio/step2-upload/', { file_path: selected.file_path, video_id: selected?.youtube_id });
      setSelected(s => s ? { ...s, audio_url: res.data.audio_url } : s);
      setActive(a => a + 1);
    } catch (e: any) {
      notifications.show({ color: 'red', title: 'Erro', message: e?.response?.data?.error || 'Erro ao enviar áudio.' });
    } finally {
      setLoading(false);
      setFetchingUpload(false);
    }
  }

  const handleSave = async () => {
    console.log('selected', selected);
    if (!selected) {
      notifications.show({
        color: 'red',
        title: t('addSong.notification.errorTitle', 'Erro'),
        message: t('addSong.confirmText', 'Selecione uma música antes de salvar'),
        icon: <IconX />,
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    }
    setLoading(true);
    try {
      await api.post("songs/", {
        ...selected,
        bpm,
        key,
        chords,
        setlists: setlistId ? [setlistId] : []
      });
      showNotification({
        color: 'green',
        title: t('addSong.notification.successTitle', 'Sucesso'),
        message: t('addSong.notification.success', 'Música adicionada com sucesso!'),
        icon: <IconCheck />,
        position: 'top-right',
        autoClose: 2000,
      });
      // navigate to tone-player page with youtube_id as params
      router.push(`/tone-player?id=${selected.youtube_id}`);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response.data.detail?.includes('Plano gratuito')) {
        showNotification({
          color: 'red',
          message: err.response.data.detail || t('addSong.notification.error', 'Você precisa de um plano pago para criar mais músicas.'),
        });
        return;
      }
      notifications.show({
        color: 'red',
        title: t('addSong.notification.errorTitle', 'Erro'),
        message: t('addSong.notification.error', 'Erro ao salvar música'),
        icon: <IconX />,
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Stepper: ao avançar do passo 2 para 3, buscar bpm/tom
  const handleGetChords = async () => {
    console.log('selected', selected);
    if (active === 1 && selected) {
      setFetchingDetails(true);
      try {
        const res = await api.get(`/chordify-data/?youtube_id=${selected.youtube_id}`);
        // Novo formato: buscar dentro de chordInfo
        const chordInfo = res.data.chordInfo || {};
        // BPM
        if (chordInfo.derivedBpm) setBpm(chordInfo.derivedBpm);
        else if (res.data.derivedBpm) setBpm(res.data.derivedBpm);
        // Tom: extrair e normalizar usando transposeKey
        const rawKey = chordInfo.derivedKey || res.data.derivedKey;
        if (rawKey) {
          // Usa transposeKey para normalizar (0 semitones = sem transposição)
          setKey(transposeKey(rawKey, 0));
          console.log('teste', rawKey, transposeKey(rawKey, 0));
        }
        // Acordes: extrair do chordInfo
        if (chordInfo.chords) setChords(chordInfo.chords);
        else if (res.data.chords) setChords(res.data.chords);

        // Add chords into selected
        setSelected(s => s ? { ...s, chords: chordInfo.chords || res.data.chords || null } : s);

      } catch { }
      setFetchingDetails(false);
    }
    setActive(a => a + 1);
  };

  return (
    <LandingLayout>
      <Container size={isMobile ? "100%" : "80%"} py={isMobile ? 'xs' : 'md'}>
        <Breadcrumbs mb="md">
          <Anchor onClick={() => router.push('/')}>{t('appLayout.home', 'Início')}</Anchor>
          <Text>{t('Afinação e Tons')}</Text>
        </Breadcrumbs>
        <Title order={2} mb="lg">{t('Afinação e Tons')}</Title>
        <Stepper active={active} onStepClick={setActive} iconSize={32} orientation={isMobile ? 'vertical' : 'horizontal'} breakpoint="sm">
          <Stepper.Step label={t('addSong.search', 'Buscar')} description="YouTube">
            <Text mb="xs">{t('addSong.placeholder', 'Busque por uma música no YouTube. Apenas o primeiro resultado será adicionado.')}</Text>
            {isMobile ? (
              <Stack>
                <TextInput
                  placeholder={t('addSong.placeholder', 'Digite o nome da música ou artista')}
                  value={search}
                  onChange={e => setSearch(e.currentTarget.value)}
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button fullWidth leftSection={loading ? <Loader size={16} /> : <IconSearch size={16} />} onClick={handleSearch} loading={loading} disabled={!search.trim()}>
                  {loading ? t('addSong.searching', 'Buscando...') : t('addSong.search', 'Buscar')}
                </Button>
              </Stack>
            ) : (
              <Group>
                <TextInput
                  placeholder={t('addSong.placeholder', 'Digite o nome da música ou artista')}
                  value={search}
                  onChange={e => setSearch(e.currentTarget.value)}
                  style={{ flex: 1 }}
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button leftSection={loading ? <Loader size={16} /> : <IconSearch size={16} />} onClick={handleSearch} loading={loading} disabled={!search.trim()}>
                  {loading ? t('addSong.searching', 'Buscando...') : t('addSong.search', 'Buscar')}
                </Button>
              </Group>
            )}
          </Stepper.Step>
          <Stepper.Step label={t('onboarding.select', 'Selecionar')} description={t('addSong.confirmTitle', 'Resultado')}>
            <Text mb="xs">{t('addSong.confirmText', 'Selecione a música desejada dos resultados abaixo:')}</Text>
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
            {active === 1 && selected && (
              <div
                style={{
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  background: 'rgba(255,255,255,0.98)',
                  boxShadow: '0 -2px 16px #0001',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 8,
                  justifyContent: isMobile ? '-moz-initial' : 'center',
                }}
              >
                <Button
                  fullWidth={isMobile}
                  variant="default"
                  leftSection={<IconChevronLeft size={16} />}
                  onClick={() => setActive(a => Math.max(0, a - 1))}
                  disabled={active === 0}
                >
                  {t('onboarding.back', 'Voltar')}
                </Button>
                <Button
                  fullWidth={isMobile}
                  rightSection={<IconChevronRight size={16} />}
                  onClick={handleGetChords}
                  disabled={active === 0 || (active === 1 && !selected) || (active === 1 && fetchingDetails)}
                  loading={fetchingDetails}
                >
                  {t('onboarding.next', 'Próximo')}
                </Button>
              </div>
            )}
          </Stepper.Step>
          <Stepper.Step label={t('Processar', 'Processar')} description="Processar áudio">
            {selected && (
              <Stack>
                {isMobile ? (
                  <Card withBorder
                    shadow="sm"
                    padding="md"
                    radius="md"
                  >
                    <Card.Section>
                      <Image src={selected.thumbnail_url} height={120} radius="sm" alt={selected.title} />
                    </Card.Section>
                    <Group align="center" gap="md" mt="sm">
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Text>{selected.title}</Text>
                        <Text size="xs" color="dimmed">{selected.channel_name}</Text>
                        <Text size="xs">{t('duration', 'Duração')}: {selected.duration} | {selected.view_count}</Text>
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
                      <Text size="xs">{t('duration', 'Duração')}: {selected.duration} | {selected.view_count}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text>{t('link', 'Link')}: {selected.link}</Text>
                        <Text color="dimmed" size='xs'>YouTube ID: {selected.youtube_id}</Text>
                      </div>
                    </div>
                  </Group>
                )}
              </Stack>
            )}
            {active === 2 && selected && (
              <div
                style={{
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  background: 'rgba(255,255,255,0.98)',
                  boxShadow: '0 -2px 16px #0001',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 8,
                  justifyContent: isMobile ? '-moz-initial' : 'center',
                }}
              >
                <Button
                  fullWidth={isMobile}
                  variant="default"
                  leftSection={<IconChevronLeft size={16} />}
                  onClick={() => setActive(a => Math.max(0, a - 1))}
                  disabled={active === 0}
                >
                  {t('onboarding.back', 'Voltar')}
                </Button>
                <Button
                  fullWidth={isMobile}
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => processDownloadMusic()}
                  disabled={active === 0 || (active === 1 && !selected) || (active === 2 && fetchingDownload)}
                  loading={fetchingDownload}
                >
                  {t('Processar Música')}
                </Button>
              </div>
            )}
          </Stepper.Step>
          <Stepper.Step label={t('Buscar cifras')} description="Encontrar cifras para BPM e Tom">
            {selected && (
              <Stack>
                {isMobile ? (
                  <Card withBorder
                    shadow="sm"
                    padding="md"
                    radius="md"
                  >
                    <Card.Section>
                      <Image src={selected.thumbnail_url} height={120} radius="sm" alt={selected.title} />
                    </Card.Section>
                    {(selected.audio_url || selected.file_path) && (
                      <Group
                        align="center"
                        spacing="sm"
                        style={{
                          background: '#e6f4ea',
                          padding: 8,
                          borderRadius: 8,
                          border: '1px solid #cdebcf',
                          maxWidth: 420,
                        }}
                      >
                        <IconCheck color="green" />
                        <div>
                          <Text color="green" fw={600}>
                            Áudio processado com sucesso!
                          </Text>
                          <Text size="xs" color="dimmed">
                            Agora você pode buscar as cifras.
                          </Text>
                        </div>
                      </Group>
                    )}
                    <Group align="center" gap="md" mt="sm">
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Text>{selected.title}</Text>
                        <Text size="xs" color="dimmed">{selected.channel_name}</Text>
                        <Text size="xs">{t('duration', 'Duração')}: {selected.duration} | {selected.view_count}</Text>
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
                      <Text size="xs">{t('duration', 'Duração')}: {selected.duration} | {selected.view_count}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text>{t('link', 'Link')}: {selected.link}</Text>
                        <Text color="dimmed" size='xs'>YouTube ID: {selected.youtube_id}</Text>
                      </div>
                      {(selected.audio_url || selected.file_path) && (
                        <Group align="center" gap="xs" mt="md">
                          <IconCheck color="green" size={22} />
                          <Text color="green" fw={600}>{t('Áudio processado com sucesso! Agora você pode buscar as cifras.')}</Text>
                        </Group>
                      )}
                    </div>
                  </Group>
                )}
              </Stack>
            )}
            {active === 3 && selected && (
              <div
                style={{
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  background: 'rgba(255,255,255,0.98)',
                  boxShadow: '0 -2px 16px #0001',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 8,
                  justifyContent: isMobile ? '-moz-initial' : 'center',
                }}
              >
                <Button
                  fullWidth={isMobile}
                  variant="default"
                  leftSection={<IconChevronLeft size={16} />}
                  onClick={() => setActive(a => Math.max(0, a - 1))}
                  disabled={active === 0}
                >
                  {t('onboarding.back', 'Voltar')}
                </Button>
                <Button
                  fullWidth={isMobile}
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => processUploadMusic()}
                  disabled={active === 0 || (active === 1 && !selected) || (active === 3 && fetchingUpload)}
                  loading={fetchingUpload}
                >
                  {t('Buscar Cifras')}
                </Button>
              </div>
            )}
          </Stepper.Step>
          <Stepper.Step label={t('Preview', 'Pré-visualizar')} description="Player">
            {selected && (
              <Stack>
                {isMobile ? (
                  <Card withBorder
                    shadow="sm"
                    padding="md"
                    radius="md"
                  >
                    <Card.Section>
                      <Image src={selected.thumbnail_url} height={120} radius="sm" alt={selected.title} />
                    </Card.Section>
                    <Group align="center" gap="md" mt="sm">
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Group
                          align="center"
                          spacing="sm"
                          style={{
                            background: '#e6f4ea',
                            padding: 8,
                            borderRadius: 8,
                            border: '1px solid #cdebcf',
                            maxWidth: 420,
                          }}
                        >
                          <IconCheck color="green" />
                          <div>
                            <Text color="green" fw={600}>
                              Áudio cifrado com sucesso!
                            </Text>
                            <Text size="xs" color="dimmed">
                              Agora você pode seguir para o Player.
                            </Text>
                          </div>
                        </Group>
                        <Text>{selected.title}</Text>
                        <Text size="xs" color="dimmed">{selected.channel_name}</Text>
                        <Text size="xs">{t('duration', 'Duração')}: {selected.duration} | {selected.view_count}</Text>
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
                      <Text size="xs">{t('duration', 'Duração')}: {selected.duration} | {selected.view_count}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text>{t('key', 'Tom')}: {key ?? '-'}</Text>
                        <Text>{t('bpm', 'BPM')}: {bpm ?? '-'}</Text>
                        <Text color="dimmed">YouTube ID: {selected.youtube_id}</Text>
                        <Group
                          align="center"
                          spacing="sm"
                          style={{
                            background: '#e6f4ea',
                            padding: 8,
                            borderRadius: 8,
                            border: '1px solid #cdebcf',
                            maxWidth: 420,
                          }}
                        >
                          <IconCheck color="green" />
                          <div>
                            <Text color="green" fw={600}>
                              Áudio cifrado com sucesso!
                            </Text>
                            <Text size="xs" color="dimmed">
                              Agora você pode seguir para o Player.
                            </Text>
                          </div>
                        </Group>
                      </div>
                    </div>
                  </Group>
                )}
              </Stack>
            )}

            {active === 4 && selected && (
              <div
                style={{
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  background: 'rgba(255,255,255,0.98)',
                  boxShadow: '0 -2px 16px #0001',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 8,
                  justifyContent: isMobile ? '-moz-initial' : 'center',
                }}
              >
                <Button
                  fullWidth={isMobile}
                  variant="default"
                  leftSection={<IconChevronLeft size={16} />}
                  onClick={() => setActive(a => Math.max(0, a - 1))}
                  disabled={active === 0}
                >
                  {t('onboarding.back', 'Voltar')}
                </Button>
                <Button
                  fullWidth={isMobile}
                  rightSection={loading ? <Loader size={16} /> : <IconCheck size={16} />}
                  onClick={handleSave}
                  disabled={active === 0 || (active === 1 && !selected) || (active === 4 && loading)}
                  loading={loading}
                >
                  {t('Tocar no Player')}
                </Button>
              </div>
            )}
          </Stepper.Step>
        </Stepper>
      </Container>
    </LandingLayout>
  );
}
