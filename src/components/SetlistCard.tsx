import { Carousel } from '@mantine/carousel';
import { Badge, Box, Button, Card, Center, Group, Modal, Text } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconEye, IconMusic, IconTrash } from '@tabler/icons-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import api from '../../lib/axios';


interface Song {
  id: number;
  title: string;
  artist: string;
  thumbnail_url?: string;
}

interface Setlist {
  id: number;
  name: string;
  songs: Song[];
  processing_status?: string;
}

export default function SetlistCard({ setlist, onRemoved }: { setlist: Setlist, onRemoved?: () => void }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(setlist.processing_status || 'PROCESSADO');
  const [localSetlist, setLocalSetlist] = useState(setlist);
  const hasImages = localSetlist.songs.some(song => song.thumbnail_url);

  useEffect(() => {
    setStatus(setlist.processing_status || 'PROCESSADO');
    setLocalSetlist(setlist);
  }, [setlist]);

  useEffect(() => {
    if (status === 'PENDENTE' || status === 'EM_ANDAMENTO') {
      const interval = setInterval(async () => {
        try {
          const res = await api.get(`/setlists/${localSetlist.id}/`);
          setStatus(res.data.processing_status);
          setLocalSetlist(res.data);
        } catch (e) { }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [status, localSetlist.id]);

  const handleRemove = async () => {
    setLoading(true);
    try {
      await api.delete(`/setlists/${setlist.id}/`);
      showNotification({ color: 'green', title: 'Setlist removido', message: 'Setlist removido com sucesso!' });
      if (onRemoved) onRemoved();
      setModalOpen(false);
    } catch (e: any) {
      showNotification({ color: 'red', title: 'Erro ao remover', message: e?.response?.data?.detail || e.message || 'Erro ao remover setlist' });
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const getRandomDelay = () => Math.floor(Math.random() * 16) * 100 + 1000;
  const autoplay = useRef(Autoplay({ delay: getRandomDelay(), stopOnInteraction: false, onTransitionEnd: (emblaApi) => {
    autoplay.current.options.delay = getRandomDelay();
  }}));

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group noWrap align="center">
        <Box style={{ minWidth: 120, maxWidth: 140 }}>
          <Carousel slideSize="100%" align="start" slidesToScroll={1}
            slideGap="xs"
            controlsOffset="xs"
            withControls={false}
            withIndicators
            plugins={[autoplay.current]}
            onMouseEnter={autoplay.current.stop}
            onMouseLeave={() => autoplay.current.play()}
          >
            {hasImages
              ? localSetlist.songs.slice(0, 5).map((song) => (
                <Carousel.Slide key={song.id}>
                  <Image src={song.thumbnail_url || ''} width={120} height={90} alt={song.title} style={{ borderRadius: 8, objectFit: 'cover' }} />
                </Carousel.Slide>
              ))
              : (
                <Carousel.Slide key="default">
                  <Center style={{ width: 120, height: 90, background: '#f3f3f3', borderRadius: 8 }}>
                    <IconMusic size={48} color="#bbb" />
                  </Center>
                </Carousel.Slide>
              )}
          </Carousel>
        </Box>
        <Box style={{ flex: 1, marginLeft: 16, position: 'relative', minHeight: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <Text weight={600} mb={4}>{localSetlist.name}</Text>
            <Badge color="blue" variant="light" mb={8}>{localSetlist.songs.length} músicas</Badge>
            <Box mt={4} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {localSetlist.songs.slice(0, 3).map((s, idx) => (
                <Text key={s.id} size="sm" color="dimmed" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                  {`${idx + 1}. ${s.title.length > 35 ? s.title.slice(0, 35) + '…' : s.title}`}
                </Text>
              ))}
              {localSetlist.songs.length > 3 && (
                <Text size="sm" color="dimmed">...</Text>
              )}
            </Box>
          </div>
          <Group position="right" spacing={8} style={{ position: 'absolute', right: 0, bottom: 0 }}>
            <Button
              variant="light"
              color="blue"
              size="xs"
              onClick={() => router.push(`/setlists/${localSetlist.id}`)}
            >
              <IconEye size={16} />
              Acessar
            </Button>
            <Button
              variant="light"
              color="red"
              size="xs"
              onClick={() => setModalOpen(true)}
              loading={loading}
              disabled={loading}
            >
              <IconTrash size={16} />
            </Button>
          </Group>
        </Box>
      </Group>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Remover setlist" centered>
        <Text>Tem certeza que deseja remover este setlist?</Text>
        <Group mt="md" position="right">
          <Button variant="default" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button color="red" loading={loading} onClick={handleRemove}>Remover</Button>
        </Group>
      </Modal>
    </Card>
  );
}
