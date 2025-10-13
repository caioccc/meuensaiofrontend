
import { useEffect, useRef, useState } from 'react';

import { Box, Button, Group, Image, LoadingOverlay, Paper, Slider, Stack, Text } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconPlayerPause, IconPlayerPlay, IconPlayerStop, IconVolume } from '@tabler/icons-react';
import { transposeKey } from './transposeUtils';
import { formatTime } from './formatTime';

interface SongInfo {
  id: number;
  title: string;
  artist?: string;
  duration?: string;
  bpm?: number | null;
  key?: string;
  thumbnail_url?: string;
}

interface AudioTransposePlayerProps {
  audioUrl: string;
  song?: SongInfo;
}


export default function AudioTransposePlayer({ audioUrl, song }: AudioTransposePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [semitone, setSemitone] = useState(0);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(80);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pitchShiftRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gainRef = useRef<any>(null);

  const [seek, setSeek] = useState(0); // posição atual em segundos
  const [duration, setDuration] = useState(0); // duração total em segundos
  const seekStartRef = useRef<number | null>(null); // timestamp do início do play
  const seekBaseRef = useRef<number>(0); // posição base do seek ao dar play


  useEffect(() => {
    let Tone: any;
    let player: any;
    let pitchShift: any;
    let gain: any;
    setLoading(true);
    import('tone').then(_Tone => {
      Tone = _Tone;
      gain = new Tone.Gain(volume / 100).toDestination();
      gainRef.current = gain;
      pitchShift = new Tone.PitchShift({ pitch: semitone }).connect(gain);
      pitchShiftRef.current = pitchShift;
      player = new Tone.Player(audioUrl, () => {
        setLoading(false);
        setDuration(player.buffer.duration);
      }).connect(pitchShift);
      playerRef.current = player;
    });
    return () => {
      if (playerRef.current) playerRef.current.dispose();
      if (pitchShiftRef.current) pitchShiftRef.current.dispose();
      if (gainRef.current) gainRef.current.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Atualiza o seek em tempo real enquanto toca
  useEffect(() => {
    let raf: number;
    function updateSeek() {
      if (isPlaying && seekStartRef.current !== null) {
        const elapsed = (Date.now() - seekStartRef.current) / 1000;
        const newSeek = seekBaseRef.current + elapsed;
        setSeek(newSeek >= duration ? duration : newSeek);
        if (newSeek < duration) {
          raf = requestAnimationFrame(updateSeek);
        } else {
          setIsPlaying(false);
        }
      }
    }
    if (isPlaying) {
      raf = requestAnimationFrame(updateSeek);
    }
    return () => raf && cancelAnimationFrame(raf);
  }, [isPlaying, duration]);


  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = semitone;
    }
  }, [semitone]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  const handlePlay = () => {
    if (playerRef.current) {
      playerRef.current.start(seek);
      seekStartRef.current = Date.now();
      seekBaseRef.current = seek;
      setIsPlaying(true);
    }
  };
  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
      // Atualiza seekBaseRef para o ponto onde parou
      if (seekStartRef.current !== null) {
        const elapsed = (Date.now() - seekStartRef.current) / 1000;
        seekBaseRef.current = seekBaseRef.current + elapsed;
        setSeek(seekBaseRef.current);
        seekStartRef.current = null;
      }
    }
  };
  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.stop();
      setSeek(0);
      seekBaseRef.current = 0;
      seekStartRef.current = null;
      setIsPlaying(false);
    }
  };

  // Handler para o usuário buscar uma posição
  const handleSeekChange = (value: number) => {
    setSeek(value);
    seekBaseRef.current = value;
    if (playerRef.current) {
      playerRef.current.seek(value);
      if (isPlaying) {
        seekStartRef.current = Date.now();
      } else {
        seekStartRef.current = null;
      }
    }
  };
  // Reset seek ao chegar no fim
  useEffect(() => {
    if (!isPlaying && seek >= duration && duration > 0) {
      setSeek(0);
      seekBaseRef.current = 0;
      seekStartRef.current = null;
    }
  }, [isPlaying, seek, duration]);

  return (
    <Paper shadow="md" p="md" radius="md" w="100%">
      <>
        {loading && <LoadingOverlay visible overlayBlur={2} />}
      </>
      {song && (
        <Group align="flex-start" gap={32} mb={24} wrap="nowrap">
          {song.thumbnail_url && (
            <Image src={song.thumbnail_url} alt={song.title} width={48} height={48} radius="md" style={{ width: 80, height: 80 }} />
          )}
          <Stack gap={6} style={{ flex: 1 }}>
            <Text fw={700} size="lg">{song.title}</Text>
            {song.artist && <Text size="sm" c="dimmed">{song.artist}</Text>}
            <Group gap={20} mt={2}>
              {song.bpm && <Text size="xs">BPM: <b>{song.bpm}</b></Text>}
              {song.key && <Text size="xs">Tom original: <b>{song.key}</b></Text>}
              {song.duration && <Text size="xs">Duração: <b>{song.duration}</b></Text>}
            </Group>
          </Stack>
        </Group>
      )}
      <Stack gap={16} align="center" w="100%" mt={12} mb={12}>
        {/* Tempo decorrido */}
        <Text size="sm" fw={600} mb={-8} style={{ letterSpacing: 1 }}>{formatTime(seek)}</Text>
        {/* Seek Slider */}
        <Group w="100%" gap={8} mb={-8} align="center" justify="center">
          <Text size="xs" style={{ minWidth: 36, textAlign: 'right' }}>{formatTime(seek)}</Text>
          <Slider
            min={0}
            max={duration || 1}
            value={seek}
            onChange={handleSeekChange}
            step={0.01}
            style={{ flex: 1, minWidth: 120, maxWidth: 340 }}
            disabled={loading || !duration}
            label={null}
          />
          <Text size="xs" style={{ minWidth: 36, textAlign: 'left' }}>{formatTime(duration)}</Text>
        </Group>
        <Group gap={16} mb={8}>
          <Button leftSection={<IconPlayerPlay size={18} />} onClick={handlePlay} disabled={isPlaying || loading}></Button>
          <Button leftSection={<IconPlayerPause size={18} />} onClick={handlePause} disabled={!isPlaying || loading}></Button>
          <Button leftSection={<IconPlayerStop size={18} />} onClick={handleStop} disabled={loading}></Button>
          <Group gap={4} align="center" ml={16}>
            <IconVolume size={18} />
            <Slider min={0} max={100} value={volume} onChange={setVolume} style={{ width: 100 }} size="sm" />
          </Group>
        </Group>
        <Box w="100%" maw={340} mx="auto" mt={8}>
          <Group gap={8} align="center" justify="center">
            <Button size="xs" variant="light" onClick={() => setSemitone(s => Math.max(-8, s - 1))} disabled={semitone <= -8}><IconArrowDown size={16} /></Button>
            <Text size="md" fw={600} mx={8} style={{ minWidth: 60, textAlign: 'center' }}>
              {song?.key
                ? `${transposeKey(song.key, semitone)}${semitone !== 0 ? ` (${song.key}${semitone > 0 ? `+${semitone}` : semitone})` : ''}`
                : 'Tom'}
            </Text>
            <Button size="xs" variant="light" onClick={() => setSemitone(s => Math.min(8, s + 1))} disabled={semitone >= 8}><IconArrowUp size={16} /></Button>
          </Group>
          <Slider min={-8} max={8} value={semitone} onChange={setSemitone} step={1} marks={Array.from({ length: 25 }, (_, i) => ({ value: i - 12, label: String(i - 12) }))} style={{ width: '100%', marginTop: 8 }} />
        </Box>
      </Stack>
    </Paper>
  );
}
