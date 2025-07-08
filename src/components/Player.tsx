/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Divider, Group, LoadingOverlay, Paper, Slider, Stack, Text, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBrandYoutube, IconGuitarPick, IconMusic, IconVolumeOff, IconWaveSine } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { guitarSamples, padSamples, shimmerSamples } from '../constants/padMaps';
import { useAuth } from '../contexts/AuthContext';

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
  const { isPro } = useAuth();
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [ytVolume, setYtVolume] = useState(60);
  const [padsLoading, setPadsLoading] = useState(true);
  const [padCloudVol, setPadCloudVol] = useState(80);
  const [padShimmerVol, setPadShimmerVol] = useState(80);
  const [padGuitarVol, setPadGuitarVol] = useState(80);
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

  // Encontrar acorde ativo pelo tempo
  const activeChordIdx = song.chords_formatada?.findIndex(
    c => currentTime >= c.start && currentTime < c.end
  );

  // Carregar samples dos pads com Tone.js
  useEffect(() => {
    setPadsLoading(true);
    const key = song.key || 'C';
    const padCloudUrl = padSamples[key] || padSamples['C'];
    const padShimmerUrl = shimmerSamples[key] || shimmerSamples['C'];
    const padGuitarUrl = guitarSamples[key] || guitarSamples['C'];
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded === 3) setPadsLoading(false);
    };
    // Cloud
    padCloudPlayer.current = new Tone.Player({ url: padCloudUrl, autostart: false, onload: checkLoaded }).toDestination();
    padCloudPlayer.current.volume.value = (padCloudVol - 100);
    // Shimmer
    padShimmerPlayer.current = new Tone.Player({ url: padShimmerUrl, autostart: false, onload: checkLoaded }).toDestination();
    padShimmerPlayer.current.volume.value = (padShimmerVol - 100);
    // Guitar
    padGuitarPlayer.current = new Tone.Player({ url: padGuitarUrl, autostart: false, onload: checkLoaded }).toDestination();
    padGuitarPlayer.current.volume.value = (padGuitarVol - 100);
    return () => {
      padCloudPlayer.current?.dispose();
      padShimmerPlayer.current?.dispose();
      padGuitarPlayer.current?.dispose();
    };
  }, [song.key]);

  // Sincronizar pads com play/pause do vídeo
  useEffect(() => {
    if (padsLoading) return;
    if (isPlaying) {
      padCloudPlayer.current?.start();
      padShimmerPlayer.current?.start();
      padGuitarPlayer.current?.start();
    } else {
      padCloudPlayer.current?.stop();
      padShimmerPlayer.current?.stop();
      padGuitarPlayer.current?.stop();
    }
  }, [isPlaying, padsLoading]);

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

  // Aplicar mute/solo nos canais
  useEffect(() => {
    // YouTube
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      if (isChannelActive(ytMute, ytSolo)) {
        playerRef.current.setVolume(ytVolume);
      } else {
        playerRef.current.setVolume(0);
      }
    }
    // Pads
    if (padCloudPlayer.current) padCloudPlayer.current.volume.value = isChannelActive(padCloudMute, padCloudSolo) ? (padCloudVol - 100) : -100;
    if (padShimmerPlayer.current) padShimmerPlayer.current.volume.value = isChannelActive(padShimmerMute, padShimmerSolo) ? (padShimmerVol - 100) : -100;
    if (padGuitarPlayer.current) padGuitarPlayer.current.volume.value = isChannelActive(padGuitarMute, padGuitarSolo) ? (padGuitarVol - 100) : -100;
  }, [ytMute, ytSolo, ytVolume, padCloudMute, padCloudSolo, padCloudVol, padShimmerMute, padShimmerSolo, padShimmerVol, padGuitarMute, padGuitarSolo, padGuitarVol, anySolo]);

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
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
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
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      {isMobile ? (
        <Stack gap="md" style={{ width: '100%' }}>
          {/* Bloco principal: vídeo, controles, volumes */}
          <Stack style={{ width: '100%' }}>
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
              {/* Canal Pad Shimmer */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Shimmer">
                  <IconWaveSine size={28} color="#845ef7" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={padShimmerMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadShimmerMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={padShimmerSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadShimmerSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={padShimmerVol} onChange={setPadShimmerVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group>
              {/* Canal Pad Guitar */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Guitar">
                  <IconGuitarPick size={28} color="#fab005" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={padGuitarMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadGuitarMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={padGuitarSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadGuitarSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={padGuitarVol} onChange={setPadGuitarVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group>
            </Stack>
          </Stack>
          {/* Bloco de acordes abaixo do vídeo no mobile */}
          <Paper withBorder shadow="md" p="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
            <Text fw={700} size="lg" mb="xs">Acordes</Text>
            <Text size="sm" color="dimmed" mb="xs">
              {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {song.duration || '-'}
            </Text>
            {activeChordIdx !== -1 && song.chords_formatada && song.chords_formatada[activeChordIdx] ? (
              <Stack align="center" mb="sm" style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {/* Tap tempo dots */}
                <Group gap={8} mb={8} style={{ justifyContent: 'center', width: '100%' }}>
                  {Array.from({ length: song.chords_formatada[activeChordIdx].barLength || 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: i === Math.floor(((currentTime - song.chords_formatada[activeChordIdx].start) / ((song.chords_formatada[activeChordIdx].end - song.chords_formatada[activeChordIdx].start) / (song.chords_formatada[activeChordIdx].barLength || 4))) % (song.chords_formatada[activeChordIdx].barLength || 4)) ? '#228be6' : '#d0ebff',
                        transition: 'background 0.1s',
                        boxShadow: i === Math.floor(((currentTime - song.chords_formatada[activeChordIdx].start) / ((song.chords_formatada[activeChordIdx].end - song.chords_formatada[activeChordIdx].start) / (song.chords_formatada[activeChordIdx].barLength || 4))) % (song.chords_formatada[activeChordIdx].barLength || 4)) ? '0 0 8px #228be6' : undefined
                      }}
                    />
                  ))}
                </Group>
                <Stack align="center" gap={4} style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Text size="xl" fw={800} style={{ fontSize: 32, letterSpacing: 2, textAlign: 'center' }}>{song.chords_formatada[activeChordIdx].note_fmt || song.chords_formatada[activeChordIdx].note}</Text>
                  {song.chords_formatada[activeChordIdx].image && (
                    <img src={song.chords_formatada[activeChordIdx].image} alt={song.chords_formatada[activeChordIdx].note_fmt || song.chords_formatada[activeChordIdx].note} style={{ width: 60, height: 60, objectFit: 'contain', margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', display: 'block' }} />
                  )}
                </Stack>
              </Stack>
            ) : (
              <Text size="md" color="dimmed">-</Text>
            )}
            {/* Próximos acordes diferentes */}
            <Stack gap={2} mt="md" style={{ width: '100%' }}>
              {(() => {
                if (!song.chords_formatada || activeChordIdx === -1) return null;
                const current = song.chords_formatada[activeChordIdx];
                const nextDiffs = [];
                let lastNote = current.note_fmt || current.note;
                for (let i = activeChordIdx + 1; i < song.chords_formatada.length && nextDiffs.length < 5; i++) {
                  const n = song.chords_formatada[i];
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
          {/* Bloco principal: vídeo, controles, volumes (80%) */}
          <Stack style={{ flex: 8, minWidth: 0 }}>
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
              {/* Canal Pad Shimmer */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Shimmer">
                  <IconWaveSine size={28} color="#845ef7" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={padShimmerMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadShimmerMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={padShimmerSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadShimmerSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={padShimmerVol} onChange={setPadShimmerVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
              </Group>
              {/* Canal Pad Guitar */}
              <Group gap="xs" align="center">
                <Tooltip label="Volume do Pad Guitar">
                  <IconGuitarPick size={28} color="#fab005" />
                </Tooltip>
                <Tooltip label="Mute">
                  <Button variant={padGuitarMute ? 'filled' : 'subtle'} color="red" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadGuitarMute(m => !m)}><IconVolumeOff size={16} /></Button>
                </Tooltip>
                <Tooltip label="Solo">
                  <Button variant={padGuitarSolo ? 'filled' : 'subtle'} color="blue" size="xs" style={{ width: 32, minWidth: 0, padding: 0 }} onClick={() => setPadGuitarSolo(s => !s)}>S</Button>
                </Tooltip>
                <Slider min={0} max={100} value={padGuitarVol} onChange={setPadGuitarVol} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
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
            {activeChordIdx !== -1 && song.chords_formatada && song.chords_formatada[activeChordIdx] ? (
              <Stack align="center" mb="sm" style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {/* Tap tempo dots */}
                <Group gap={8} mb={8} style={{ justifyContent: 'center', width: '100%' }}>
                  {Array.from({ length: song.chords_formatada[activeChordIdx].barLength || 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: i === Math.floor(((currentTime - song.chords_formatada[activeChordIdx].start) / ((song.chords_formatada[activeChordIdx].end - song.chords_formatada[activeChordIdx].start) / (song.chords_formatada[activeChordIdx].barLength || 4))) % (song.chords_formatada[activeChordIdx].barLength || 4)) ? '#228be6' : '#d0ebff',
                        transition: 'background 0.1s',
                        boxShadow: i === Math.floor(((currentTime - song.chords_formatada[activeChordIdx].start) / ((song.chords_formatada[activeChordIdx].end - song.chords_formatada[activeChordIdx].start) / (song.chords_formatada[activeChordIdx].barLength || 4))) % (song.chords_formatada[activeChordIdx].barLength || 4)) ? '0 0 8px #228be6' : undefined
                      }}
                    />
                  ))}
                </Group>
                <Stack align="center" gap={4} style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Text size="xl" fw={800} style={{ fontSize: 40, letterSpacing: 2, textAlign: 'center' }}>{song.chords_formatada[activeChordIdx].note_fmt || song.chords_formatada[activeChordIdx].note}</Text>
                  {song.chords_formatada[activeChordIdx].image && (
                    <img src={song.chords_formatada[activeChordIdx].image} alt={song.chords_formatada[activeChordIdx].note_fmt || song.chords_formatada[activeChordIdx].note} style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', display: 'block' }} />
                  )}
                </Stack>
              </Stack>
            ) : (
              <Text size="md" color="dimmed">-</Text>
            )}
            {/* Próximos acordes diferentes */}
            <Stack gap={2} mt="md" style={{ width: '100%' }}>
              {(() => {
                if (!song.chords_formatada || activeChordIdx === -1) return null;
                const current = song.chords_formatada[activeChordIdx];
                const nextDiffs = [];
                let lastNote = current.note_fmt || current.note;
                for (let i = activeChordIdx + 1; i < song.chords_formatada.length && nextDiffs.length < 5; i++) {
                  const n = song.chords_formatada[i];
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
