import { Badge, Button, Group, Image, Modal, Stack, Text } from '@mantine/core';
import { IconClock, IconMusic } from '@tabler/icons-react';
import { MusicCardProps } from './MusicCard';

interface MusicPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  music: (MusicCardProps & {
    description?: string;
    channel_name?: string;
    channel_link?: string;
    channel_thumbnail?: string;
    link?: string;
  }) | null;
}

export default function MusicPreviewModal({ opened, onClose, music }: MusicPreviewModalProps) {
  if (!music) return null;
  return (
    <Modal opened={opened} onClose={onClose} title={music.title} centered size="lg">
      <Stack>
        <Group align="flex-start" gap="md">
          <Image src={music.thumbnail_url} width={160} radius="md" alt={music.title} fallbackSrc="/no-image.png" />
          <Stack gap={4} style={{ flex: 1 }}>
            <Group>
              {music.duration && <Badge color="gray" leftSection={<IconClock size={14} />}>{music.duration}</Badge>}
              {music.bpm && <Badge color="blue">{music.bpm} BPM</Badge>}
            </Group>
            {music.channel_name && (
              <Group>
                <Image src={music.channel_thumbnail} width={32} height={32} radius="xl" alt={music.channel_name} fallbackSrc="/no-image.png" />
                <Text component="a" href={music.channel_link} target="_blank" fw={500}>{music.channel_name}</Text>
              </Group>
            )}
            {music.link && (
              <Button component="a" href={music.link} target="_blank" leftSection={<IconMusic size={16} />} variant="light" size="xs">
                Ver no YouTube
              </Button>
            )}
          </Stack>
        </Group>
        {music.description && <Text size="sm" color="dimmed">{music.description}</Text>}
      </Stack>
    </Modal>
  );
}
