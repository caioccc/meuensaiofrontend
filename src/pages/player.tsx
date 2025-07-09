/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import { Container, LoadingOverlay, Text, Title } from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../lib/axios";
import Player from "../components/Player";

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/songs/${id}/`).then(res => {
      setSong(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingOverlay visible={true} zIndex={1000} />;

  return (
    <AppLayout>
      <Container>
        <Title order={2}>Player</Title>
        {song ? (
          <>
            <Text>{song.title}</Text>
            <Player
              song={song}
            />
          </>
        ) : (
          <Text color="dimmed">Música não encontrada.</Text>
        )}
      </Container>
    </AppLayout>
  );
}
