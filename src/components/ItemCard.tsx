import { Card, Image, Flex, Box, Menu, ActionIcon } from '@mantine/core';
import { IconDotsVertical, IconPhoto } from '@tabler/icons-react';
import React, { useState } from 'react';

interface ItemCardProps<T> {
  item: T;
  imageUrl?: string;
  renderContent: (item: T) => React.ReactNode;
  renderActions: (item: T) => React.ReactNode;
  renderStatus?: (item: T) => React.ReactNode;
  fallbackIcon?: React.ReactNode;
  layout?: 'horizontal' | 'vertical';
}

export function ItemCard<T>({
  item,
  imageUrl,
  renderContent,
  renderActions,
  renderStatus,
  fallbackIcon,
  layout = 'horizontal',
}: ItemCardProps<T>) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const imagePlaceholder = (
    <Flex
      justify="center"
      align="center"
      w={layout === 'horizontal' ? 100 : '100%'}
      h={layout === 'horizontal' ? 100 : 160}
      bg="gray.1"
      style={{ borderRadius: 'var(--mantine-radius-md)' }}
    >
      {fallbackIcon || <IconPhoto size={48} color="var(--mantine-color-gray-5)" />}
    </Flex>
  );

  const imageContent = imageUrl && !imageError ? (
    <Image
      src={imageUrl}
      height={layout === 'horizontal' ? 100 : 160}
      width={layout === 'horizontal' ? 100 : 'auto'}
      radius="md"
      fit="cover"
      onError={handleImageError}
    />
  ) : (
    imagePlaceholder
  );

  const menu = (
    <Menu withinPortal position="bottom-end" shadow="sm">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDotsVertical size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>{renderActions(item)}</Menu.Dropdown>
    </Menu>
  );

  if (layout === 'vertical') {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ position: 'relative' }}>
        <Box style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 1 }}>
          {menu}
        </Box>
        <Flex direction="column" gap="xs">
          <Card.Section>
            {imageContent}
          </Card.Section>
          <Box mt="sm">{renderContent(item)}</Box>
        </Flex>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Flex gap="lg" align="flex-start">
        <Box w={100} h={100} style={{ flexShrink: 0 }}>
          {imageContent}
        </Box>
        <Flex direction="column" justify="space-between" style={{ flex: 1, minHeight: 100 }}>
          <Flex justify="space-between" align="flex-start" gap="md">
            <Box style={{ flex: 1 }}>{renderContent(item)}</Box>
            {menu}
          </Flex>
          {renderStatus && (
            <Flex justify="flex-end" mt="sm">
              {renderStatus(item)}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}