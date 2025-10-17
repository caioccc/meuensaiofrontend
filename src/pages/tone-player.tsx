/* eslint-disable @typescript-eslint/no-explicit-any */
import CustomTonePlayer from "@/components/CustomTonePlayer";
import LandingLayout from "@/components/LandingLayout";
import { Container, LoadingOverlay, Text, Title } from "@mantine/core";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import api from "../../lib/axios";

export default function TonePlayerPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Função para registrar ação no backend

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/songs/by-youtube-id/`, {
      params: { youtube_id: id }
    }).then(res => {
      setSong(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingOverlay visible={true} zIndex={1000} />;

  return (
    <LandingLayout>
      <Container py="lg">
        <Title order={2}>{t('playerPage.title')}</Title>
        {song ? (
          <>
            <Text>{song.title}</Text>
            <CustomTonePlayer
              song={song}
            />
          </>
        ) : (
          <Text color="dimmed">{t('playerPage.notFound')}</Text>
        )}
      </Container>
    </LandingLayout>
  );
}
