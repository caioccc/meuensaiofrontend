/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import { Anchor, Breadcrumbs, Button, Container, Group, Loader, LoadingOverlay, SimpleGrid, Stack, TextInput, Title } from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from 'next-i18next';
import api from "../../../lib/axios";
import InfiniteScrollWrapper from "../../components/InfiniteScrollWrapper";
import OrderSelect from "../../components/OrderSelect";
import SetlistCard from "../../components/SetlistCard";

interface Song {
  id: number;
  title: string;
  artist: string;
}

interface Setlist {
  id: number;
  name: string;
  songs: Song[];
}

export default function SetlistsPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState("-date, -created_at");
  const [hasMore, setHasMore] = useState(true);
  const isMobile = useMediaQuery('(max-width: 48em)');

  // Debounce para busca
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput.length === 0 || searchInput.length >= 3) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [searchInput]);

  const orderOptions = [
    { value: "-date, -created_at", label: t('setlistsPage.orderNewest') },
    { value: "date, created_at", label: t('setlistsPage.orderOldest') },
    { value: "-num_songs", label: t('setlistsPage.orderMostSongs') },
    { value: "num_songs", label: t('setlistsPage.orderLeastSongs') },
  ];

  const fetchSetlists = async (append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append("search", search);
      if (order) params.append("ordering", order);
      const res = await api.get(`/setlists/?${params.toString()}`);
      if (res.status !== 200) {
        showNotification({
          color: "red",
          id: "setlists-fetch-error",
          message: t('setlistsPage.fetchError'),
        });
        return;
      }
      if (append) {
        setSetlists(prev => [...prev, ...res.data.results]);
      } else {
        setSetlists(res.data.results);
      }
      setHasMore(!!res.data.next);
    } catch (e: any) {
      console.log(e);
      showNotification({ color: "red", message: t('setlistsPage.fetchError') });
    } finally {
      setLoading(false);
    }
  };

  // Scroll infinito: carrega mais ao chegar no fim
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page === 1) {
      fetchSetlists();
    }
    // eslint-disable-next-line
  }, [search, order]);

  useEffect(() => {
    if (page > 1) {
      fetchSetlists(true);
    }
    // eslint-disable-next-line
  }, [page]);

  const handleRemoved = () => {
    fetchSetlists();
  };

  return (
    <AppLayout>
      <Container size="100%">
        <Breadcrumbs mb="md">
          <Anchor onClick={() => router.push('/dashboard')}>{t('setlistsPage.breadcrumbHome')}</Anchor>
          <Anchor onClick={() => router.push('/setlists')}>{t('setlistsPage.breadcrumbSetlists')}</Anchor>
        </Breadcrumbs>
        <Group justify="space-between" mb="md" align="center" style={{ width: '100%' }}>
          <Title order={2}>{t('setlistsPage.title')}</Title>
          <Button
            leftSection={<IconPlus size={18} />}
            color="blue"
            variant="filled"
            style={{ marginLeft: 'auto' }}
            onClick={() => router.push('/setlists/add')}
          >
            {t('setlistsPage.newSetlist')}
          </Button>
        </Group>
        {isMobile ? (
          <Stack mb="md" gap="xs">
            <TextInput
              leftSection={<IconSearch size={16} />}
              placeholder={t('setlistsPage.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.currentTarget.value)}
              mb={0}
            />
            <OrderSelect value={order} onChange={v => {
              setPage(1);
              setOrder(v || "-date")
            }} options={orderOptions} />
          </Stack>
        ) : (
          <Group mb="md" gap="xs" align="center" style={{ width: '100%' }}>
            <TextInput
              leftSection={<IconSearch size={16} />}
              placeholder={t('setlistsPage.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.currentTarget.value)}
              style={{ flex: 7, minWidth: 0 }}
              mb={0}
            />
            <OrderSelect value={order} onChange={v => {
              setPage(1);
              setOrder(v || "-created_at");
            }} options={orderOptions} style={{ flex: 3, minWidth: 120 }} />
          </Group>
        )}
        {/* Bloco de conteúdo com scroll dedicado */}
        {loading && page === 1 ? (
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
          />
        ) : (
          <InfiniteScrollWrapper
            dataLength={setlists.length}
            next={loadMore}
            hasMore={hasMore}
            loader={<Loader />}
            scrollableTarget="setlists-scrollable-content"
            style={{
              overflow: 'auto',
              overflowX: 'hidden',
              height: '100%', // Ajuste conforme necessário
              //esconder os scroll
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // Internet Explorer 10+
            }}
          >
            <SimpleGrid
              cols={1}
              gap="md"
              breakpoints={[{ maxWidth: "sm", cols: 1 }]}
            >
              {setlists.map((setlist) => (
                <SetlistCard key={setlist.id} setlist={setlist} onRemoved={handleRemoved} />
              ))}
            </SimpleGrid>
          </InfiniteScrollWrapper>
        )}
      </Container>
    </AppLayout>
  );
}
