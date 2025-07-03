import { useForm } from 'react-hook-form';
import { Button, TextInput, Paper, Title, Container, Divider, Group, Loader } from '@mantine/core';
import { GoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();

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
      setError('Usuário ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title align="center">Login</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextInput label="E-mail" placeholder="seu@email.com" {...register('email', { required: true })} error={errors.email && 'Campo obrigatório'} />
          <TextInput label="Senha" type="password" mt="md" {...register('password', { required: true })} error={errors.password && 'Campo obrigatório'} />
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          <Button fullWidth mt="xl" type="submit" loading={loading} disabled={loading} leftSection={loading ? <Loader size={18} color="white" /> : undefined}>
            {loading ? <Loader size={18} color="white" /> : "Entrar"}
          </Button>
        </form>
        <Divider my="lg" label="ou" labelPosition="center" />
        <Group position="center" style={{ width: '100%' }}>
          <div style={{ width: '100%' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                // Aqui você pode enviar o credentialResponse.credential para o backend
                // para autenticar/registrar o usuário
                // Exemplo: axios.post('/api/google-login/', { token: credentialResponse.credential })
              }}
              onError={() => setError('Erro ao autenticar com Google')}
              useOneTap
              width="100%"
              text="continue_with"
              shape="pill"
              locale="pt-BR"
              clientId="917555710750-n61p9e7knksgrno9ggquh7ipcdiqq0b8.apps.googleusercontent.com"
            />
          </div>
        </Group>
        <Button
          variant="subtle"
          fullWidth
          mt="md"
          onClick={() => router.push('/register')}
        >
          Não tem conta? Cadastre-se
        </Button>
      </Paper>
    </Container>
  );
}
