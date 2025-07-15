import { Button, Container, LoadingOverlay, Paper, Text } from '@mantine/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';


const ConfirmEmailPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
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
        setMessage(t('confirm_email.success_message', 'Email confirmado com sucesso! Você já pode fazer login.'));
      })
      .catch((error) => {
        setSuccess(false);
        setMessage(
          error?.response?.data?.detail || t('confirm_email.invalid_token', 'Token inválido ou expirado.')
        );
      })
      .finally(() => setLoading(false));
  }, [token, t]);

  return (
    <Container size={420} maw={400} mx="auto" mt={60}>
      <Paper p="lg" radius="md" withBorder mt="xl" style={{ maxWidth: 400, margin: '0 auto' }}>
        {loading ? (
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        ) : (
          <>
            <Text size="lg" fw={700} mb="md" color={success ? 'green' : 'red'}>
              {success ? t('confirm_email.success', 'Sucesso!') : t('confirm_email.error', 'Erro')}
            </Text>
            <Text mb="md">{message}</Text>
            <Button
              color={success ? 'blue' : 'gray'}
              onClick={() => router.push('/login')}
              fullWidth
            >
              {t('confirm_email.go_to_login', 'Ir para o Login')}
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default ConfirmEmailPage;