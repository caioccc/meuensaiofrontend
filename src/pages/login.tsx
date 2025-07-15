/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { Button, Container, Divider, Group, Loader, Paper, PasswordInput, TextInput, Title } from '@mantine/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import axios from '../../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import classes from './login.module.css'; // Certifique-se de que o caminho está correto

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/token/', {
        email: data.email,
        password: data.password,
      });
      login(res.data.access, res.data.refresh);
      router.push('/');
    } catch (err: any) {
      let msg = t('login.invalid_credentials', 'Usuário ou senha inválidos');
      if (err?.response?.data?.detail) {
        if (err.response.data.detail === 'No active account found with the given credentials') {
          msg = t('login.no_active_account', 'Nenhuma conta ativa encontrada com as credenciais fornecidas');
        } else if (err?.response?.data?.error) {
          msg = t('login.no_active_account', 'Nenhuma conta ativa encontrada com as credenciais fornecidas');
        }
      }
      setError(msg);
      console.log(t('login.login_error', 'Erro ao fazer login:'), err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form}>
        {/* <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <LanguageSwitcher size="xs" />
        </div> */}
        <Title order={2} className={classes.title}>
          {t('login.welcome', 'Bem vindo ao Setlistify')}
        </Title>

        <Container size={420} my={40}>
          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <form onSubmit={handleSubmit(onSubmit)}>
              <TextInput
                label={t('login.email_label', 'E-mail')}
                placeholder={t('login.email_placeholder', 'seu@email.com')}
                {...register('email', { required: true })}
                error={errors.email && t('login.required_field', 'Campo obrigatório')}
              />
              <PasswordInput
                label={t('login.password_label', 'Senha')}
                type="password"
                mt="md"
                {...register('password', { required: true })}
                error={errors.password && t('login.required_field', 'Campo obrigatório')}
              />
              {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
              <Button
                fullWidth
                mt="xl"
                type="submit"
                loading={loading}
                disabled={loading}
                leftSection={loading ? <Loader size={18} color="white" /> : undefined}
              >
                {loading ? <Loader size={18} color="white" /> : t('login.enter', 'Entrar')}
              </Button>
            </form>
            <Divider label={t('login.or_login_with', 'Ou entre com')} my="lg" />

            <Group justify="center">
              <GoogleLoginButton />
            </Group>

            <Divider my="lg" label={t('login.or', 'ou')} labelPosition="center" />

            <Button
              variant="subtle"
              fullWidth
              mt="md"
              onClick={() => router.push('/register')}
            >
              {t('login.no_account', 'Não tem conta? Cadastre-se')}
            </Button>
          </Paper>
        </Container>
      </Paper>
    </div>

  );
}
