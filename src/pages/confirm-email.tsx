import { Button, Container, LoadingOverlay, Paper, Text } from '@mantine/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api from '../../lib/axios';

const ConfirmEmailPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');

  const confirmEmail = async (token: string) => {
    const response = await api.get(`/confirm-email/?token=${token}`);
    return response.data;
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    confirmEmail(token as string)
      .then(() => {
        setSuccess(true);
        setMessage('Email confirmado com sucesso! Você já pode fazer login.');
      })
      .catch((error) => {
        setSuccess(false);
        setMessage(
          error?.response?.data?.detail || 'Token inválido ou expirado.'
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <Container size={420} maw={400} mx="auto" mt={60}>
      <Paper p="lg" radius="md" withBorder mt="xl" style={{ maxWidth: 400, margin: '0 auto' }}>
        {loading ? (
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        ) : (
          <>
            <Text size="lg" fw={700} mb="md" color={success ? 'green' : 'red'}>
              {success ? 'Sucesso!' : 'Erro'}
            </Text>
            <Text mb="md">{message}</Text>
            <Button
              color={success ? 'blue' : 'gray'}
              onClick={() => router.push('/login')}
              fullWidth
            >
              Ir para o Login
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ConfirmEmailPage;