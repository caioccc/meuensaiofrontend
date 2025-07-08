import { Button, Center, LoadingOverlay, Paper, Stack, Text, Title } from '@mantine/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '../../lib/axios';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { payment } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    setLoading(true);
    if (payment) {
      api.post('/subscriptions/confirm/', { payment, status: 'approved' })
        .then(() => {
          setError(null);
        })
        .catch(() => setError('Não foi possível confirmar o pagamento.'))
        .finally(() => setLoading(false));
    }
  }, [payment]);

  useEffect(() => {
    if (!loading && !error && seconds > 0) {
      const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (seconds === 0) router.push('/');
  }, [loading, error, seconds, router]);

  return (
    <Center style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f8fbff 100%)' }}>
      <Paper p="xl" radius="md" shadow="md" withBorder style={{ minWidth: 320, maxWidth: 400 }}>
        <Stack align="center" gap="md">
          <Title order={2} ta="center">Pagamento aprovado!</Title>
          {loading ? (
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          ) : error ? (
            <Text color="red" ta="center">{error}</Text>
          ) : (
            <>
              <Text ta="center">Sua assinatura foi liberada com sucesso.<br />Você será redirecionado para a página inicial em <b>{seconds}</b> segundos.</Text>
              <Button mt="md" onClick={() => router.push('/')}>Ir para início agora</Button>
            </>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
