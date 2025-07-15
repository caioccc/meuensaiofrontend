import { useEffect, useState } from 'react';
import { Container, Title, Text, Loader, Alert, Grid, Card, Group, Badge, ThemeIcon, Accordion } from '@mantine/core';
import { IconTrophy, IconLock, IconCategory } from '@tabler/icons-react';
import api from '../../lib/axios';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTranslation } from 'next-i18next';

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
  const { t } = useTranslation('common');
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
        setError(t('achievementsPage.loadError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [t]);

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryNames: Record<string, string> = {
    ONBOARDING: t('achievementsPage.categories.ONBOARDING'),
    REPERTORIO: t('achievementsPage.categories.REPERTORIO'),
    PERFORMANCE: t('achievementsPage.categories.PERFORMANCE'),
    PRO: t('achievementsPage.categories.PRO'),
    SOCIAL: t('achievementsPage.categories.SOCIAL'),
  };

  if (loading) {
    return (
      <AppLayout>
        <Container>
          <Group justify="center" mt="xl">
            <Loader />
            <Text>{t('achievementsPage.loading')}</Text>
          </Group>
        </Container>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Container>
          <Alert title={t('achievementsPage.errorTitle')} color="red" withCloseButton>
            {error}
          </Alert>
        </Container>
      </AppLayout>
    );
  }

  // Dicionário de traduções por id
  const achievementTranslations: Record<number, { title: string; description: string }> = {
    1: { title: t('achievementsPage.achievements.1.title'), description: t('achievementsPage.achievements.1.description') },
    2: { title: t('achievementsPage.achievements.2.title'), description: t('achievementsPage.achievements.2.description') },
    3: { title: t('achievementsPage.achievements.3.title'), description: t('achievementsPage.achievements.3.description') },
    4: { title: t('achievementsPage.achievements.4.title'), description: t('achievementsPage.achievements.4.description') },
    5: { title: t('achievementsPage.achievements.5.title'), description: t('achievementsPage.achievements.5.description') },
    6: { title: t('achievementsPage.achievements.6.title'), description: t('achievementsPage.achievements.6.description') },
    7: { title: t('achievementsPage.achievements.7.title'), description: t('achievementsPage.achievements.7.description') },
    8: { title: t('achievementsPage.achievements.8.title'), description: t('achievementsPage.achievements.8.description') },
    9: { title: t('achievementsPage.achievements.9.title'), description: t('achievementsPage.achievements.9.description') },
    10: { title: t('achievementsPage.achievements.10.title'), description: t('achievementsPage.achievements.10.description') },
    11: { title: t('achievementsPage.achievements.11.title'), description: t('achievementsPage.achievements.11.description') },
    12: { title: t('achievementsPage.achievements.12.title'), description: t('achievementsPage.achievements.12.description') },
    13: { title: t('achievementsPage.achievements.13.title'), description: t('achievementsPage.achievements.13.description') },
    14: { title: t('achievementsPage.achievements.14.title'), description: t('achievementsPage.achievements.14.description') },
    15: { title: t('achievementsPage.achievements.15.title'), description: t('achievementsPage.achievements.15.description') },
    16: { title: t('achievementsPage.achievements.16.title'), description: t('achievementsPage.achievements.16.description') },
    17: { title: t('achievementsPage.achievements.17.title'), description: t('achievementsPage.achievements.17.description') },
    18: { title: t('achievementsPage.achievements.18.title'), description: t('achievementsPage.achievements.18.description') },
    19: { title: t('achievementsPage.achievements.19.title'), description: t('achievementsPage.achievements.19.description') },
    20: { title: t('achievementsPage.achievements.20.title'), description: t('achievementsPage.achievements.20.description') },
    21: { title: t('achievementsPage.achievements.21.title'), description: t('achievementsPage.achievements.21.description') },
    22: { title: t('achievementsPage.achievements.22.title'), description: t('achievementsPage.achievements.22.description') },
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Container size="lg">
          <Title order={1} mb="md">{t('achievementsPage.title')}</Title>
          <Text c="dimmed" mb="xl">
            {t('achievementsPage.subtitle')}
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
                              <Text fw={700}>{achievementTranslations[ach.id]?.title || ach.title}</Text>
                              <Text size="sm" c="dimmed">{achievementTranslations[ach.id]?.description || ach.description}</Text>
                              <Badge color="yellow" variant="light" mt="sm">
                                {ach.points} {t('achievementsPage.points')}
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
