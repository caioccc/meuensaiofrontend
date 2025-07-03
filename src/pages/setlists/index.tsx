import AppLayout from "@/components/AppLayout";
import { Button, Container, Group, Loader, Pagination, SimpleGrid, TextInput, Title, Breadcrumbs, Anchor } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../../lib/axios";
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);

  const fetchSetlists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append("search", search);
      const res = await api.get(`/setlists/?${params.toString()}`);
      if (res.status !== 200) {
        showNotification({
          color: "red",
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
  }, [search, page]);

  return (
    <AppLayout>
      <Container size="100%">
        <Breadcrumbs mb="md">
          <Anchor onClick={() => router.push('/')}>Início</Anchor>
          <Anchor onClick={() => router.push('/setlists')}>Setlists</Anchor>
        </Breadcrumbs>
        <Group position="apart" mb="md" align="center" style={{ width: '100%' }}>
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
        <TextInput
          icon={<IconSearch size={16} />}
          placeholder="Buscar por nome do setlist ou música"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          mb="md"
        />
        {loading ? (
          <Loader />
        ) : (
          <SimpleGrid
            cols={1}
            spacing="md"
            breakpoints={[{ maxWidth: "sm", cols: 1 }]}
          >
            {setlists.map((setlist) => (
              <SetlistCard key={setlist.id} setlist={setlist} onRemoved={fetchSetlists} />
            ))}
          </SimpleGrid>
        )}
        <Pagination page={page} onChange={setPage} total={total} mt="lg" />
      </Container>
    </AppLayout>
  );
}
