import { Button, Card, Group, Image, Stack, Text, Badge, Menu, ActionIcon } from '@mantine/core';
import { IconDownload, IconPlayerPlay, IconDots } from '@tabler/icons-react';

interface SongCardProps {
  id: number;
  title: string;
  artist?: string;
  thumbnail_url?: string;
  isDownloaded: boolean;
  audio_url?: string;
  onDownload: () => void;
  onPlay: () => void;
  loading?: boolean;
}

export default function SongTestCard({
  title,
  artist,
  thumbnail_url,
  isDownloaded,
  audio_url,
  onDownload,
  onPlay,
  loading = false,
}: SongCardProps) {
  const handleDirectDownload = () => {
    if (audio_url) {
      const link = document.createElement('a');
      link.href = audio_url;
      link.target = '_blank';
      link.download = `${title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group align="flex-start" gap={16}>
        {thumbnail_url && (
          <Image src={thumbnail_url} width={60} height={60} radius="md" alt={title} />
        )}
        <Stack gap={2} style={{ flex: 1 }}>
          <Text fw={600}>{title}</Text>
          {artist && <Text size="sm" c="dimmed">{artist}</Text>}
          <Badge color={isDownloaded ? 'green' : 'gray'} variant={isDownloaded ? 'filled' : 'light'} mt={4} w={90}>
            {isDownloaded ? 'Baixada' : 'Não baixada'}
          </Badge>
        </Stack>
        <Menu withinPortal position="bottom-end" shadow="md">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray"><IconDots size={20} /></ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {isDownloaded && audio_url && (
              <Menu.Item leftSection={<IconDownload size={16} />} onClick={handleDirectDownload}>
                Download do áudio
              </Menu.Item>
            )}
            {/* Outros itens do menu podem ser adicionados aqui */}
          </Menu.Dropdown>
        </Menu>
      </Group>
      <Group mt="md" justify="flex-end">
        {isDownloaded ? (
          <Button leftSection={<IconPlayerPlay size={18} />} onClick={onPlay} loading={loading}>
            Tocar música
          </Button>
        ) : (
          <Button leftSection={<IconDownload size={18} />} onClick={onDownload} loading={loading}>
            Baixar música
          </Button>
        )}
      </Group>
    </Card>
  );
}
