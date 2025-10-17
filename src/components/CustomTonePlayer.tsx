/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Button, Group, LoadingOverlay, Paper, Slider, Stack, Text } from '@mantine/core';
import { IconBrandWhatsapp, IconLink, IconShare } from '@tabler/icons-react';

import { IconArrowDown, IconArrowUp, IconPlayerPlay, IconPlayerStop, IconVolume } from '@tabler/icons-react';
import { formatTime } from './formatTime';
import { transposeKey } from './transposeUtils';

// Lista de tons maiores e menores para seleção rápida


const MAJOR_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MINOR_KEYS = MAJOR_KEYS.map(k => k + 'm');

import { useEffect, useRef, useState } from 'react';


import { transposeSongChords } from '@/lib/music';
import { Image } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

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
    audio_url: string;
  };
}

export default function CustomTonePlayer({ song }: PlayerProps) {
  // Função para copiar link
  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    navigator.clipboard.writeText(currentUrl)
      .then(() => {
        import('@mantine/notifications').then(({ showNotification }) => {
          showNotification({
            title: 'Link copiado',
            message: 'URL copiado para a área de transferência',
            color: 'green',
          });
        });
      })
      .catch(() => {
        import('@mantine/notifications').then(({ showNotification }) => {
          showNotification({
            title: 'Erro',
            message: 'Não foi possível copiar o link',
            color: 'red',
          });
        });
      });
  };

  // Função para compartilhar no WhatsApp
  const handleShareWhatsApp = () => {
    const currentUrl = window.location.href;
    const text = song.title ? `${song.title}\n${currentUrl}` : currentUrl;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Função para compartilhar via API nativa (redes sociais)
  const handleShareNative = () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: song.title,
        text: song.artist || '',
        url: currentUrl,
      });
    } else {
      handleCopyLink();
    }
  };
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
  // Ref para timeline de acordes
  const timelineRef = useRef<HTMLDivElement>(null);

  const isMobile = useMediaQuery('(max-width: 48em)');

  // Transpor acordes conforme o estado
  const transposedChords = transposeSongChords(song.chords_formatada || [], semitone);
  // Encontrar acorde ativo pelo tempo
  const activeChordIdx = transposedChords?.findIndex(
    c => seek >= c.start && seek < c.end
  );


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
      player = new Tone.Player(song.audio_url, () => {
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
  }, [song.audio_url]);

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

  const handlePlay = async () => {
    if (playerRef.current) {
      // Garante que não há sobreposição de players
      try { playerRef.current.stop(); } catch { }
      // Aguarda o buffer carregar antes de tocar
      if (!playerRef.current.buffer || !playerRef.current.buffer.loaded) {
        setLoading(true);
        await new Promise(resolve => {
          playerRef.current.buffer.onload = resolve;
        });
        setLoading(false);
      }
      playerRef.current.start(seekBaseRef.current);
      seekStartRef.current = Date.now();
      setIsPlaying(true);
    }
  };
  const handlePause = () => {
    if (playerRef.current && isPlaying) {
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

  return (
    <Paper shadow="md" p={32} radius="lg" w="100%" style={{ margin: '32px auto', maxWidth: 600 }}>
      <>
        {loading && <LoadingOverlay visible overlayBlur={2} />}
      </>
      {song && (
        <Box
          style={{
            width: '100%',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 24,
          }}
          className="ctp-info-block"
        >
          {!isMobile && (
            <>
              <Box
                style={{
                  minWidth: 80,
                  maxWidth: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {song.thumbnail_url && (
                  <Image src={song.thumbnail_url} alt={song.title} width={80} height={80} radius="md" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                )}
              </Box>

              <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700} size="lg" style={{ wordBreak: 'break-word' }}>{song.title}</Text>
                {song.artist && <Text size="sm" c="dimmed" style={{ wordBreak: 'break-word' }}>{song.artist}</Text>}
                <Group gap={12} mt={2} wrap="wrap">
                  {song.bpm && <Text size="xs">BPM: <b>{song.bpm}</b></Text>}
                  {song.key && <Text size="xs">Tom: <b>{song.key}</b></Text>}
                  {song.duration && <Text size="xs">Duração: <b>{song.duration}</b></Text>}
                </Group>
                {/* Botões de compartilhamento no mobile ficam abaixo das infos */}
                <Group gap={12} mt={8} align="center" justify="flex-start" style={{ flexWrap: 'wrap' }}>
                  <Button leftSection={<IconBrandWhatsapp size={18} />} size="xs" variant="light" onClick={handleShareWhatsApp} disabled={!song.link}>WhatsApp</Button>
                  <Button leftSection={<IconLink size={18} />} size="xs" variant="light" onClick={handleCopyLink} disabled={!song.link}>Copiar Link</Button>
                  <Button leftSection={<IconShare size={18} />} size="xs" variant="light" onClick={handleShareNative} disabled={!song.link}>Redes sociais</Button>
                </Group>
              </Stack>
            </>
          )}
          {isMobile && (
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
              <Box
                style={{
                  minWidth: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {song.thumbnail_url && (
                  <Image src={song.thumbnail_url} alt={song.title} radius="md" style={{ width: 140, height: 140, objectFit: 'cover' }} />
                )}
              </Box>

              <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700} size="lg" style={{ wordBreak: 'break-word' }}>{song.title}</Text>
                {song.artist && <Text size="sm" c="dimmed" style={{ wordBreak: 'break-word' }}>{song.artist}</Text>}
                <Group gap={12} mt={2} wrap="wrap">
                  {song.bpm && <Text size="xs">BPM: <b>{song.bpm}</b></Text>}
                  {song.key && <Text size="xs">Tom: <b>{song.key}</b></Text>}
                  {song.duration && <Text size="xs">Duração: <b>{song.duration}</b></Text>}
                </Group>
                {/* Botões de compartilhamento no mobile ficam abaixo das infos */}
                <Group gap={12} mt={8} align="center" justify="center" style={{ flexWrap: 'wrap' }}>
                  <Button size="xs" variant="light" onClick={handleShareWhatsApp} disabled={!song.link}><IconBrandWhatsapp size={18} /></Button>
                  <Button size="xs" variant="light" onClick={handleCopyLink} disabled={!song.link}><IconLink size={18} /></Button>
                  <Button size="xs" variant="light" onClick={handleShareNative} disabled={!song.link}><IconShare size={18} /></Button>
                </Group>
              </Stack>
            </Box>
          )}
        </Box>
      )}
      <Stack gap={16} align="center" w="100%" mt={24} mb={24}>
        {/* Botões de compartilhamento removidos daqui, agora ficam junto das infos no mobile */}
        {/* Tempo decorrido */}
        <Text size="sm" fw={600} style={{ letterSpacing: 1 }}>{formatTime(seek)}</Text>
        {/* Seek Slider */}
        <Group w="100%" gap={1} mb={-4} align="center" justify="center">
          {
            !isPlaying && (
              <Button onClick={handlePlay} disabled={isPlaying || loading}>
                <IconPlayerPlay size={18} />
              </Button>
            )
          }
          {/* {
            isPlaying && (
              <Button leftSection={<IconPlayerPause size={18} />} onClick={handlePause} disabled={!isPlaying || loading}></Button>
            )
          } */}
          {
            isPlaying && (
              <Button onClick={handleStop} disabled={!isPlaying || loading}>
                <IconPlayerStop size={18} />
              </Button>
            )
          }
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
        <Group gap={12} align="center" ml={24}>
          <IconVolume size={18} />
          <Slider min={0} max={100} value={volume} onChange={setVolume} style={{ width: 100 }} size="sm" />
        </Group>
        {/* Bloco de acordes: anterior, atual, próximos */}
        {
          !isMobile && (
            <Paper withBorder shadow="md" p={24} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24, marginBottom: 24 }}>
              <Text size="sm" color="dimmed">
                {formatTime(seek)} / {song.duration || '-'}
              </Text>
              {activeChordIdx !== -1 && transposedChords && transposedChords[activeChordIdx] ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '24px 0' }}>
                  {/* Tap tempo dots pulsando */}
                  <Group gap={8} mb={16} style={{ justifyContent: 'center', width: '100%' }}>
                    {(() => {
                      const chord = transposedChords[activeChordIdx];
                      let beats = 4;
                      if (chord.meter) {
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
                  {/* Trilha horizontal de acordes */}
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 20 }}>
                    {/* Acorde anterior (se houver e diferente do atual) */}
                    {activeChordIdx > 0 && (() => {
                      let prevIdx = activeChordIdx - 1;
                      let prevChord = null;
                      const currentNote = transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note;
                      while (prevIdx >= 0) {
                        const note = transposedChords[prevIdx].note_fmt || transposedChords[prevIdx].note;
                        if (note !== currentNote) {
                          prevChord = transposedChords[prevIdx];
                          break;
                        }
                        prevIdx--;
                      }
                      return prevChord ? (
                        <div
                          className="chord-mobile-item prev"
                          style={{
                            minWidth: 24,
                            minHeight: 24,
                            padding: 4,
                            borderRadius: 8,
                            background: '#e3f0ff',
                            color: '#0082ff',
                            border: '2px solid #b6d6ff',
                            boxShadow: '0 2px 8px #0082ff22',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 24,
                            letterSpacing: 1,
                            margin: '0 2px',
                            opacity: 0.7,
                            zIndex: 1,
                          }}
                        >
                          {prevChord.note_fmt || prevChord.note}
                        </div>
                      ) : null;
                    })()}
                    {/* Acorde atual em destaque */}
                    <div
                      className="chord-mobile-item active"
                      style={{
                        minWidth: 32,
                        minHeight: 32,
                        padding: 4,
                        borderRadius: 8,
                        background: '#0082ff',
                        color: '#fff',
                        border: '3px solid #0082ff',
                        boxShadow: '0 4px 24px #0082ff55',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 24,
                        letterSpacing: 2,
                        margin: '0 2px',
                        transform: 'scale(1.2)',
                        transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
                        zIndex: 2,
                      }}
                    >
                      {transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note}
                    </div>
                    {/* Próximos acordes diferentes (até 3) */}
                    {(() => {
                      const nextDiffs = [];
                      let lastNote = transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note;
                      for (let i = activeChordIdx + 1; i < transposedChords.length && nextDiffs.length < 3; i++) {
                        const n = transposedChords[i];
                        const note = n.note_fmt || n.note;
                        if (note !== lastNote) {
                          nextDiffs.push(note);
                          lastNote = note;
                        }
                      }
                      return nextDiffs.map((note, idx) => (
                        <div
                          key={note + idx}
                          className="chord-mobile-item next"
                          style={{
                            minWidth: 24,
                            minHeight: 24,
                            padding: 4,
                            borderRadius: 8,
                            background: '#e3f0ff',
                            color: '#0082ff',
                            border: '2px solid #b6d6ff',
                            boxShadow: '0 2px 8px #0082ff22',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 24,
                            letterSpacing: 1,
                            margin: '0 2px',
                            opacity: 0.7,
                            zIndex: 1,
                          }}
                        >
                          {note}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                <Text size="md" color="dimmed">-</Text>
              )}
            </Paper>
          )
        }

        {/* Bloco de acordes mobile: trilha horizontal animada mostrando anterior, atual e próximos diferentes */}
        {isMobile && (
          <Paper withBorder shadow="md" p="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8, }}>
            <Text size="sm" color="dimmed">
              {new Date(seek * 1000).toISOString().substr(14, 5)} / {song.duration || '-'}
            </Text>
            {/* Trilha horizontal: acorde anterior (se houver), atual em destaque, próximos diferentes */}
            {activeChordIdx !== -1 && transposedChords && transposedChords[activeChordIdx] ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '16px 0' }}>
                {/* Tap tempo dots pulsando */}
                <Group gap={8} mb={16} style={{ justifyContent: 'center', width: '100%' }}>
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
                {/* Trilha horizontal de acordes */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 8 }}>
                  {/* Acorde anterior (se houver e diferente do atual) */}
                  {activeChordIdx > 0 && (() => {
                    // Busca o último acorde diferente do atual
                    let prevIdx = activeChordIdx - 1;
                    let prevChord = null;
                    const currentNote = transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note;
                    while (prevIdx >= 0) {
                      const note = transposedChords[prevIdx].note_fmt || transposedChords[prevIdx].note;
                      if (note !== currentNote) {
                        prevChord = transposedChords[prevIdx];
                        break;
                      }
                      prevIdx--;
                    }
                    return prevChord ? (
                      <div
                        className="chord-mobile-item prev"
                        style={{
                          minWidth: 24,
                          minHeight: 24,
                          padding: 4,
                          borderRadius: 8,
                          background: 'light-dark(#e3f0ff, #333)',
                          color: 'light-dark(#0082ff, #fff)',
                          border: '2px solid light-dark(#b6d6ff, 0.5)',
                          boxShadow: '0 2px 8px light-dark(#0082ff22, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 24,
                          letterSpacing: 1,
                          margin: '0 2px',
                          opacity: 0.7,
                          zIndex: 1,
                        }}
                      >
                        {prevChord.note_fmt || prevChord.note}
                      </div>
                    ) : null;
                  })()}
                  {/* Acorde atual em destaque */}
                  <div
                    className="chord-mobile-item active"
                    style={{
                      minWidth: 32,
                      minHeight: 32,
                      padding: 4,
                      borderRadius: 8,
                      background: '#0082ff',
                      color: '#fff',
                      border: '3px solid #0082ff',
                      boxShadow: '0 4px 24px #0082ff55',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 24,
                      letterSpacing: 2,
                      margin: '0 2px',
                      transform: 'scale(1.2)',
                      transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
                      zIndex: 2,
                    }}
                  >
                    {transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note}
                  </div>
                  {/* Próximos acordes diferentes (até 3) */}
                  {(() => {
                    const nextDiffs = [];
                    let lastNote = transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note;
                    for (let i = activeChordIdx + 1; i < transposedChords.length && nextDiffs.length < 3; i++) {
                      const n = transposedChords[i];
                      const note = n.note_fmt || n.note;
                      if (note !== lastNote) {
                        nextDiffs.push(note);
                        lastNote = note;
                      }
                    }
                    return nextDiffs.map((note, idx) => (
                      <div
                        key={note + idx}
                        className="chord-mobile-item next"
                        style={{
                          minWidth: 24,
                          minHeight: 24,
                          padding: 4,
                          borderRadius: 8,
                          background: 'light-dark(#e3f0ff, #333)',
                          color: 'light-dark(#0082ff, #fff)',
                          border: '2px solid light-dark(#b6d6ff, 0.5)',
                          boxShadow: '0 2px 8px light-dark(#0082ff22, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 24,
                          letterSpacing: 1,
                          margin: '0 2px',
                          opacity: 0.7,
                          zIndex: 1,
                        }}
                      >
                        {note}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <Text size="md" color="dimmed">-</Text>
            )}
          </Paper>
        )}
        <Box w="100%" maw={340} mx="auto" mt={24}>
          <Group gap={16} align="center" justify="center">
            <Button size="xs" variant="light" onClick={() => setSemitone(s => Math.max(-3, s - 1))} disabled={semitone <= -3}><IconArrowDown size={16} /></Button>
            <Text size="md" fw={600} mx={8} style={{ minWidth: 60, textAlign: 'center' }}>
              {song?.key
                ? `${transposeKey(song.key, semitone)}${semitone !== 0 ? ` (${song.key}${semitone > 0 ? `+${semitone}` : semitone})` : ''}`
                : 'Tom'}
            </Text>
            <Button size="xs" variant="light" onClick={() => setSemitone(s => Math.min(12, s + 1))} disabled={semitone >= 12}><IconArrowUp size={16} /></Button>
          </Group>
          <Slider min={-3} max={12} value={semitone} onChange={setSemitone} step={1} marks={Array.from({ length: 16 }, (_, i) => ({ value: i - 3, label: String(i - 3) }))} style={{ width: '100%', marginTop: 8 }} />
        </Box>
      </Stack>
    </Paper>
  );
}