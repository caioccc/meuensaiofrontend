import { useEffect, useState } from 'react';
import { Container, Title, Text, Loader, Alert, Grid, Card, Group, Badge, ThemeIcon, Accordion } from '@mantine/core';
import { IconTrophy, IconLock, IconCategory } from '@tabler/icons-react';
import api from '../../lib/axios';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon_name: string;
  category: string;
  points: number;
  earned: boolean;
}

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const response = await api.get<Achievement[]>('/achievements/');
        setAchievements(response.data);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar as conquistas. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryNames: Record<string, string> = {
    ONBOARDING: 'Primeiros Passos',
    REPERTORIO: 'Repertório',
    PERFORMANCE: 'Performance',
    PRO: 'Usuário PRO',
    SOCIAL: 'Social',
  };

  if (loading) {
    return (
      <AppLayout>
        <Container>
          <Group justify="center" mt="xl">
            <Loader />
            <Text>Carregando conquistas...</Text>
          </Group>
        </Container>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Container>
          <Alert title="Erro" color="red" withCloseButton>
            {error}
          </Alert>
        </Container>
      </AppLayout>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Container size="lg">
          <Title order={1} mb="md">Minhas Conquistas</Title>
          <Text c="dimmed" mb="xl">
            Veja todas as conquistas que você pode desbloquear e acompanhe seu progresso.
          </Text>

          <Accordion defaultValue={Object.keys(groupedAchievements)[0] || ''} variant="separated">
            {Object.entries(groupedAchievements).map(([category, items]) => (
              <Accordion.Item key={category} value={category}>
                <Accordion.Control icon={<IconCategory size={20} />}>
                  <Title order={4}>{categoryNames[category] || category}</Title>
                </Accordion.Control>
                <Accordion.Panel>
                  <Grid>
                    {items.map((ach) => (
                      <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={ach.id}>
                        <Card withBorder radius="md" style={{ opacity: ach.earned ? 1 : 0.5, borderLeft: `5px solid ${ach.earned ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-4)'}` }}>
                          <Group>
                            <ThemeIcon size="xl" radius="md" variant={ach.earned ? 'filled' : 'light'} color={ach.earned ? 'blue' : 'gray'}>
                              {ach.earned ? <IconTrophy size={28} /> : <IconLock size={28} />}
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                              <Text fw={700}>{ach.title}</Text>
                              <Text size="sm" c="dimmed">{ach.description}</Text>
                              <Badge color="yellow" variant="light" mt="sm">
                                {ach.points} Pontos
                              </Badge>
                            </div>
                          </Group>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default AchievementsPage;
