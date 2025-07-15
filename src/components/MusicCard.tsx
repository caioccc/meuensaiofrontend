/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionIcon, Badge, Button, Card, Group, Image, Loader, Menu, Modal, NumberInput, ScrollArea, Stack, Text, TextInput, Timeline, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBrandWhatsapp, IconClock, IconDotsVertical, IconEdit, IconEye, IconMusic, IconPlayerPlay, IconTrash, IconWaveSine } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
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
}

export default function MusicCard({ id, title, duration, bpm, thumbnail_url, songKey, onDelete, compact, custom_bpm, custom_key }: MusicCardProps & { custom_bpm?: number | null, custom_key?: string }) {
  // Função para registrar ação no backend
  const recordAction = async (actionType: string, objectId?: string) => {
    try {
      await api.post('/actions/record/', {
        action: actionType,
        related_object_id: objectId,
      });
    } catch (error) {
      console.log('Erro ao registrar ação:', error);
    }
  };
  const { t } = useTranslation();
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
        title: t('musicCard.notificationDeleteTitle'),
        message: t('musicCard.notificationDeleteSuccess'),
        icon: <IconTrash size={18} />, position: 'top-right', autoClose: 2000
      });
    } catch {
      notifications.show({
        color: 'red',
        title: t('musicCard.notificationErrorTitle'),
        message: t('musicCard.notificationDeleteError'),
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
      // Registrar ação de edição de tom
      if (editKey && editKey !== songKey) {
        recordAction('edit_key', String(id));
      }
      // Registrar ação de edição de BPM
      if (editBpm && editBpm !== bpm) {
        recordAction('edit_bpm', String(id));
      }
      notifications.show({
        color: 'green',
        title: t('musicCard.notificationEditTitle'),
        message: t('musicCard.notificationEditSuccess'),
        icon: <IconEdit size={18} />, position: 'top-right', autoClose: 2000
      });
      setEditModalOpen(false);
    } catch {
      notifications.show({
        color: 'red',
        title: t('musicCard.notificationErrorTitle'),
        message: t('musicCard.notificationEditError'),
        icon: <IconEdit size={18} />, position: 'top-right', autoClose: 2000
      });
    } finally {
      setLoadingEdit(false);
    }
  };

  // Função para compartilhar música no WhatsApp
  async function handleShareWhatsapp() {
    const musica = t('musicCard.whatsappSong', {
      title,
      songKey: typeof songKey === 'string' && songKey.trim() ? songKey : undefined,
      bpm: bpm || undefined
    });
    const duracao = duration ? t('musicCard.whatsappDuration', { duration }) + '\n' : '';
    const url = `${window.location.origin}/player?id=${id}`;
    const texto =
      t('musicCard.whatsappHeader') + '\n\n' +
      musica + '\n' +
      duracao +
      '\n' +
      t('musicCard.whatsappListen', { url }) + '\n' +
      '\n' +
      t('musicCard.whatsappFooter', { origin: window.location.origin });
    // Registrar ação de compartilhamento
    await recordAction('share', String(id));
    window.open(`https://api.whatsapp.com/send/?&text=${encodeURIComponent(texto)}`, '_blank');
  }

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
              {t('musicCard.menuPlay')}
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => setEditModalOpen(true)}>
              {t('musicCard.menuEdit')}
            </Menu.Item>
            <Menu.Item leftSection={<IconBrandWhatsapp size={16} color="#25D366" />} onClick={handleShareWhatsapp}>
              {t('musicCard.menuWhatsapp')}
            </Menu.Item>
            <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => setModalOpen(true)}>
              {t('musicCard.menuRemove')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
      {/* Badges responsivos, quebram linha se necessário */}
      <Group gap={4} wrap="wrap" style={{ rowGap: 4, columnGap: 4, marginBottom: compact ? 0 : 36 }}>
        {bpm && (
          <Badge color={compact ? 'gray' : 'blue'} leftSection={<IconWaveSine size={14} />}>{t('musicCard.badgeBpm', { bpm })}</Badge>
        )}
        {compact && typeof songKey === 'string' && songKey.trim() && (
          <Badge color="teal" leftSection={<IconMusic size={14} />}>{t('musicCard.badgeKey', { key: songKey })}</Badge>
        )}
        {!compact && duration && <Badge color="gray" leftSection={<IconClock size={14} />}>{t('musicCard.badgeDuration', { duration })}</Badge>}
        {!compact && typeof songKey === 'string' && songKey.trim() && (
          <Badge color="teal" leftSection={<IconMusic size={14} />}>{t('musicCard.badgeKey', { key: songKey })}</Badge>
        )}
      </Group>
      {/* Botão de play ocupa toda a linha inferior */}
      {!compact && (
      <Button
        color="blue"
        variant="filled"
        size="md"
        leftSection={<IconPlayerPlay size={18} />}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 0, zIndex: 2, height: 38 }}
        onClick={() => router.push({ pathname: '/player', query: { youtubeId: id, id } })}
        aria-label={t('musicCard.menuPlay')}
      >
        {t('musicCard.menuPlay')}
      </Button>
      )}
      {/* Modal de remover */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={t('musicCard.modalRemoveTitle')} centered>
        <Text>{t('musicCard.modalRemoveText')}</Text>
        <Group mt="md" justify="flex-end">
          <Button variant="default" onClick={() => setModalOpen(false)}>{t('musicCard.cancel')}</Button>
          <Button color="red" loading={loadingDelete} onClick={handleDelete}>{t('musicCard.menuRemove')}</Button>
        </Group>
      </Modal>
      {/* Modal de editar */}
      <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title={t('musicCard.modalEditTitle')} size={isMobile ? 'xl' : 'xl'} centered>
        <Group align="flex-start" gap="xl">
          {/* Formulário de edição */}
          <Stack style={{ minWidth: 320, flex: 1 }}>
            <Text fw={600} mb="sm">{title}</Text>
            <TextInput
              label={t('musicCard.inputKeyLabel')}
              value={editKey}
              onChange={e => setEditKey(e.currentTarget.value)}
              placeholder={t('musicCard.inputKeyPlaceholder')}
              mb="md"
            />
            <NumberInput
              label={t('musicCard.inputBpmLabel')}
              value={editBpm}
              onChange={value => setEditBpm(value === '' ? '' : Number(value))}
              min={30}
              max={300}
              step={1}
              placeholder={t('musicCard.inputBpmPlaceholder')}
            />
            <Group mt="md" justify="flex-end">
              <Button variant="default" onClick={() => setEditModalOpen(false)}>{t('musicCard.cancel')}</Button>
              <Button color="blue" loading={loadingEdit} onClick={handleEdit}>{t('musicCard.save')}</Button>
            </Group>
          </Stack>
          {/* Histórico/timeline */}
          <Stack style={{ minWidth: 320, flex: 1, maxWidth: 420 }}>
            <Text fw={600} mb="xs">{t('musicCard.historyTitle')}</Text>
            {loadingHistory ? (
              <Loader />
            ) : history && history.setlists.length > 0 ? (
              <>
                <Text size="sm" color="dimmed" mb="xs">{t('musicCard.historyCount', { count: history.setlists.length })}</Text>
                <ScrollArea h={260}>
                  <Timeline active={0} bulletSize={24} lineWidth={2}>
                    {history.setlists.map((setlist, idx) => (
                      <Timeline.Item
                        key={setlist.id}
                        title={<Text fw={500}>{setlist.name}</Text>}
                        bullet={<IconEye size={16} />}
                        lineVariant={idx === 0 ? 'dashed' : 'solid'}
                      >
                        <Text size="sm" color="dimmed">{setlist.date ? format(new Date(setlist.date), 'dd/MM/yyyy') : t('musicCard.noDate')}</Text>
                        {
                          setlist.songs && setlist.songs.length > 0 ? (
                            <Text size="xs" color="dimmed">
                              {setlist.songs.map((s) => s.title).join(', ')}
                            </Text>
                          ) : (
                            <Text size="xs" color="dimmed">{t('musicCard.noSongs')}</Text>
                          )
                        }

                      </Timeline.Item>
                    ))}
                  </Timeline>
                </ScrollArea>
              </>
            ) : (
              <Text size="sm" color="dimmed">{t('musicCard.noHistory')}</Text>
            )}
          </Stack>
        </Group>
      </Modal>
    </Card>
  );
}
