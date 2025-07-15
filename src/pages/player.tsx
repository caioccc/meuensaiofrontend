/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from "@/components/AppLayout";
import { Container, LoadingOverlay, Text, Title } from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../lib/axios";
import Player from "../components/Player";
import { useTranslation } from "next-i18next";

export default function PlayerPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Função para registrar ação no backend
  const recordAction = async (actionType: string, objectId?: string) => {
    try {
      await api.post('/actions/record/', {
        action: actionType,
        related_object_id: objectId,
      });
    } catch (error) {
      console.log(t('playerPage.actionError'), error);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/songs/${id}/`).then(res => {
      setSong(res.data);
      if (res.data && res.data.id) {
        recordAction('view_song', res.data.id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingOverlay visible={true} zIndex={1000} />;

  return (
    <AppLayout>
      <Container>
        <Title order={2}>{t('playerPage.title')}</Title>
        {song ? (
          <>
            <Text>{song.title}</Text>
            <Player
              song={song}
            />
          </>
        ) : (
          <Text color="dimmed">{t('playerPage.notFound')}</Text>
        )}
      </Container>
    </AppLayout>
  );
}
