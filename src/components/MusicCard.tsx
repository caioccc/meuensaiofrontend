/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionIcon, Badge, Button, Card, Group, Image, Loader, Menu, Modal, NumberInput, ScrollArea, Stack, Text, TextInput, Timeline, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClock, IconDotsVertical, IconEdit, IconEye, IconMusic, IconPlayerPlay, IconTrash, IconWaveSine } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useMediaQuery } from '@mantine/hooks';

export interface MusicCardProps {
  id?: number;
  title: string;
  artist?: string;
  duration?: string;
  bpm?: number | null;
  thumbnail_url?: string;
  songKey?: string;
  view_count?: string;
  onDelete?: () => Promise<void>;
  compact?: boolean;
  viewMode?: string; // 'list' ou 'grid'
}

export default function MusicCard({ id, title, duration, bpm, thumbnail_url, songKey, onDelete, compact, custom_bpm, custom_key }: MusicCardProps & { custom_bpm?: number | null, custom_key?: string, viewMode?: string }) {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editBpm, setEditBpm] = useState<number | ''>(custom_bpm ?? bpm ?? '');
  const [editKey, setEditKey] = useState<string>(custom_key ?? songKey ?? '');
  const [history, setHistory] = useState<{ setlists: any[]; song: any } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
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

  // Handler para editar música
  const handleEdit = async () => {
    setLoadingEdit(true);
    try {
      await api.patch(`/songs/${id}/`, { custom_bpm: editBpm, custom_key: editKey });
      notifications.show({
        color: 'green',
        title: 'Atualizada',
        message: 'Música atualizada com sucesso!',
        icon: <IconEdit size={18} />, position: 'top-right', autoClose: 2000
      });
      setEditModalOpen(false);
    } catch {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Erro ao atualizar música',
        icon: <IconEdit size={18} />, position: 'top-right', autoClose: 2000
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  useEffect(() => {
    if (editModalOpen && id) {
      setLoadingHistory(true);
      api.get(`/songs/${id}/history/`).then(res => {
        setHistory(res.data);
      }).finally(() => setLoadingHistory(false));
    }
  }, [editModalOpen, id]);

  const isMobile = useMediaQuery('(max-width: 48em)');

  return (
    <Card
      shadow="sm"
      padding={compact ? 'xs' : 'md'}
      radius="md"
      withBorder
      style={{ position: 'relative', minHeight: compact ? 120 : 240, maxWidth: compact ? 180 : undefined }}
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card.Section>
        <Image src={thumbnail_url} height={compact ? 70 : 160} alt={title} fallbackSrc="/no-image.png" />
      </Card.Section>
      <Group justify="space-between" mt="md" mb="xs">
        <Tooltip label={title} position="top" withArrow>
          <Text fw={700} size={compact ? 'sm' : undefined} lineClamp={2}>{title}</Text>
        </Tooltip>
      </Group>
      {/* Meatball menu no topo direito, visível ao hover */}
      {!compact && hovered && (
        <Menu shadow="md" width={180} withinPortal>
          <Menu.Target>
            <ActionIcon color="gray" size="lg" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
              <IconDotsVertical size={22} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconPlayerPlay size={16} />} onClick={() => router.push({ pathname: '/player', query: { youtubeId: id, id } })}>
              Tocar música
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => setEditModalOpen(true)}>
              Editar música
            </Menu.Item>
            <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => setModalOpen(true)}>
              Remover
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
      {/* Badges responsivos, quebram linha se necessário */}
      <Group gap={4} wrap="wrap" style={{ rowGap: 4, columnGap: 4,
        marginBottom: !isMobile ? 0 : 36
        }}>
        {bpm && (
          <Badge color={compact ? 'gray' : 'blue'} leftSection={<IconWaveSine size={14} />}>{bpm} BPM</Badge>
        )}
        {compact && typeof songKey === 'string' && songKey.trim() && (
          <Badge color="teal" leftSection={<IconMusic size={14} />}>Tom: {songKey}</Badge>
        )}
        {!compact && duration && <Badge color="gray" leftSection={<IconClock size={14} />}>{duration}</Badge>}
        {!compact && typeof songKey === 'string' && songKey.trim() && (
          <Badge color="teal" leftSection={<IconMusic size={14} />}>Tom: {songKey}</Badge>
        )}
      </Group>
      {/* Botão de play ocupa toda a linha inferior */}
      {isMobile && (
        <Button
          color="blue"
          variant="filled"
          size="md"
          leftSection={<IconPlayerPlay size={18} />}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 0, zIndex: 2, height: 38 }}
          onClick={() => router.push({ pathname: '/player', query: { youtubeId: id, id } })}
          aria-label="Tocar música"
        >
          Tocar
        </Button>
      )}
      {/* Modal de remover */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Remover música" centered>
        <Text>Tem certeza que deseja remover esta música?</Text>
        <Group mt="md" justify="flex-end">
          <Button variant="default" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button color="red" loading={loadingDelete} onClick={handleDelete}>Remover</Button>
        </Group>
      </Modal>
      {/* Modal de editar */}
      <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar música" size={isMobile ? 'xl' : 'xl'} centered>
        <Group align="flex-start" gap="xl">
          {/* Formulário de edição */}
          <Stack style={{ minWidth: 320, flex: 1 }}>
            <Text fw={600} mb="sm">{title}</Text>
            <TextInput
              label="Tom customizado"
              value={editKey}
              onChange={e => setEditKey(e.currentTarget.value)}
              placeholder="Ex: C, D#, F#m..."
              mb="md"
            />
            <NumberInput
              label="BPM customizado"
              value={editBpm}
              onChange={value => setEditBpm(value === '' ? '' : Number(value))}
              min={30}
              max={300}
              step={1}
              placeholder="Ex: 120"
            />
            <Group mt="md" justify="flex-end">
              <Button variant="default" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button color="blue" loading={loadingEdit} onClick={handleEdit}>Salvar</Button>
            </Group>
          </Stack>
          {/* Histórico/timeline */}
          <Stack style={{ minWidth: 320, flex: 1, maxWidth: 420 }}>
            <Text fw={600} mb="xs">Histórico de uso</Text>
            {loadingHistory ? (
              <Loader />
            ) : history && history.setlists.length > 0 ? (
              <>
                <Text size="sm" color="dimmed" mb="xs">{history.setlists.length} setlist{history.setlists.length > 1 ? 's' : ''} encontrad{history.setlists.length > 1 ? 'os' : 'o'}</Text>
                <ScrollArea h={260}>
                  <Timeline active={0} bulletSize={24} lineWidth={2}>
                    {history.setlists.map((setlist, idx) => (
                      <Timeline.Item
                        key={setlist.id}
                        title={<Text fw={500}>{setlist.name}</Text>}
                        bullet={<IconEye size={16} />}
                        lineVariant={idx === 0 ? 'dashed' : 'solid'}
                      >
                        <Text size="sm" color="dimmed">{setlist.date ? format(new Date(setlist.date), 'dd/MM/yyyy') : 'Sem data'}</Text>
                        {
                          setlist.songs && setlist.songs.length > 0 ? (
                            <Text size="xs" color="dimmed">
                              {setlist.songs.map((s) => s.title).join(', ')}
                            </Text>
                          ) : (
                            <Text size="xs" color="dimmed">Nenhuma música registrada</Text>
                          )
                        }

                      </Timeline.Item>
                    ))}
                  </Timeline>
                </ScrollArea>
              </>
            ) : (
              <Text size="sm" color="dimmed">Nenhum histórico encontrado.</Text>
            )}
          </Stack>
        </Group>
      </Modal>
    </Card>
  );
}
