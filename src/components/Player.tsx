/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Group, LoadingOverlay, Slider, Stack, Text, Tooltip } from '@mantine/core';
import { IconBrandYoutube, IconGuitarPick, IconMusic, IconPlayerPause, IconPlayerPlay, IconVolumeOff, IconWaveSine } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { guitarSamples, padSamples, shimmerSamples } from '../constants/padMaps';

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
  const anySolo = ytSolo || padCloudSolo || padShimmerSolo || padGuitarSolo;
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
  const play = () => playerRef.current?.playVideo();
  const pause = () => playerRef.current?.pauseVideo();

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

  return (
    <Stack style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} overlayProps={{ radius: "sm", blur: 2 }} />
      {/* Características da música */}
      <Group spacing="xl" align="center" style={{ marginBottom: 16, marginTop: 8 }}>
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
      {/* Seção principal: vídeo, timeline, etc */}
      <div className="player-main-content" style={{ width: '100%' }}>
        <div id="ytplayer" style={{ width: '100%', height: 360, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }} />
        <Group mt="md">
          <Button onClick={isPlaying ? pause : play} leftSection={isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}>
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          {/* <Switch checked={metronomeOn} onChange={e => setMetronomeOn(e.currentTarget.checked)} label="Metrônomo" disabled={!metroLoaded && !metronomeOn} /> */}
        </Group>
        {/* Linha do tempo de acordes */}
        <div
          ref={timelineRef}
          style={{
            minHeight: 60,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'nowrap',
            justifyContent: 'flex-start',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            position: 'relative',
            padding: '8px 0',
            marginTop: 16,
          }}
          className="hide-scrollbar"
        >
          {song.chords_formatada?.map((c, i) => {
            if (activeChordIdx === i) {
              // Bloco ativo: imagem + nota animada
              return (
                <div
                  key={i}
                  style={{
                    width: 48,
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #228be6 60%, #b2d8ff 100%)',
                    boxShadow: '0 0 16px 2px #228be6aa',
                    transform: 'scale(1.15)',
                    transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
                    border: '2px solid #228be6',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <img src={c.image} alt={c.note_fmt} width={36} height={48} style={{ filter: 'drop-shadow(0 0 6px #228be6)' }} />
                  <Text color="white" fw={700} size="lg" span style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', textShadow: '0 2px 8px #228be6' }}>
                    {c.note_fmt}
                  </Text>
                </div>
              );
            } else if (i > (activeChordIdx ?? -1)) {
              // Notas futuras: só nota, sem imagem
              return (
                <div
                  key={i}
                  style={{
                    width: 48,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    background: '#e7f5ff',
                    border: '1px solid #a5d8ff',
                    color: '#228be6',
                    fontWeight: 600,
                    fontSize: 22,
                    opacity: 0.7,
                    transition: 'all 0.2s',
                  }}
                >
                  {c.note_fmt}
                </div>
              );
            } else {
              // Notas passadas: marcador discreto
              return (
                <div
                  key={i}
                  style={{
                    width: 36,
                    height: 48,
                    opacity: 0.15,
                    borderRadius: 8,
                    background: '#dee2e6',
                    margin: '0 6px',
                  }}
                />
              );
            }
          })}
        </div>
      </div>
      {/* Seção de controles de volume abaixo */}
      <Stack spacing="md" className="player-controls-stack" style={{ width: '100%', marginTop: 32 }}>
        {/* Canal YouTube */}
        <Group spacing="xs" align="center">
          <Tooltip label="YouTube">
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
        {/* <Group spacing="xs" align="center">
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
        <Group spacing="xs" align="center">
          <Tooltip label="Pad Cloud">
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
        <Group spacing="xs" align="center">
          <Tooltip label="Pad Shimmer">
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
        <Group spacing="xs" align="center">
          <Tooltip label="Pad Guitar">
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
          background: #f8fafc;
          padding: 20px;
        }
      `}</style>
    </Stack>
  );
}
