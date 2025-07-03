import { Card, Image, Text, Group, Badge, ActionIcon, Tooltip, Modal, Button } from '@mantine/core';
import { IconMusic, IconClock, IconWaveSine, IconEye, IconTrash, IconPlayerPlay } from '@tabler/icons-react';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';

export interface MusicCardProps {
  id?: number;
  title: string;
  artist?: string;
  duration?: string;
  bpm?: number | null;
  chords_url?: string;
  thumbnail_url?: string;
  songKey?: string;
  view_count?: string;
  onPlay?: () => void;
  onDelete?: () => Promise<void>;
}

export default function MusicCard({ id, title, artist, duration, bpm, chords_url, thumbnail_url, songKey, view_count, onPlay, onDelete }: MusicCardProps) {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const router = useRouter();

  // Handler para remover música com notificação
  const handleDelete = async () => {
    setLoadingDelete(true);
    try {
      await onDelete?.();
      notifications.show({
        color: 'green',
        title: 'Removida',
        message: 'Música removida com sucesso!',
        icon: <IconTrash size={18} />, position: 'top-right', autoClose: 2000
      });
    } catch {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Erro ao remover música',
        icon: <IconTrash size={18} />, position: 'top-right', autoClose: 2000
      });
    } finally {
      setLoadingDelete(false);
      setModalOpen(false);
    }
  };

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{ position: 'relative', minHeight: 240 }}
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card.Section>
        <Image src={thumbnail_url} height={160} alt={title} fallbackSrc="/no-image.png"/>
      </Card.Section>
      <Group position="apart" mt="md" mb="xs">
        <Text fw={700}>{title}</Text>
      </Group>
      {artist && <Text size="sm" color="dimmed">{artist}</Text>}
      {/* Badges responsivos, quebram linha se necessário */}
      <Group spacing={4} wrap="wrap" style={{ rowGap: 4, columnGap: 4, marginBottom: 36 }}>
        {bpm && <Badge color="blue" leftSection={<IconWaveSine size={14} />}>{bpm} BPM</Badge>}
        {duration && <Badge color="gray" leftSection={<IconClock size={14} />}>{duration}</Badge>}
        {typeof songKey === 'string' && songKey.trim() && (
          <Badge color="teal" leftSection={<IconMusic size={14} />}>Tom: {songKey}</Badge>
        )}
        {view_count && <Badge color="gray" leftSection={<IconEye size={14} />}>{view_count}</Badge>}
      </Group>
      {/* Botão de remover só aparece ao passar o mouse, agora no topo direito */}
      {hovered && (
        <Tooltip label="Remover música" position="top-end" withArrow>
          <ActionIcon
            color="red"
            variant="filled"
            size="lg"
            className="musiccard-delete-btn"
            style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
            onClick={() => setModalOpen(true)}
            aria-label="Remover música"
            loading={loadingDelete}
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Tooltip>
      )}
      {/* Botão de play ocupa toda a linha inferior */}
      <Button
        color="blue"
        variant="filled"
        size="md"
        leftSection={<IconPlayerPlay size={18} />}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 0, zIndex: 2, height: 38 }}
        onClick={() => router.push({
          pathname: '/player',
          query: {
            youtubeId: id,
            id
          }
        })}
        aria-label="Tocar música"
      >
        Tocar
      </Button>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Remover música" centered>
        <Text>Tem certeza que deseja remover esta música?</Text>
        <Group mt="md" position="right">
          <Button variant="default" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button color="red" loading={loadingDelete} onClick={handleDelete}>Remover</Button>
        </Group>
      </Modal>
    </Card>
  );
}
