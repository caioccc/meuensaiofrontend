/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { IconCheck, IconCrown, IconStar } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  price_display: string;
  features: string[];
  highlight?: boolean;
  badge?: string | null;
  checkout_url?: string;
}

interface PlansModalProps {
  opened: boolean;
  onClose: () => void;
}

const PlanCard: React.FC<{
  plan: Plan;
  isCurrent?: boolean;
}> = ({ plan, isCurrent }) => {
  const [loading, setLoading] = useState(false);

  const handlePlanClick = async () => {
    setLoading(true);
    try {
      // Se for plano gratuito, não faz nada (botão já desabilitado)
      if (!plan.checkout_url) return;
      // Cria subscription no backend
      await api.post('/subscriptions/', { plan_id: plan.id });
      // Abre checkout em nova aba
      window.open(plan.checkout_url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      showNotification({
        title: 'Erro ao assinar plano',
        message: 'Ocorreu um erro ao tentar assinar este plano. Por favor, tente novamente mais tarde.',
        color: 'red',
      });
      console.log('Erro ao assinar plano:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper
      p="lg"
      radius="md"
      withBorder
      style={{
        borderColor: plan.highlight ? 'light-dark(#228be6, #4dabf7)' : undefined,
        boxShadow: plan.highlight ? '0 0 0 2px light-dark(#228be622, #4dabf733)' : undefined,
        position: 'relative',
        minWidth: 260,
        maxWidth: 340,
        width: '100%',
        background: plan.highlight ? 'light-dark(linear-gradient(135deg, #e3f0ff 0%, #f8fbff 100%), linear-gradient(135deg, #1a2636 0%, #232b3a 100%))' : undefined,
        transition: 'box-shadow .2s',
      }}
    >
      {plan.badge && (
        <Box style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
          <Text size="xs" fw={700} c="light-dark(#fff, #232b3a)" bg="light-dark(#228be6, #4dabf7)" px={10} py={2} style={{ borderRadius: 8 }}>
            {plan.badge}
          </Text>
        </Box>
      )}
      <Stack gap={4} align="center" mb="sm">
        {plan.highlight ? <IconCrown size={36} color="light-dark(#228be6, #4dabf7)" /> : <IconStar size={32} color="light-dark(#adb5bd, #dee2e6)" />}
        <Title order={3} fw={plan.highlight ? 700 : 600} c={plan.highlight ? 'light-dark(blue.7, blue.2)' : undefined}>{plan.name}</Title>
        <Text size="xl" fw={700} c={plan.highlight ? 'light-dark(blue.7, blue.2)' : undefined}>{plan.price_display}</Text>
      </Stack>
      <Stack gap={2} mb="md">
        {plan.features.map((f, i) => (
          <Group key={i} gap={6} align="center">
            <IconCheck size={16} color={plan.highlight ? 'light-dark(#228be6, #4dabf7)' : 'light-dark(#51cf66, #40c057)'} />
            <Text size="sm">{f}</Text>
          </Group>
        ))}
      </Stack>
      {plan.checkout_url ? (
        <Button
          fullWidth
          color={plan.highlight ? 'light-dark(var(--mantine-color-blue-7, blue.7), var(--mantine-color-blue-2, blue.2))' : 'gray'}
          radius="md"
          size="md"
          loading={loading}
          mt="sm"
          onClick={handlePlanClick}
          disabled={isCurrent}
        >
          {isCurrent ? 'Seu plano atual' : `Assinar ${plan.name}`}
        </Button>
      ) : (
        <Button fullWidth disabled mt="sm">Gratuito</Button>
      )}
    </Paper>
  );
}


// Nova função para mapear features para texto amigável
const getFeatureSummary = (plan: any) => {
  const f = plan.features || {};
  const items = [];
  if (typeof f.max_songs === 'number') items.push(`${f.max_songs >= 10000 ? 'Músicas ilimitadas' : `Até ${f.max_songs} músicas`}`);
  if (typeof f.max_setlists === 'number') items.push(`${f.max_setlists >= 10000 ? 'Setlists ilimitados' : `Até ${f.max_setlists} setlists`}`);
  if (f.pdf) items.push('Exportação sem marca d’água');
  else items.push('Marca d’água nos PDFs');
  if (f.pads) items.push('Acesso a pads');
  if (f.chords) items.push('Acesso a cifras avançadas');
  if (f.support) items.push('Suporte prioritário');
  if (!f.ads) items.push('Sem anúncios');
  if (f.pro) items.push('Todos os recursos inclusos');
  return items;
};

const PlansModal: React.FC<PlansModalProps> = ({ opened, onClose }) => {
  const { subscription } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('PlansModal opened:', subscription, opened);

  useEffect(() => {
    if (opened) {
      setLoading(true);
      api.get('/plans/')
        .then(res => {
          setPlans((res.data.results || res.data).map((plan: any) => {
            const isPro = plan.name.toLowerCase().includes('pro');
            const isAnual = plan.duration_days >= 365;
            return {
              id: String(plan.id),
              name: plan.name,
              price_display: plan.price === '0.00' ? 'Grátis' : `R$${Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${isAnual ? '/ano' : '/mês'}`,
              features: getFeatureSummary(plan),
              highlight: isPro && !isAnual,
              badge: isPro && !isAnual ? 'Recomendado' : null,
              checkout_url: plan.checkout_url || null,
            };
          }));
        })
        .finally(() => setLoading(false));
    }
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton
      padding={0}
      styles={{ body: { padding: 0 } }}
      transitionProps={{ transition: 'fade', duration: 200 }}
    >
      <Box style={{ minHeight: '100vh', background: 'light-dark(linear-gradient(135deg, #e3f0ff 0%, #f8fbff 100%), linear-gradient(135deg, #1a2636 0%, #232b3a 100%))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 8px' }}>
        <Title order={2} mb={32} ta="center">Escolha seu plano</Title>
        {loading ? (
          <Loader size="lg" />
        ) : (
          <Stack gap={24} align="center" style={{ width: '100%', maxWidth: 1100 }}>
            <Group gap={24} align="stretch" justify="center" wrap="wrap" style={{ width: '100%' }}>
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={subscription && String(subscription.plan.id) === String(plan.id)}
                />
              ))}
            </Group>
            <Button variant="subtle" color="gray" size="md" mt={16} onClick={onClose}>
              Fechar
            </Button>
          </Stack>
        )}
      </Box>
    </Modal>
  );
};

export default PlansModal;
