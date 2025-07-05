import { SimpleGrid } from '@mantine/core';
import { ItemCard } from './ItemCard';
import React from 'react';

interface GalleryViewProps<T> {
  items: T[];
  renderContent: (item: T) => React.ReactNode;
  renderActions: (item: T) => React.ReactNode;
  getImageUrl: (item: T) => string | undefined;
  getItemId: (item: T) => string | number;
  fallbackIcon?: React.ReactNode;
}

export function GalleryView<T>({ items, renderContent, renderActions, getImageUrl, getItemId, fallbackIcon }: GalleryViewProps<T>) {
  return (
    <SimpleGrid
      cols={{ base: 2, sm: 2, md: 3, lg: 4 }}
      spacing="lg"
    >
      {items.map(item => (
        <ItemCard
          key={getItemId(item)}
          item={item}
          imageUrl={getImageUrl(item)}
          renderContent={renderContent}
          renderActions={renderActions}
          fallbackIcon={fallbackIcon}
          layout="vertical"
        />
      ))}
    </SimpleGrid>
  );
}