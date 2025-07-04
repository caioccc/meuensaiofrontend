/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import { Button, Container, Group, Loader, Pagination, SimpleGrid, TextInput, Title, Breadcrumbs, Anchor, Stack } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import SetlistCard from "../../components/SetlistCard";
import OrderSelect from "../../components/OrderSelect";
import { useMediaQuery } from '@mantine/hooks';

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

  const fetchSetlists = async () => {
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
      setSetlists(res.data.results);
      setTotal(Math.ceil(res.data.count / 10));
    } catch (e: any) {
      showNotification({ color: "red", message: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetlists();
    // eslint-disable-next-line
  }, [search, page, order]);

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
            <OrderSelect value={order} onChange={v => setOrder(v || "-created_at")} options={orderOptions} />
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
            <OrderSelect value={order} onChange={v => setOrder(v || "-created_at")} options={orderOptions} style={{ flex: 3, minWidth: 120 }} />
          </Group>
        )}
        {loading ? (
          <Loader />
        ) : (
          <SimpleGrid
            cols={1}
            spacing="md"
            breakpoints={[{ maxWidth: "sm", cols: 1 }]}
          >
            {setlists.map((setlist) => (
              <SetlistCard key={setlist.id} setlist={setlist} onRemoved={handleRemoved} />
            ))}
          </SimpleGrid>
        )}
        <Pagination page={page} onChange={setPage} total={total} mt="lg" />
      </Container>
    </AppLayout>
  );
}
