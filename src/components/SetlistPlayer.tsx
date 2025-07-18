/* eslint-disable @typescript-eslint/no-explicit-any */
import { Anchor, Breadcrumbs, Button, Divider, Group, LoadingOverlay, Modal, Paper, Slider, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconBrandYoutube, IconPlayerPause, IconPlayerPlay, IconPlayerStop, IconPlayerTrackNext, IconPlayerTrackPrev, IconRefresh } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { getTransposedKey, transposeSongChords } from '../lib/music';
// Lista de tons maiores e menores para seleção rápida
const MAJOR_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MINOR_KEYS = MAJOR_KEYS.map(k => k + 'm');

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
  const { t } = useTranslation('common');
  const { isPro } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlistName, setSetlistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const [ytVolume, setYtVolume] = useState(100);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    api.get(`/setlists/${setlistId}/`).then(res => {
      setSongs(res.data.songs || []);
      setSetlistName(res.data.name || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setlistId]);

  const currentSong = songs[currentIdx];

  // Estado de transposição por música
  const [transpositions, setTranspositions] = useState<{ [songId: number]: number }>({});

  // Funções de controle de transposição
  const currentTransposition = currentSong ? (transpositions[currentSong.id] || 0) : 0;
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const handleTransposeUp = () => currentSong && setTranspositions(t => ({ ...t, [currentSong.id]: Math.min((t[currentSong.id] || 0) + 1, 14) }));
  const handleTransposeDown = () => currentSong && setTranspositions(t => ({ ...t, [currentSong.id]: Math.max((t[currentSong.id] || 0) - 1, -14) }));
  const handleTransposeReset = () => currentSong && setTranspositions(t => ({ ...t, [currentSong.id]: 0 }));
  // Seleção direta de tom (maior/menor)
  const handleSelectKey = (key: string) => {
    if (!currentSong) return;
    // Detecta se o tom base é menor
    const baseKeyRaw = currentSong.key || 'C';
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
    // Se o usuário selecionou um menor, mas a música era maior, ou vice-versa, atualiza o campo transpositions e key
    setTranspositions(t => ({ ...t, [currentSong.id]: diff }));
    // Opcional: poderia atualizar o campo key da música, mas aqui só transpoe
    setKeyModalOpen(false);
  };

  // Transpor acordes da música atual
  const transposedChords = currentSong?.chords_formatada ? transposeSongChords(currentSong.chords_formatada, currentTransposition) : [];

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
            ytPlayer?.playVideo?.();
          },
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1);
            if (e.data === 0) {
              if (currentIdx < songs.length - 1) {
                setCurrentIdx(currentIdx + 1);
              } else {
                setCurrentIdx(0);
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
  }, [currentSong?.youtube_id, currentIdx, songs.length]); // REMOVIDO ytVolume

  // Atualiza volume do player YouTube apenas se estiver tocando
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

  // Encontrar acorde ativo pelo tempo
  const [currentTime, setCurrentTime] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 48em)').matches;

  // Atualiza currentTime periodicamente
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setCurrentTime(playerRef.current.getCurrentTime() || 0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Encontrar acorde ativo pelo tempo
  const activeChordIdx = currentSong?.chords_formatada?.findIndex(
    c => currentTime >= c.start && currentTime < c.end
  );

  if (loading) return <LoadingOverlay visible={loading} zIndex={1000} />;
  if (!currentSong && !loading) return <Text color="dimmed">{t('setlistPlayer.noSongs')}</Text>;

  return (
    <Stack style={{ position: 'relative' }}>
      <Breadcrumbs mb="md">
        <Anchor onClick={() => router.push('/dashboard')}>{t('setlistPlayer.breadcrumbHome')}</Anchor>
        <Anchor onClick={() => router.push('/setlists')}>{t('setlistPlayer.breadcrumbSetlists')}</Anchor>
        <Text>{t('setlistPlayer.breadcrumbPlayer')}</Text>
        <Text>{setlistName}</Text>
      </Breadcrumbs>
      <LoadingOverlay visible={loading} zIndex={1000} />
      <Text fw={700} size="lg" mb="xs">{t('setlistPlayer.setlist')}: {setlistName}</Text>
      {/* Controles principais */}
      {isMobile ? (
        <Group mb="md" width="100%" align="center" justify="space-between">
          <Button onClick={prev} disabled={currentIdx === 0} variant="subtle" size="md" px={8} style={{ minWidth: 0 }} leftSection={<IconPlayerTrackPrev size={20} />} ></Button>
          <Button onClick={isPlaying ? pause : play} leftSection={isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}>{isPlaying ? t('setlistPlayer.pause') : t('setlistPlayer.play')}</Button>
          <Button onClick={stop} variant="subtle" size="md" px={8} style={{ minWidth: 0 }} leftSection={<IconPlayerStop size={20} />} ></Button>
          <Button onClick={next} disabled={currentIdx === songs.length - 1} variant="subtle" size="md" px={8} style={{ minWidth: 0 }} leftSection={<IconPlayerTrackNext size={20} />} ></Button>
        </Group>
      ) : (
        <Group mb="md">
          <Button onClick={prev} disabled={currentIdx === 0} leftSection={<IconPlayerTrackPrev size={18} />}>{t('setlistPlayer.previous')}</Button>
          <Button onClick={isPlaying ? pause : play} leftSection={isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}>{isPlaying ? t('setlistPlayer.pause') : t('setlistPlayer.play')}</Button>
          <Button onClick={stop} leftSection={<IconPlayerStop size={18} />}>{t('setlistPlayer.stop')}</Button>
          <Button onClick={next} disabled={currentIdx === songs.length - 1} leftSection={<IconPlayerTrackNext size={18} />}>{t('setlistPlayer.next')}</Button>
        </Group>
      )}
      {/* Layout responsivo: vídeo/controles + bloco de acordes */}
      {/* Modal de seleção de tom */}
      <Modal opened={keyModalOpen} onClose={() => setKeyModalOpen(false)} title={t('setlistPlayer.selectKeyModal')} centered>
        <Stack gap={12}>
          {(() => {
            const baseKeyRaw = currentSong?.key || 'C';
            const isBaseMinor = baseKeyRaw.toLowerCase().endsWith('m');
            if (isBaseMinor) {
              return <>
                <Text fw={700} size="sm" style={{ textAlign: 'center' }}>{t('setlistPlayer.minorKeys')}</Text>
                <Group gap={8} wrap="wrap" style={{ justifyContent: 'center' }}>
                  {MINOR_KEYS.map((key) => {
                    const currentKey = getTransposedKey(baseKeyRaw.replace('m', '') || 'C', currentTransposition) + 'm';
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
                <Text fw={700} size="sm" style={{ textAlign: 'center' }}>{t('setlistPlayer.majorKeys')}</Text>
                <Group gap={8} wrap="wrap" style={{ justifyContent: 'center' }}>
                  {MAJOR_KEYS.map((key) => {
                    const currentKey = getTransposedKey(baseKeyRaw || 'C', currentTransposition);
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
      {isMobile ? (
        <Stack gap="md" style={{ width: '100%' }}>
          <div className="player-main-content" style={{ width: '100%' }}>
            <div id="ytplayer" style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }} />
          </div>
          {/* Info TOM/BPM/Transposição */}
          <Group className='self-center' gap="xl" align="center" style={{ marginBottom: 8, marginTop: 8 }}>
            {
              isPro && (
                <Group gap={4} align="center">
                  <Tooltip label={t('setlistPlayer.decreaseKey')}>
                    <Button size="xs" variant="subtle" onClick={handleTransposeDown} disabled={currentTransposition <= -14}>-</Button>
                  </Tooltip>
                  <Tooltip label={t('setlistPlayer.selectKey')}>
                    <Button
                      size="xs"
                      variant="outline"
                      color="blue"
                      onClick={() => setKeyModalOpen(true)}
                      style={{ fontWeight: 700, minWidth: 60 }}
                    >
                      {t('setlistPlayer.key')}: {getTransposedKey(currentSong?.key || '-', currentTransposition)}
                      {currentTransposition !== 0 && (
                        <span style={{ fontWeight: 400, fontSize: 14, marginLeft: 4, color: '#888' }}>({currentTransposition > 0 ? '+' : ''}{currentTransposition})</span>
                      )}
                    </Button>
                  </Tooltip>
                  <Tooltip label={t('setlistPlayer.increaseKey')}>
                    <Button size="xs" variant="subtle" onClick={handleTransposeUp} disabled={currentTransposition >= 14}>+</Button>
                  </Tooltip>
                  <Tooltip label={t('setlistPlayer.resetKey')}>
                    <Button size="xs" variant="light" color="gray" onClick={handleTransposeReset} style={{ marginLeft: 4 }}>
                      <IconRefresh size={16} />
                    </Button>
                  </Tooltip>
                </Group>
              )
            }
            {
              !isPro && (
                <Text size="md" fw={600} >
                  {t('setlistPlayer.key')}: {currentSong?.key}
                </Text>
              )
            }
            <Text size="xs" fw={600}>
              {t('setlistPlayer.bpm')}: <span style={{ fontWeight: 700 }}>{currentSong?.bpm || '-'}</span>
            </Text>
          </Group>
          {/* Bloco de acordes mobile: trilha horizontal animada mostrando anterior, atual e próximos diferentes */}
          <Paper withBorder shadow="md" p="md" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8}}>
            <Text size="sm" color="dimmed">
              {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {currentSong.duration || '-'}
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

          <Group gap="xs" align="center" mt="md">
            <Tooltip label={t('setlistPlayer.youtubeVolume')}>
              <IconBrandYoutube size={28} color="#e63946" />
            </Tooltip>
            <Slider min={0} max={100} value={ytVolume} onChange={setYtVolume} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
          </Group>
        </Stack>
      ) : (
        <Group align="flex-start" gap="xl" style={{ width: '100%', minHeight: 400 }}>
          {/* Bloco principal: vídeo, controles, volumes (80%) */}
          <Stack style={{ flex: 8, minWidth: 0 }}>
            <Group gap="xl" align="center" style={{ marginBottom: 8, marginTop: 8 }}>
              {
                isPro && (
                  <Group gap={4} align="center">
                    <Tooltip label={t('setlistPlayer.decreaseKey')}>
                      <Button size="xs" variant="subtle" onClick={handleTransposeDown} disabled={currentTransposition <= -14}><IconArrowDown size={16} /></Button>
                    </Tooltip>
                    <Tooltip label={t('setlistPlayer.selectKey')}>
                      <Button
                        size="xs"
                        variant="outline"
                        color="blue"
                        onClick={() => setKeyModalOpen(true)}
                        style={{ fontWeight: 700, minWidth: 60 }}
                      >
                        {t('setlistPlayer.key')}: {getTransposedKey(currentSong?.key || '-', currentTransposition)}
                        {currentTransposition !== 0 && (
                          <span style={{ fontWeight: 400, fontSize: 14, marginLeft: 4, color: '#888' }}>({currentTransposition > 0 ? '+' : ''}{currentTransposition})</span>
                        )}
                      </Button>
                    </Tooltip>
                    <Tooltip label={t('setlistPlayer.increaseKey')}>
                      <Button size="xs" variant="subtle" onClick={handleTransposeUp} disabled={currentTransposition >= 14}><IconArrowUp size={16} /></Button>
                    </Tooltip>
                    <Tooltip label={t('setlistPlayer.resetKey')}>
                      <Button size="xs" variant="light" color="gray" onClick={handleTransposeReset} style={{ marginLeft: 4 }}><IconRefresh size={14} /></Button>
                    </Tooltip>
                  </Group>
                )
              }
              {
                !isPro && (
                  <Text size="md" fw={600} color="#228be6">
                    {t('setlistPlayer.key')}: {currentSong?.key}
                  </Text>
                )
              }
              <Text size="md" fw={600} color="#228be6">
                {t('setlistPlayer.bpm')}: <span style={{ fontWeight: 700 }}>{currentSong?.bpm || '-'}</span>
              </Text>
              <Text size="md" fw={600} color="#228be6">
                {t('setlistPlayer.duration')}: <span style={{ fontWeight: 700 }}>{currentSong?.duration || '-'}</span>
              </Text>
            </Group>
            <div className="player-main-content" style={{ width: '100%' }}>
              <div id="ytplayer" style={{ width: '100%', height: 360, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }} />
            </div>
            <Group gap="xs" align="center" mt="md">
              <Tooltip label={t('setlistPlayer.youtubeVolume')}>
                <IconBrandYoutube size={28} color="#e63946" />
              </Tooltip>
              <Slider min={0} max={100} value={ytVolume} onChange={setYtVolume} style={{ flex: 1, marginLeft: 8, marginRight: 8 }} label={v => `${v}%`} />
            </Group>
          </Stack>
          {/* Bloco de acordes (20%) */}
          <Paper withBorder shadow="md" p="md" style={{ flex: 2, minWidth: 180, maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Text fw={700} size="lg" mb="xs">{t('setlistPlayer.chords')}</Text>
            <Text size="sm" color="dimmed" mb="xs">
              {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {currentSong?.duration || t('setlistPlayer.none')}
            </Text>
            {activeChordIdx !== -1 && transposedChords && transposedChords[activeChordIdx] ? (
              <Stack align="center" mb="sm" style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                {/* Tap tempo dots */}
                <Group gap={8} mb={8} style={{ justifyContent: 'center', width: '100%' }}>
                  {(() => {
                    const chord = transposedChords[activeChordIdx];
                    let dots = 4;
                    if (chord.meter) {
                      const match = /^(\d+)/.exec(chord.meter);
                      if (match) {
                        dots = parseInt(match[1], 10) || 4;
                      }
                    } else if (chord.tempo && chord.tempo > 0) {
                      dots = chord.tempo;
                    }
                    return Array.from({ length: dots }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: '#228be6',
                          transition: 'background 0.1s',
                        }}
                      />
                    ));
                  })()}
                </Group>
                <Stack align="center" gap={4} style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Text size="xl" fw={800} style={{ fontSize: 32, letterSpacing: 2, textAlign: 'center' }}>{transposedChords[activeChordIdx].note_fmt || transposedChords[activeChordIdx].note}</Text>
                </Stack>
                <Divider my={8} style={{ width: '100%' }} />
                {/* Próximos acordes diferentes centralizados */}
                <Stack gap={2} mt="md" align="center" style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  {(() => {
                    if (!transposedChords || activeChordIdx === -1) return null;
                    const current = transposedChords[activeChordIdx];
                    const nextDiffs = [];
                    let lastNote = current.note_fmt || current.note;
                    for (let i = activeChordIdx + 1; i < transposedChords.length && nextDiffs.length < 5; i++) {
                      const n = transposedChords[i];
                      if ((n.note_fmt || n.note) !== lastNote) {
                        nextDiffs.push(n.note_fmt || n.note);
                        lastNote = n.note_fmt || n.note;
                      }
                    }
                    return nextDiffs.map((note, idx) => (
                      <Text key={idx} size="sm" color="dimmed" style={{ textAlign: 'center' }}>{note}</Text>
                    ));
                  })()}
                </Stack>
              </Stack>
            ) : (
              <Text size="md" color="dimmed">{t('setlistPlayer.none')}</Text>
            )}
          </Paper>
        </Group>
      )}
      {/* Sequência de músicas */}
      <Stack mt="xl" gap="xs">
        <Text fw={500}>{t('setlistPlayer.sequence')}</Text>
        {songs.map((s, idx) => (
          <Paper key={s.id} shadow={idx === currentIdx ? "md" : "xs"} p="xs" withBorder style={{ background: idx === currentIdx ? '#e7f5ff' : undefined, cursor: 'pointer' }} onClick={() => goTo(idx)}>
            <Text size="sm" fw={idx === currentIdx ? 700 : 400} color={idx === currentIdx ? 'blue' : undefined}>{idx + 1}. {s.title} - {s.bpm} - {s.key}</Text>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
