import { SimpleGrid } from '@mantine/core';
import { ItemCard } from './ItemCard';
import React from 'react';

interface ListViewProps<T> {
  items: T[];
  renderContent: (item: T) => React.ReactNode;
  renderActions: (item: T) => React.ReactNode;
  renderStatus?: (item: T) => React.ReactNode;
  getImageUrl: (item: T) => string | undefined;
  getItemId: (item: T) => string | number;
  fallbackIcon?: React.ReactNode;
}

export function ListView<T>({ items, renderContent, renderActions, renderStatus, getImageUrl, getItemId, fallbackIcon }: ListViewProps<T>) {
  return (
    <SimpleGrid cols={1} spacing="lg">
      {items.map(item => (
        <ItemCard
          key={getItemId(item)}
          item={item}
          imageUrl={getImageUrl(item)}
          renderContent={renderContent}
          renderActions={renderActions}
          renderStatus={renderStatus}
          fallbackIcon={fallbackIcon}
          layout="horizontal"
        />
      ))}
    </SimpleGrid>
  );
}