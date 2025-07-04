/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import { Anchor, Breadcrumbs, Button, Container, Group, Loader, SimpleGrid, Stack, TextInput, Title } from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
  const router = useRouter();
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [search, setSearch] = useState(""); // valor realmente buscado
  const [searchInput, setSearchInput] = useState(""); // valor do input
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  const [order, setOrder] = useState("-created_at");
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
    { value: "-created_at", label: "Mais recente" },
    { value: "created_at", label: "Mais antigo" },
    { value: "-num_songs", label: "Mais músicas" },
    { value: "num_songs", label: "Menos músicas" },
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
          message: "Erro ao buscar setlists",
        });
        return;
      }
      if (append) {
        setSetlists(prev => [...prev, ...res.data.results]);
      } else {
        setSetlists(res.data.results);
      }
      setTotal(Math.ceil(res.data.count / 10));
      setHasMore(!!res.data.next);
    } catch (e: any) {
      showNotification({ color: "red", message: e.message });
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
          <Anchor onClick={() => router.push('/')}>Início</Anchor>
          <Anchor onClick={() => router.push('/setlists')}>Setlists</Anchor>
        </Breadcrumbs>
        <Group justify="space-between" mb="md" align="center" style={{ width: '100%' }}>
          <Title order={2}>Setlists</Title>
          <Button
            leftSection={<IconPlus size={18} />}
            color="blue"
            variant="filled"
            style={{ marginLeft: 'auto' }}
            onClick={() => router.push('/setlists/add')}
          >
            Novo Setlist
          </Button>
        </Group>
        {isMobile ? (
          <Stack mb="md" gap="xs">
            <TextInput
              icon={<IconSearch size={16} />}
              placeholder="Buscar por nome do setlist ou música"
              value={searchInput}
              onChange={(e) => setSearchInput(e.currentTarget.value)}
              mb={0}
            />
            <OrderSelect value={order} onChange={v => {
              setPage(1);
              setOrder(v || "-created_at")
            }} options={orderOptions} />
          </Stack>
        ) : (
          <Group mb="md" gap="xs" align="center" style={{ width: '100%' }}>
            <TextInput
              icon={<IconSearch size={16} />}
              placeholder="Buscar por nome do setlist ou música"
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
          <Loader />
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
              '&::-webkit-scrollbar': {
                display: 'none', // Chrome, Safari e Opera
              },
              '&::-webkit-scrollbar-track':
                { background: 'transparent' }, // Chrome, Safari e Opera
              '&::-webkit-scrollbar-thumb':
                { background: 'transparent' }, // Chrome, Safari e Opera
              '&::-webkit-scrollbar-thumb:hover':
                { background: 'transparent' }, // Chrome, Safari e Opera
              '&::-webkit-scrollbar-thumb:active':
                { background: 'transparent' }, // Chrome, Safari e Opera
            }}
          >
            <SimpleGrid
              cols={1}
              spacing="md"
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
