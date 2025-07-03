/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Group, Loader, LoadingOverlay, Paper, Slider, Stack, Text, Tooltip } from '@mantine/core';
import { IconBrandYoutube, IconPlayerPause, IconPlayerPlay, IconPlayerStop, IconPlayerTrackNext, IconPlayerTrackPrev } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import api from '../../lib/axios';

interface Song {
  id: number;
  title: string;
  artist: string;
  youtube_id: string;
  chords_formatada?: Array<{
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
  view_count?: number;
  published_time?: string;
  thumbnail_url?: string;
}

interface SetlistPlayerProps {
  setlistId: number | string;
}

export default function SetlistPlayer({ setlistId }: SetlistPlayerProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlistName, setSetlistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const [ytVolume, setYtVolume] = useState(100);

  useEffect(() => {
    setLoading(true);
    api.get(`/setlists/${setlistId}/`).then(res => {
      setSongs(res.data.songs || []);
      setSetlistName(res.data.name || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setlistId]);

  const currentSong = songs[currentIdx];

  // YouTube player logic (simplificado)
  useEffect(() => {
    if (!currentSong) return;
    if (window.YT) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }, [currentSong]);

  useEffect(() => {
    if (!currentSong) return;
    let ytPlayer: any;
    function createPlayer() {
      if (!window.YT || !window.YT.Player) return;
      ytPlayer = new window.YT.Player('ytplayer', {
        videoId: currentSong.youtube_id,
        events: {
          onReady: () => {
            setIsPlaying(false);
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
              playerRef.current.setVolume(ytVolume);
            }
            // Toca automaticamente ao renderizar
            ytPlayer?.playVideo?.();
          },
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1);
            if (e.data === 0) { // vídeo terminou
              if (currentIdx < songs.length - 1) {
                setCurrentIdx(currentIdx + 1);
              } else {
                setCurrentIdx(0); // reinicia setlist
              }
            }
          },
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
  }, [currentSong?.youtube_id, currentIdx, songs.length, ytVolume]);

  useEffect(() => {
    if (
      playerRef.current &&
      typeof playerRef.current.setVolume === 'function' &&
      isPlaying
    ) {
      playerRef.current.setVolume(ytVolume);
    }
  }, [ytVolume, isPlaying]);

  const play = () => playerRef.current?.playVideo();
  const pause = () => playerRef.current?.pauseVideo();
  const stop = () => playerRef.current?.stopVideo();
  const goTo = (idx: number) => setCurrentIdx(idx);
  const next = () => setCurrentIdx(i => Math.min(i + 1, songs.length - 1));
  const prev = () => setCurrentIdx(i => Math.max(i - 1, 0));

  if (loading) return <Loader />;
  if (!currentSong && !loading) return <Text color="dimmed">Nenhuma música encontrada na setlist.</Text>;

  return (
    <Stack style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} zIndex={1000} overlayBlur={2} overlayProps={{ radius: "sm", blur: 2 }} />
      <Text fw={700} size="lg" mb="xs">Setlist: {setlistName}</Text>
      {/* Controles principais */}
      <Group mb="md">
        <Button onClick={prev} disabled={currentIdx === 0} leftSection={<IconPlayerTrackPrev size={18} />}>Anterior</Button>
        <Button onClick={isPlaying ? pause : play} leftSection={isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}>{isPlaying ? 'Pause' : 'Play'}</Button>
        <Button onClick={stop} leftSection={<IconPlayerStop size={18} />}>Stop</Button>
        <Button onClick={next} disabled={currentIdx === songs.length - 1} leftSection={<IconPlayerTrackNext size={18} />}>Próxima</Button>
      </Group>
      {/* Player YouTube */}
      <div id="ytplayer" style={{ width: '100%', height: 360, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }} />
      {/* Volume YouTube */}
      <Group spacing="xs" align="center" mt="md">
        <Tooltip label="YouTube">
          <IconBrandYoutube size={28} color="#e63946" />
        </Tooltip>
        <Slider min={0} max={100} value={ytVolume} onChange={setYtVolume} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
      </Group>
      {/* Sequência de músicas */}
      <Stack mt="xl" spacing="xs">
        <Text fw={500}>Sequência da setlist:</Text>
        {songs.map((s, idx) => (
          <Paper key={s.id} shadow={idx === currentIdx ? "md" : "xs"} p="xs" withBorder style={{ background: idx === currentIdx ? '#e7f5ff' : undefined, cursor: 'pointer' }} onClick={() => goTo(idx)}>
            <Text size="sm" fw={idx === currentIdx ? 700 : 400} color={idx === currentIdx ? 'blue' : undefined}>{idx + 1}. {s.title} - {s.bpm} - {s.key}</Text>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
