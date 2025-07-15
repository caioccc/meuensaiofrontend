import { useTranslation } from 'next-i18next';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Carousel } from '@mantine/carousel';
import { ActionIcon, Badge, Box, Button, Card, Center, Group, Menu, Modal, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { IconBrandWhatsapp, IconDotsVertical, IconEye, IconMusic, IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { format } from 'date-fns';
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
  date?: string; // Formato 'YYYY-MM-DD'
}

export default function SetlistCard({ setlist, onRemoved }: { setlist: Setlist, onRemoved?: () => void }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(setlist.processing_status || 'PROCESSADO');
  const [localSetlist, setLocalSetlist] = useState(setlist);
  const [menuOpened, setMenuOpened] = useState(false);
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
        } catch (e) {
          console.log('Erro ao atualizar status do setlist:', e);
          clearInterval(interval);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [status, localSetlist.id]);

  const handleRemove = async () => {
    setLoading(true);
    try {
      await api.delete(`/setlists/${setlist.id}/`);
      showNotification({
        color: 'green',
        title: t('setlistCard.notificationDeleteTitle'),
        message: t('setlistCard.notificationDeleteSuccess'),
        id: 'setlist-removed',
      });
      if (onRemoved) onRemoved();
      setModalOpen(false);
    } catch (e: any) {
      showNotification({
        color: 'red',
        title: t('setlistCard.notificationDeleteErrorTitle'),
        message: e?.response?.data?.detail || e.message || t('setlistCard.notificationDeleteError'),
        id: 'setlist-remove-error',
      });
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const getRandomDelay = () => Math.floor(Math.random() * 16) * 100 + 1000;
  const autoplay = useRef(Autoplay({
    delay: getRandomDelay(), stopOnInteraction: false
  }));

  // Função para compartilhar setlist no WhatsApp e registrar ação
  async function handleShareWhatsapp() {
    const title = localSetlist.name;
    const qtd = localSetlist.songs.length;
    const musicas = localSetlist.songs.map((s, i) => t('setlistCard.whatsappSong', { index: i + 1, title: s.title, artist: s.artist })).join('\n');
    const url = `${window.location.origin}/player/setlist/${localSetlist.id}`;
    const texto =
      t('setlistCard.whatsappHeader') + '\n' +
      '\n' +
      t('setlistCard.whatsappTitle', { title }) + '\n' +
      t('setlistCard.whatsappTotalSongs', { qtd }) + '\n' +
      '-----------------------------\n' +
      musicas + '\n' +
      '-----------------------------\n' +
      '\n' +
      t('setlistCard.whatsappListen', { url }) + '\n' +
      '\n' +
      t('setlistCard.whatsappFooter', { origin: window.location.origin });
    // Registrar ação de compartilhamento
    try {
      await api.post('/actions/record/', {
        action: 'share',
        related_object_id: String(localSetlist.id),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error recording share action:', error);
    }
    window.open(`https://api.whatsapp.com/send/?&text=${encodeURIComponent(texto)}`, '_blank');
  }

  return (
    <Card shadow="sm" padding="xs" radius="md" withBorder style={isMobile ? { position: 'relative', minHeight: 220 } : {}}>
      {isMobile ? (
        <>
          <Card.Section>
            {hasImages ? (
              <Image src={localSetlist.songs[0]?.thumbnail_url || ''} width={400} height={120} alt={localSetlist.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
            ) : (
              <Center style={{ width: '100%', height: 120, background: '#f3f3f3', borderRadius: 8 }}>
                <IconMusic size={48} color="#bbb" />
              </Center>
            )}
          </Card.Section>
          {/* Meatball menu no topo direito */}
          <Menu
            opened={menuOpened}
            onClose={() => setMenuOpened(false)}
            withinPortal
          >
            <Menu.Target>
              <ActionIcon
                color="gray"
                size="lg"
                style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                aria-label="Ações do setlist"
                onClick={e => {
                  e.stopPropagation();
                  setMenuOpened(true);
                }}
              >
                <IconDotsVertical size={22} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconPlayerPlay size={16} />} onClick={() => router.push(`/player/setlist/${localSetlist.id}`)}>
                {t('setlistCard.menuPlay')}
              </Menu.Item>
              <Menu.Item leftSection={<IconEye size={16} />} onClick={() => router.push(`/setlists/${localSetlist.id}`)}>
                {t('setlistCard.menuAccess')}
              </Menu.Item>
              <Menu.Item leftSection={<IconBrandWhatsapp size={16} color="#25D366" />} onClick={handleShareWhatsapp}>
                {t('setlistCard.menuWhatsapp')}
              </Menu.Item>
              {/* <PDFDownloadLink
                document={<SetlistPDF setlist={localSetlist} />}
                fileName={`${localSetlist.name}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <Menu.Item leftSection={<IconFileDownload size={16} />} disabled={pdfLoading}>
                    {pdfLoading ? 'Gerando PDF...' : 'Exportar PDF'}
                  </Menu.Item>
                )}
              </PDFDownloadLink> */}
              <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => setModalOpen(true)}>
                {t('setlistCard.menuRemove')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Box style={{ padding: 12, paddingTop: 16, paddingBottom: 54 }}>
            <Text mb={4}>{localSetlist.name}</Text>
            {localSetlist.date && (
              <Text size="xs" color="dimmed" mb={4}>
                {(() => {
                  const [ano, mes, dia] = localSetlist.date.split('-');
                  const dataLocal = new Date(Number(ano), Number(mes) - 1, Number(dia));
                  return format(dataLocal, 'dd/MM/yyyy');
                })()}
              </Text>
            )}
            <Badge color="blue" variant="light" mb={8}>{localSetlist.songs.length} {t('setlistCard.songs')}</Badge>
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
          </Box>
          <Button
            color="blue"
            size="xs"
            leftSection={<IconPlayerPlay size={16} style={{ marginRight: 4 }} />}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 0, zIndex: 2, height: 38 }}
            onClick={() => router.push(`/player/setlist/${localSetlist.id}`)}
          >
            {t('setlistCard.buttonPlay')}
          </Button>
        </>
      ) : (
        <Group align="center">
          <Box style={{ minWidth: 140, maxWidth: 200 }}>
            {hasImages && localSetlist.songs.length > 0 ? (
              <Carousel
                slideSize="100%"
                slideGap="xs"
                controlsOffset="xs"
                withControls={false}
                withIndicators
                plugins={localSetlist.songs.length > 1 ? [autoplay.current] : []}
                onMouseEnter={localSetlist.songs.length > 1 ? autoplay.current.stop : undefined}
                onMouseLeave={localSetlist.songs.length > 1 ? () => autoplay.current && autoplay.current.play && autoplay.current.play() : undefined}
              >
                {localSetlist.songs.slice(0, 5).map((song) => (
                  <Carousel.Slide key={song.id}>
                    <Image src={song.thumbnail_url || ''} width={200} height={200} alt={song.title} style={{ borderRadius: 10, objectFit: 'cover', width: 180, height: 150 }} />
                  </Carousel.Slide>
                ))}
              </Carousel>
            ) : (
              <Carousel slideSize="100%"
                slideGap="xs"
                controlsOffset="xs"
                withControls={false}
                withIndicators={false}
              >
                <Carousel.Slide key="default">
                  <Center style={{ width: 200, height: 200, background: '#f3f3f3', borderRadius: 10 }}>
                    <IconMusic size={64} color="#bbb" />
                  </Center>
                </Carousel.Slide>
              </Carousel>
            )}
          </Box>
          <Box style={{ flex: 1, position: 'relative', minHeight: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Meatball menu no topo direito */}
            <Menu
              opened={menuOpened}
              onClose={() => setMenuOpened(false)}
              withinPortal
            >
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                  aria-label="Ações do setlist"
                  onClick={e => {
                    e.stopPropagation();
                    setMenuOpened(true);
                  }}
                >
                  <IconDotsVertical size={22} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconEye size={16} />} onClick={() => router.push(`/setlists/${localSetlist.id}`)}>
                  {t('setlistCard.menuAccess')}
                </Menu.Item>
                <Menu.Item leftSection={<IconPlayerPlay size={16} />} onClick={() => router.push(`/player/setlist/${localSetlist.id}`)}>
                  {t('setlistCard.menuPlay')}
                </Menu.Item>
                <Menu.Item leftSection={<IconBrandWhatsapp size={16} color="#25D366" />} onClick={handleShareWhatsapp}>
                  {t('setlistCard.menuWhatsapp')}
                </Menu.Item>
                {/* <PDFDownloadLink
                  document={<SetlistPDF setlist={localSetlist} />}
                  fileName={`${localSetlist.name}.pdf`}
                >
                  {({ loading: pdfLoading }) => (
                    <Menu.Item leftSection={<IconFileDownload size={16} />} disabled={pdfLoading}>
                      {pdfLoading ? 'Gerando PDF...' : 'Exportar PDF'}
                    </Menu.Item>
                  )}
                </PDFDownloadLink> */}
                <Menu.Item leftSection={<IconTrash size={16} />} color="red" onClick={() => setModalOpen(true)}>
                  {t('setlistCard.menuRemove')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            {/* Botão Tocar destacado */}
            <Button
              variant="light"
              color="blue"
              leftSection={<IconPlayerPlay size={16} style={{ marginRight: 4 }} />}
              style={{ position: 'absolute', right: 16, bottom: 8, zIndex: 1 }}
              onClick={() => router.push(`/player/setlist/${localSetlist.id}`)}
            >
              {t('setlistCard.buttonPlay')}
            </Button>
            <div>
              <Text mb={4}>{localSetlist.name}</Text>
              {localSetlist.date && (
                <Text size="xs" color="dimmed" mb={4}>
                  {(() => {
                    const [ano, mes, dia] = localSetlist.date.split('-');
                    const dataLocal = new Date(Number(ano), Number(mes) - 1, Number(dia));
                    return format(dataLocal, 'dd/MM/yyyy');
                  })()}
                </Text>
              )}
              <Badge color="blue" variant="light" mb={8}>{localSetlist.songs.length} {t('setlistCard.songs')}</Badge>
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
          </Box>
        </Group>
      )}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={t('setlistCard.modalRemoveTitle')} centered>
        <Text>{t('setlistCard.modalRemoveText')}</Text>
        <Group mt="md" justify="flex-end">
          <Button variant="default" onClick={() => setModalOpen(false)}>{t('setlistCard.cancel')}</Button>
          <Button color="red" loading={loading} onClick={handleRemove}>{t('setlistCard.menuRemove')}</Button>
        </Group>
      </Modal>
    </Card>
  );
}
