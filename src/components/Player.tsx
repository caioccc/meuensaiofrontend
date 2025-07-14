/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Divider, Group, LoadingOverlay, Modal, Paper, Slider, Stack, Text, Tooltip } from '@mantine/core';
// Lista de tons maiores e menores para seleção rápida
const MAJOR_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MINOR_KEYS = MAJOR_KEYS.map(k => k + 'm');

import { useMediaQuery } from '@mantine/hooks';
import { IconArrowDown, IconArrowUp, IconBrandYoutube, IconGuitarPick, IconMusic, IconRefresh, IconVolumeOff, IconWaveSine } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { guitarSamples, padSamples, shimmerSamples } from '../constants/padMaps';
import { useAuth } from '../contexts/AuthContext';
import { getTransposedKey, transposeSongChords } from '../lib/music';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface PlayerProps {
  song: {
    youtube_id: string;
    chords_formatada: Array<{
      note: string;
      note_fmt: string;
      image: string;
      start: number;
      end: number;
      tempo: number;
    }>;
    bpm?: number;
    key?: string;
    link?: string;
    duration?: string;
    title?: string;
    view_count?: number;
    published_time?: string;
    thumbnail_url?: string;
  };
}

export default function Player({ song }: PlayerProps) {
  // Estado de transposição
  const [transposition, setTransposition] = useState(0);

  // Modal de seleção de tom
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  // Funções de controle de transposição
  const handleTransposeUp = () => setTransposition(t => (t < 14 ? t + 1 : t));
  const handleTransposeDown = () => setTransposition(t => (t > -14 ? t - 1 : t));
  const handleTransposeReset = () => setTransposition(0);
  // Seleção direta de tom (maior/menor)
  const handleSelectKey = (key: string) => {
    // Detecta se o tom base é menor
    const baseKeyRaw = song.key || 'C';
    const baseKey = baseKeyRaw.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#').replace('m', '');
    const baseIdx = MAJOR_KEYS.indexOf(baseKey);
    let targetKey = key;
    if (key.endsWith('m')) {
      targetKey = key.replace('m', '');
    }
    const targetIdx = MAJOR_KEYS.indexOf(targetKey);
    let diff = targetIdx - baseIdx;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    setTransposition(diff);
    setKeyModalOpen(false);
  };
  const { isPro } = useAuth();
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [ytVolume, setYtVolume] = useState(60);
  const [padsLoading, setPadsLoading] = useState(true);
  const [padCloudVol, setPadCloudVol] = useState(80);
  const [padShimmerVol, setPadShimmerVol] = useState(80);
  const [padGuitarVol, setPadGuitarVol] = useState(80);
  // Estado para liberar shimmer/guitar sob demanda
  const [shimmerEnabled, setShimmerEnabled] = useState(false);
  const [guitarEnabled, setGuitarEnabled] = useState(false);
  const [shimmerLoading, setShimmerLoading] = useState(false);
  const [guitarLoading, setGuitarLoading] = useState(false);
  const padCloudPlayer = useRef<Tone.Player | null>(null);
  const padShimmerPlayer = useRef<Tone.Player | null>(null);
  const padGuitarPlayer = useRef<Tone.Player | null>(null);
  // Ref para timeline de acordes
  const timelineRef = useRef<HTMLDivElement>(null);

  // Estados de mute/solo
  const [ytMute, setYtMute] = useState(false);
  const [ytSolo, setYtSolo] = useState(false);
  const [padCloudMute, setPadCloudMute] = useState(false);
  const [padCloudSolo, setPadCloudSolo] = useState(false);
  const [padShimmerMute, setPadShimmerMute] = useState(false);
  const [padShimmerSolo, setPadShimmerSolo] = useState(false);
  const [padGuitarMute, setPadGuitarMute] = useState(false);
  const [padGuitarSolo, setPadGuitarSolo] = useState(false);

  // Lógica de solo/mute
  const anySolo = ytSolo || padCloudSolo || padGuitarSolo;
  const isChannelActive = (mute: boolean, solo: boolean) => {
    if (anySolo) return solo;
    return !mute;
  };

  // Carrega YouTube IFrame API
  useEffect(() => {
    if (window.YT) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }, []);

  // Estado para saber se player está pronto
  const [ytReady, setYtReady] = useState(false);

  // Inicializa player YouTube de forma segura
  useEffect(() => {
    let ytPlayer: any;
    function createPlayer() {
      if (!window.YT || !window.YT.Player) return;
      ytPlayer = new window.YT.Player('ytplayer', {
        videoId: song.youtube_id,
        events: {
          onReady: () => {
            setYtReady(true);
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
              playerRef.current.setVolume(ytVolume);
            }
            // Toca automaticamente ao renderizar
            ytPlayer?.playVideo?.();
          },
          onStateChange: (e: any) => setIsPlaying(e.data === 1),
        },
      });
      playerRef.current = ytPlayer;
    }
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }
    return () => {
      ytPlayer?.destroy?.();
    };
  }, [song.youtube_id]);

  // Atualiza volume do player YouTube apenas se estiver pronto e tocando
  useEffect(() => {
    if (
      playerRef.current &&
      typeof playerRef.current.setVolume === 'function' &&
      ytReady &&
      isPlaying
    ) {
      playerRef.current.setVolume(ytVolume);
    }
  }, [ytVolume, ytReady, isPlaying]);


  // Sincronização de acordes
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setCurrentTime(playerRef.current.getCurrentTime() || 0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Funções de controle
  // const play = () => playerRef.current?.playVideo();
  // const pause = () => playerRef.current?.pauseVideo();

  // Transpor acordes conforme o estado
  const transposedChords = transposeSongChords(song.chords_formatada || [], transposition);
  // Encontrar acorde ativo pelo tempo
  const activeChordIdx = transposedChords?.findIndex(
    c => currentTime >= c.start && currentTime < c.end
  );

  // Carregar apenas o pad Cloud por padrão
  useEffect(() => {
    setPadsLoading(true);
    // Pausa o vídeo ao iniciar carregamento dos pads
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
    const transposedKey = getTransposedKey(song.key || 'C', transposition);
    const padCloudUrl = padSamples[transposedKey] || padSamples['C'];
    padCloudPlayer.current = new Tone.Player({ url: padCloudUrl, autostart: false, onload: () => setPadsLoading(false) }).toDestination();
    padCloudPlayer.current.volume.value = (padCloudVol - 100);
    // Dispose shimmer/guitar se não estiverem habilitados
    if (!shimmerEnabled && padShimmerPlayer.current) {
      try {
        if (padShimmerPlayer.current.state === 'started') padShimmerPlayer.current.stop();
      } catch { }
      padShimmerPlayer.current.dispose();
      padShimmerPlayer.current = null;
    }
    if (!guitarEnabled && padGuitarPlayer.current) {
      try {
        if (padGuitarPlayer.current.state === 'started') padGuitarPlayer.current.stop();
      } catch { }
      padGuitarPlayer.current.dispose();
      padGuitarPlayer.current = null;
    }
    return () => {
      if (padCloudPlayer.current) {
        try {
          if (padCloudPlayer.current.state === 'started') padCloudPlayer.current.stop();
        } catch { }
        padCloudPlayer.current.dispose();
      }
      if (!shimmerEnabled && padShimmerPlayer.current) {
        try {
          if (padShimmerPlayer.current.state === 'started') padShimmerPlayer.current.stop();
        } catch { }
        padShimmerPlayer.current.dispose();
      }
      if (!guitarEnabled && padGuitarPlayer.current) {
        try {
          if (padGuitarPlayer.current.state === 'started') padGuitarPlayer.current.stop();
        } catch { }
        padGuitarPlayer.current.dispose();
      }
    };
  }, [song.key, transposition, shimmerEnabled, guitarEnabled]);

  // Carregar shimmer sob demanda
  useEffect(() => {
    if (!shimmerEnabled) return;
    setShimmerLoading(true);
    // Pausa o vídeo ao iniciar carregamento do shimmer
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
    const transposedKey = getTransposedKey(song.key || 'C', transposition);
    const padShimmerUrl = shimmerSamples[transposedKey] || shimmerSamples['C'];
    padShimmerPlayer.current = new Tone.Player({ url: padShimmerUrl, autostart: false, onload: () => setShimmerLoading(false) }).toDestination();
    padShimmerPlayer.current.volume.value = (padShimmerVol - 100);
    return () => {
      if (padShimmerPlayer.current) {
        try {
          // Só chama stop se não estiver disposed e já foi iniciado
          if (
            typeof padShimmerPlayer.current.state === 'string' &&
            padShimmerPlayer.current.state === 'started' &&
            !padShimmerPlayer.current.disposed
          ) {
            padShimmerPlayer.current.stop();
          }
        } catch { }
        try {
          if (!padShimmerPlayer.current.disposed) padShimmerPlayer.current.dispose();
        } catch { }
      }
    };
  }, [shimmerEnabled, song.key, transposition]);

  // Carregar guitar sob demanda
  useEffect(() => {
    if (!guitarEnabled) return;
    setGuitarLoading(true);
    // Pausa o vídeo ao iniciar carregamento do guitar
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
    const transposedKey = getTransposedKey(song.key || 'C', transposition);
    const padGuitarUrl = guitarSamples[transposedKey] || guitarSamples['C'];
    padGuitarPlayer.current = new Tone.Player({ url: padGuitarUrl, autostart: false, onload: () => setGuitarLoading(false) }).toDestination();
    padGuitarPlayer.current.volume.value = (padGuitarVol - 100);
    return () => {
      if (padGuitarPlayer.current) {
        try {
          if (
            typeof padGuitarPlayer.current.state === 'string' &&
            padGuitarPlayer.current.state === 'started' &&
            !padGuitarPlayer.current.disposed
          ) {
            padGuitarPlayer.current.stop();
          }
        } catch { }
        try {
          if (!padGuitarPlayer.current.disposed) padGuitarPlayer.current.dispose();
        } catch { }
      }
    };
  }, [guitarEnabled, song.key, transposition]);

  // Sincronizar pads com play/pause do vídeo
  useEffect(() => {
    if (padsLoading || shimmerLoading || guitarLoading) return;
    if (isPlaying) {
      if (
        padCloudPlayer.current &&
        padCloudPlayer.current.state === 'stopped' &&
        padCloudPlayer.current.buffer &&
        padCloudPlayer.current.buffer.loaded
      ) {
        padCloudPlayer.current.start();
      }
      if (
        padShimmerPlayer.current &&
        padShimmerPlayer.current.state === 'stopped' &&
        padShimmerPlayer.current.buffer &&
        padShimmerPlayer.current.buffer.loaded
      ) {
        padShimmerPlayer.current.start();
      }
      if (
        padGuitarPlayer.current &&
        padGuitarPlayer.current.state === 'stopped' &&
        padGuitarPlayer.current.buffer &&
        padGuitarPlayer.current.buffer.loaded
      ) {
        padGuitarPlayer.current.start();
      }
    } else {
      try { padCloudPlayer.current?.stop(); } catch { }
      try { padShimmerPlayer.current?.stop(); } catch { }
      try { padGuitarPlayer.current?.stop(); } catch { }
    }
  }, [isPlaying, padsLoading, shimmerLoading, guitarLoading]);
  // Soltar vídeo automaticamente após todos os pads carregarem
  useEffect(() => {
    if (!ytReady) return;
    if (!padsLoading && !shimmerLoading && !guitarLoading) {
      // Só solta se estava pausado por carregamento
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
        if (transposition !== 0) {
          playerRef.current.setVolume(0);
        } else {
          playerRef.current.setVolume(ytVolume);
        }
      }
    }
  }, [padsLoading, shimmerLoading, guitarLoading, ytReady]);

  // Ao mudar o tom, o vídeo deve ficar mutado se não estiver no tom original
  useEffect(() => {
    if (!ytReady) return;
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      if (transposition !== 0) {
        playerRef.current.setVolume(0);
      } else {
        playerRef.current.setVolume(ytVolume);
      }
    }
  }, [transposition, ytReady, ytVolume]);

  // Controle de volume dos pads
  useEffect(() => {
    if (padCloudPlayer.current) padCloudPlayer.current.volume.value = (padCloudVol - 100);
  }, [padCloudVol]);
  useEffect(() => {
    if (padShimmerPlayer.current) padShimmerPlayer.current.volume.value = (padShimmerVol - 100);
  }, [padShimmerVol]);
  useEffect(() => {
    if (padGuitarPlayer.current) padGuitarPlayer.current.volume.value = (padGuitarVol - 100);
  }, [padGuitarVol]);

  // Scroll automático para centralizar acorde ativo
  useEffect(() => {
    if (!timelineRef.current || activeChordIdx === -1 || activeChordIdx == null) return;
    const container = timelineRef.current;
    const bloco = container.children[activeChordIdx] as HTMLElement;
    if (bloco) {
      const blocoCenter = bloco.offsetLeft + bloco.offsetWidth / 2;
      const containerCenter = container.offsetWidth / 2;
      container.scrollTo({ left: blocoCenter - containerCenter, behavior: 'smooth' });
    }
  }, [activeChordIdx]);

  // Aplicar mute/solo apenas nos pads (controle de volume do vídeo é feito no hook de transposição)
  useEffect(() => {
    // Pads
    if (padCloudPlayer.current) padCloudPlayer.current.volume.value = isChannelActive(padCloudMute, padCloudSolo) ? (padCloudVol - 100) : -100;
    if (padShimmerPlayer.current) padShimmerPlayer.current.volume.value = isChannelActive(padShimmerMute, padShimmerSolo) ? (padShimmerVol - 100) : -100;
    if (padGuitarPlayer.current) padGuitarPlayer.current.volume.value = isChannelActive(padGuitarMute, padGuitarSolo) ? (padGuitarVol - 100) : -100;
  }, [ytMute, ytSolo, padCloudMute, padCloudSolo, padCloudVol, padShimmerMute, padShimmerSolo, padShimmerVol, padGuitarMute, padGuitarSolo, padGuitarVol, anySolo]);

  const [loading, setLoading] = useState(false);

  // Simula carregamento do player (ajuste conforme necessário)
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timeout);
  }, [song.youtube_id]);

  const isMobile = useMediaQuery('(max-width: 48em)');

  if (!isPro) {
    // Usuário não Pro: mostra apenas vídeo e info básica
    return (
      <Stack style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} />
        <Group gap="xl" align="center" style={{ marginBottom: 16, marginTop: 8 }}>
          <Text size="md" fw={600} color="#228be6">
            TOM: <span style={{ fontWeight: 700 }}>{song.key || '-'}</span>
          </Text>
          <Text size="md" fw={600} color="#228be6">
            BPM: <span style={{ fontWeight: 700 }}>{song.bpm || '-'}</span>
          </Text>
          <Text size="md" fw={600} color="#228be6">
            DURAÇÃO: <span style={{ fontWeight: 700 }}>{song.duration || '-'}</span>
          </Text>
        </Group>
        <div className="player-main-content" style={{ width: '100%' }}>
          <div id="ytplayer" style={{ width: '100%', height: 360, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }} />
        </div>
        <Paper withBorder shadow="md" p="md" mt="md" style={{ width: '100%', textAlign: 'center', background: '#fffbe6', border: '1px solid #ffe066' }}>
          <Text fw={700} size="lg" color="#fab005">Recursos de Pads e Acordes disponíveis apenas para assinantes Pro.</Text>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack style={{ position: 'relative' }}>
      {/* Modal de seleção de tom */}
      <Modal opened={keyModalOpen} onClose={() => setKeyModalOpen(false)} title="Selecione o tom" centered>
        <Stack gap={12}>
          {(() => {
            const baseKeyRaw = song.key || 'C';
            const isBaseMinor = baseKeyRaw.toLowerCase().endsWith('m');
            if (isBaseMinor) {
              return <>
                <Text fw={700} size="sm" style={{ textAlign: 'center' }}>Menores</Text>
                <Group gap={8} wrap="wrap" style={{ justifyContent: 'center' }}>
                  {MINOR_KEYS.map((key) => {
                    const currentKey = getTransposedKey(baseKeyRaw.replace('m', '') || 'C', transposition) + 'm';
                    const isSelected = key === currentKey;
                    return (
                      <Button
                        key={key}
                        variant={isSelected ? 'filled' : 'outline'}
                        color={isSelected ? 'blue' : 'gray'}
                        onClick={() => handleSelectKey(key)}
                        style={{ minWidth: 48, fontWeight: 700 }}
                      >
                        {key}
                      </Button>
                    );
                  })}
                </Group>
              </>;
            } else {
              return <>
                <Text fw={700} size="sm" style={{ textAlign: 'center' }}>Maiores</Text>
                <Group gap={8} wrap="wrap" style={{ justifyContent: 'center' }}>
                  {MAJOR_KEYS.map((key) => {
                    const currentKey = getTransposedKey(baseKeyRaw || 'C', transposition);
                    const isSelected = key === currentKey && !currentKey.toLowerCase().endsWith('m');
                    return (
                      <Button
                        key={key}
                        variant={isSelected ? 'filled' : 'outline'}
                        color={isSelected ? 'blue' : 'gray'}
                        onClick={() => handleSelectKey(key)}
                        style={{ minWidth: 48, fontWeight: 700 }}
                      >
                        {key}
                      </Button>
                    );
                  })}
                </Group>
              </>;
            }
          })()}
        </Stack>
      </Modal>
      <LoadingOverlay visible={loading || padsLoading} zIndex={2000} loaderProps={{ color: 'blue', size: 'xl', children: <Text fw={700} size="lg">Carregando áudio dos pads...</Text> }} />
      {isMobile ? (
        <Stack gap="md" style={{ width: '100%' }}>
          {/* Aviso de transposição diferente do original */}
          {transposition !== 0 && (
            <Group
              align="center"
              style={{
                background: 'var(--alert-bg)',
                border: '1px solid var(--alert-border)',
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
              }}
              className="alert-transpose"
            >
              <IconBrandYoutube size={22} color="var(--alert-icon)" style={{ marginRight: 6 }} />
              <Text size="sm" fw={600} style={{ color: 'var(--alert-text)' }}>
                Para melhor experiência, sugerimos zerar o volume do YouTube e aumentar o volume dos pads ao transpor o tom.
              </Text>
            </Group>
          )}
          {/* Bloco principal: vídeo, controles, volumes */}
          <Stack style={{ width: '100%' }}>
            <Group gap="xl" align="center" style={{ marginBottom: 16, marginTop: 8 }}>
              {/* CONTROLES DE TRANSPOSIÇÃO MOBILE */}
              <Group gap={4} align="center">
                <Tooltip label="Diminuir tom">
                  <Button size="xs" variant="subtle" onClick={handleTransposeDown} disabled={transposition <= -14}><IconArrowDown size={16} /></Button>
                </Tooltip>
                <Tooltip label="Selecionar tom">
                  <Button
                    size="xs"
                    variant="outline"
                    color="blue"
                    onClick={() => setKeyModalOpen(true)}
                    style={{ fontWeight: 700, minWidth: 60 }}
                  >
                    TOM: {getTransposedKey(song.key || '-', transposition)}
                    {transposition !== 0 && (
                      <span style={{ fontWeight: 400, fontSize: 14, marginLeft: 4, color: '#888' }}>({transposition > 0 ? '+' : ''}{transposition})</span>
                    )}
                  </Button>
                </Tooltip>
                <Tooltip label="Aumentar tom">
                  <Button size="xs" variant="subtle" onClick={handleTransposeUp} disabled={transposition >= 14}><IconArrowUp size={16} /></Button>
                </Tooltip>
                <Tooltip label="Resetar tom">
                  <Button size="xs" variant="light" color="gray" onClick={handleTransposeReset} style={{ marginLeft: 4 }}><IconRefresh size={14} /></Button>
                </Tooltip>
              </Group>
              <Text size="md" fw={600} color="#228be6">
                BPM: <span style={{ fontWeight: 700 }}>{song.bpm || '-'}</span>
              </Text>
              <Text size="md" fw={600} color="#228be6">
                DURAÇÃO: <span style={{ fontWeight: 700 }}>{song.duration || '-'}</span>
              </Text>
            </Group>
            <div className="player-main-content" style={{ width: '100%' }}>
              <div id="ytplayer" style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }} />
              {/* <Group mt="md">
                <Button onClick={isPlaying ? pause : play} leftSection={isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}>
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
              </Group> */}
            </div>
            {/* Volumes e outros controles */}
            <Stack gap="md" className="player-controls-stack" style={{ width: '100%', marginTop: 24 }}>
              {/* Canal YouTube */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do YouTube">
                  <IconBrandYoutube size={28} color="#e63946" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={ytMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setYtMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={ytSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setYtSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={ytVolume} onChange={setYtVolume} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group>
              {/* Canal Metrônomo */}
              {/* <Group gap="xs" align="center">
                <Tooltip label="Metrônomo">
                  <IconWaveSine size={28} color="#228be6" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={metroMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setMetroMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={metroSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setMetroSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={metroVolume} onChange={setMetroVolume} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group> */}
              {/* Canal PAD Cloud */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Cloud">
                  <IconMusic size={28} color="#51cf66" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={padCloudMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadCloudMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={padCloudSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadCloudSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={padCloudVol} onChange={setPadCloudVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group>
              {/* Canal Pad Shimmer - só carrega se liberado */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Shimmer">
                  <IconWaveSine size={28} color="#845ef7" />
                </Tooltip>
                {!shimmerEnabled ? (
                  <Button size="xs" variant="light" color="blue" onClick={() => {
                    setShimmerEnabled(true);
                    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                      playerRef.current.pauseVideo();
                    }
                  }} loading={shimmerLoading}>Liberar</Button>
                ) : (
                  <>
                    <Tooltip label="Mute">
                      <Button variant={padShimmerMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadShimmerMute(m => !m)}><IconVolumeOff size={16} /></Button>
                    </Tooltip>
                    <Tooltip label="Solo">
                      <Button variant={padShimmerSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadShimmerSolo(s => !s)}>S</Button>
                    </Tooltip>
                    <Slider min={0} max={100} value={padShimmerVol} onChange={setPadShimmerVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
                  </>
                )}
              </Group>
              {/* Canal Pad Guitar - só carrega se liberado */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Guitar">
                  <IconGuitarPick size={28} color="#fab005" />
                </Tooltip>
                {!guitarEnabled ? (
                  <Button size="xs" variant="light" color="yellow" onClick={() => {
                    setGuitarEnabled(true);
                    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                      playerRef.current.pauseVideo();
                    }
                  }} loading={guitarLoading}>Liberar</Button>
                ) : (
                  <>
                    <Tooltip label="Mute">
                      <Button variant={padGuitarMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadGuitarMute(m => !m)}><IconVolumeOff size={16} /></Button>
                    </Tooltip>
                    <Tooltip label="Solo">
                      <Button variant={padGuitarSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadGuitarSolo(s => !s)}>S</Button>
                    </Tooltip>
                    <Slider min={0} max={100} value={padGuitarVol} onChange={setPadGuitarVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
                  </>
                )}
              </Group>
            </Stack>
          </Stack>
          {/* Bloco de acordes abaixo do vídeo no mobile */}
          <Paper withBorder shadow="md" p="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
            <Text fw={700} size="lg" mb="xs">Acordes</Text>
            <Text size="sm" color="dimmed" mb="xs">
              {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {song.duration || '-'}
            </Text>
            {activeChordIdx !== -1 && transposedChords && transposedChords[activeChordIdx] ? (
              <Stack align="center" mb="sm" style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {/* Tap tempo dots */}
                <Group gap={8} mb={8} style={{ justifyContent: 'center', width: '100%' }}>
                  {(() => {
                    // Determina o número de tempos/barra (meter) do acorde
                    const chord = transposedChords[activeChordIdx];
                    let beats = 4;
                    if (chord.meter) {
                      // meter pode ser '4/4', '6/8', etc
                      const meterParts = chord.meter.split('/');
                      if (meterParts.length === 2 && !isNaN(Number(meterParts[0]))) {
                        beats = Number(meterParts[0]);
                      }
                    } else if (chord.barLength) {
                      beats = chord.barLength;
                    } else if (chord.tempo) {
                      beats = chord.tempo;
                    }
                    return Array.from({ length: beats }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: '#228be6',
                          transition: 'background 0.1s',
                          boxShadow: undefined
                        }}
                      />
                    ));
                  })()}
                </Group>
                <Stack align="center" gap={4} style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Text size="xl" fw={800} style={{ fontSize: 32, letterSpacing: 2, textAlign: 'center' }}>{transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note}</Text>
                  {/* {transposedChords[activeChordIdx].image && (
                    <img src={transposedChords[activeChordIdx].image} alt={transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note} style={{ width: 60, height: 60, objectFit: 'contain', margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', display: 'block' }} />
                  )} */}
                </Stack>
              </Stack>
            ) : (
              <Text size="md" color="dimmed">-</Text>
            )}
            {/* Próximos acordes diferentes */}
            <Stack gap={2} mt="md" style={{ width: '100%' }}>
              {(() => {
                if (!transposedChords || activeChordIdx === -1) return null;
                const current = transposedChords[activeChordIdx];
                const nextDiffs = [];
                let lastNote = current.note_fmt || current.note;
                for (let i = activeChordIdx + 1; i < transposedChords.length && nextDiffs.length < 5; i++) {
                  const n = transposedChords[i];
                  const note = n.note_fmt || n.note;
                  if (note !== lastNote) {
                    nextDiffs.push(note);
                    lastNote = note;
                  }
                }
                return nextDiffs.map((note, idx) => (
                  <>
                    {idx > 0 && <Divider my={2} />}
                    <Text key={note + idx} size="sm" color="gray.6" style={{ textAlign: 'center', opacity: 0.7 }}>{note}</Text>
                  </>
                ));
              })()}
            </Stack>
          </Paper>
        </Stack>
      ) : (
        <Group align="flex-start" gap="xl" style={{ width: '100%', minHeight: 400 }}>
          {/* Aviso de transposição diferente do original */}
          {transposition !== 0 && (
            <Group
              align="center"
              style={{
                background: 'var(--alert-bg)',
                border: '1px solid var(--alert-border)',
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
                width: '100%',
              }}
              className="alert-transpose"
            >
              <IconBrandYoutube size={22} color="var(--alert-icon)" style={{ marginRight: 6 }} />
              <Text size="sm" fw={600} style={{ color: 'var(--alert-text)' }}>
                Para melhor experiência, sugerimos zerar o volume do YouTube e aumentar o volume dos pads ao transpor o tom.
              </Text>
            </Group>
          )}
          {/* Bloco principal: vídeo, controles, volumes (80%) */}
          <Stack style={{ flex: 8, minWidth: 0 }}>
            <Group gap="xl" align="center" style={{ marginBottom: 16, marginTop: 8 }}>
              {/* CONTROLES DE TRANSPOSIÇÃO DESKTOP */}
              <Group gap={4} align="center">
                <Tooltip label="Diminuir tom">
                  <Button size="xs" variant="subtle" onClick={handleTransposeDown} disabled={transposition <= -14}><IconArrowDown size={16} /></Button>
                </Tooltip>
                <Tooltip label="Selecionar tom">
                  <Button
                    size="xs"
                    variant="outline"
                    color="blue"
                    onClick={() => setKeyModalOpen(true)}
                    style={{ fontWeight: 700, minWidth: 60 }}
                  >
                    TOM: {getTransposedKey(song.key || '-', transposition)}
                    {transposition !== 0 && (
                      <span style={{ fontWeight: 400, fontSize: 14, marginLeft: 4, color: '#888' }}>({transposition > 0 ? '+' : ''}{transposition})</span>
                    )}
                  </Button>
                </Tooltip>
                <Tooltip label="Aumentar tom">
                  <Button size="xs" variant="subtle" onClick={handleTransposeUp} disabled={transposition >= 14}><IconArrowUp size={16} /></Button>
                </Tooltip>
                <Tooltip label="Resetar tom">
                  <Button size="xs" variant="light" color="gray" onClick={handleTransposeReset} style={{ marginLeft: 4 }}><IconRefresh size={14} /></Button>
                </Tooltip>
              </Group>
              <Text size="md" fw={600} color="#228be6">
                BPM: <span style={{ fontWeight: 700 }}>{song.bpm || '-'}</span>
              </Text>
              <Text size="md" fw={600} color="#228be6">
                DURAÇÃO: <span style={{ fontWeight: 700 }}>{song.duration || '-'}</span>
              </Text>
            </Group>
            <div className="player-main-content" style={{ width: '100%' }}>
              <div id="ytplayer" style={{ width: '100%', height: 360, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }} />
              {/* <Group mt="md">
                <Button onClick={isPlaying ? pause : play} leftSection={isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}>
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Switch checked={metronomeOn} onChange={e => setMetronomeOn(e.currentTarget.checked)} label="Metrônomo" disabled={!metroLoaded && !metronomeOn} />
              </Group> */}
            </div>
            {/* Volumes e outros controles */}
            <Stack gap="md" className="player-controls-stack" style={{ width: '100%', marginTop: 32 }}>
              {/* Canal YouTube */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do YouTube">
                  <IconBrandYoutube size={28} color="#e63946" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={ytMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setYtMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={ytSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setYtSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={ytVolume} onChange={setYtVolume} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group>
              {/* Canal Metrônomo */}
              {/* <Group gap="xs" align="center">
                <Tooltip label="Metrônomo">
                  <IconWaveSine size={28} color="#228be6" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={metroMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setMetroMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={metroSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setMetroSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={metroVolume} onChange={setMetroVolume} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group> */}
              {/* Canal PAD Cloud */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Cloud">
                  <IconMusic size={28} color="#51cf66" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={padCloudMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadCloudMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={padCloudSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadCloudSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={padCloudVol} onChange={setPadCloudVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group>
              {/* Canal Pad Shimmer - só carrega se liberado (desktop) */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Shimmer">
                  <IconWaveSine size={28} color="#845ef7" />
                </Tooltip>
                {!shimmerEnabled ? (
                  <Button size="xs" variant="light" color="blue" onClick={() => setShimmerEnabled(true)} loading={shimmerLoading}>Liberar</Button>
                ) : (
                  <>
                    <Tooltip label="Mute">
                      <Button variant={padShimmerMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadShimmerMute(m => !m)}><IconVolumeOff size={16} /></Button>
                    </Tooltip>
                    <Tooltip label="Solo">
                      <Button variant={padShimmerSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadShimmerSolo(s => !s)}>S</Button>
                    </Tooltip>
                    <Slider min={0} max={100} value={padShimmerVol} onChange={setPadShimmerVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
                  </>
                )}
              </Group>
              {/* Canal Pad Guitar - só carrega se liberado (desktop) */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Guitar">
                  <IconGuitarPick size={28} color="#fab005" />
                </Tooltip>
                {!guitarEnabled ? (
                  <Button size="xs" variant="light" color="yellow" onClick={() => setGuitarEnabled(true)} loading={guitarLoading}>Liberar</Button>
                ) : (
                  <>
                    <Tooltip label="Mute">
                      <Button variant={padGuitarMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadGuitarMute(m => !m)}><IconVolumeOff size={16} /></Button>
                    </Tooltip>
                    <Tooltip label="Solo">
                      <Button variant={padGuitarSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadGuitarSolo(s => !s)}>S</Button>
                    </Tooltip>
                    <Slider min={0} max={100} value={padGuitarVol} onChange={setPadGuitarVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
                  </>
                )}
              </Group>
            </Stack>
          </Stack>
          {/* Bloco de acordes (20%) */}
          <Paper withBorder shadow="md" p="md" style={{ flex: 2, minWidth: 180, maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text fw={700} size="lg" mb="xs">Acordes</Text>
            {/* Timer */}
            <Text size="sm" color="dimmed" mb="xs">
              {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {song.duration || '-'}
            </Text>
            {/* Acorde atual em destaque */}
            {activeChordIdx !== -1 && transposedChords && transposedChords[activeChordIdx] ? (
              <Stack align="center" mb="sm" style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {/* Tap tempo dots */}
                <Group gap={8} mb={8} style={{ justifyContent: 'center', width: '100%' }}>
                  {(() => {
                    // Determina o número de tempos/barra (meter) do acorde
                    const chord = transposedChords[activeChordIdx];
                    let beats = 4;
                    if (chord.meter) {
                      // meter pode ser '4/4', '6/8', etc
                      const meterParts = chord.meter.split('/');
                      if (meterParts.length === 2 && !isNaN(Number(meterParts[0]))) {
                        beats = Number(meterParts[0]);
                      }
                    } else if (chord.barLength) {
                      beats = chord.barLength;
                    } else if (chord.tempo) {
                      beats = chord.tempo;
                    }
                    return Array.from({ length: beats }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: '#228be6',
                          transition: 'background 0.1s',
                          boxShadow: undefined
                        }}
                      />
                    ));
                  })()}
                </Group>
                <Stack align="center" gap={4} style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Text size="xl" fw={800} style={{ fontSize: 40, letterSpacing: 2, textAlign: 'center' }}>{transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note}</Text>
                  {/* {transposedChords[activeChordIdx].image && (
                    <img src={transposedChords[activeChordIdx].image} alt={transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note} width={80} height={80} style={{ objectFit: 'contain', margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', display: 'block' }} />
                  )} */}
                </Stack>
              </Stack>
            ) : (
              <Text size="md" color="dimmed">-</Text>
            )}
            {/* Próximos acordes diferentes */}
            <Stack gap={2} mt="md" style={{ width: '100%' }}>
              {(() => {
                if (!transposedChords || activeChordIdx === -1) return null;
                const current = transposedChords[activeChordIdx];
                const nextDiffs = [];
                let lastNote = current.note_fmt || current.note;
                for (let i = activeChordIdx + 1; i < transposedChords.length && nextDiffs.length < 5; i++) {
                  const n = transposedChords[i];
                  const note = n.note_fmt || n.note;
                  if (note !== lastNote) {
                    nextDiffs.push(note);
                    lastNote = note;
                  }
                }
                return nextDiffs.map((note, idx) => (
                  <>
                    {idx > 0 && <Divider my={2} />}
                    <Text key={note + idx} size="sm" color="gray.6" style={{ textAlign: 'center', opacity: 0.7 }}>{note}</Text>
                  </>
                ));
              })()}
            </Stack>
          </Paper>
        </Group>
      )}
      {/* CSS para esconder scrollbar e responsividade */}
      <style jsx global>{`
        :root {
          --alert-bg: #fff3bf;
          --alert-border: #ffe066;
          --alert-icon: #fab005;
          --alert-text: #fab005;
        }
        [data-mantine-color-scheme='dark'] {
          --alert-bg: #2d2a19;
          --alert-border: #b1973c;
          --alert-icon: #ffe066;
          --alert-text: #ffe066;
        }
        .hide-scrollbar {
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .player-main-content {
          width: 100%;
          margin-left: 0 !important;
        }
        .player-controls-stack {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-top: 32px !important;
          border-radius: 12px;
          box-shadow: 0 1px 6px #0001;
          padding: 20px;
        }
      `}</style>
    </Stack>
  );
}
