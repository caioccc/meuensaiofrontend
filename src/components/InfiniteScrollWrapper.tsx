// InfiniteScroll wrapper para Mantine/Next.js
import { ReactNode } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

interface Props {
  children: ReactNode;
  dataLength: number;
  next: () => void;
  hasMore: boolean;
  loader?: ReactNode;
  scrollableTarget?: string;
  style?: React.CSSProperties;
}

export default function InfiniteScrollWrapper(props: Props) {
  return (
    <InfiniteScroll
      dataLength={props.dataLength}
      next={props.next}
      hasMore={props.hasMore}
      loader={props.loader}
      scrollableTarget={props.scrollableTarget}
      style={props.style}
    >
      {props.children}
    </InfiniteScroll>
  );
}
