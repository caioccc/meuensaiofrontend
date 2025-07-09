import { Button, Container, Paper, Text, Title } from '@mantine/core';
import { useRouter } from 'next/router';

const CheckEmailPage = () => {
  const router = useRouter();

  return (
    <Container size={420} maw={400} mx="auto" mt={60}>
      <Title order={2} mb="md">Checar Email</Title>

      <Paper p="lg" radius="md" withBorder mt="xl" style={{ maxWidth: 400, margin: '0 auto' }}>
        <Text mb="md">
          Enviamos um link de confirmação para o seu email. Clique no link para ativar sua conta e poder acessar o sistema.
        </Text>
        <Text mb="md" color="orange" fw={400}>
          Atenção: Caso não encontre o e-mail na sua caixa de entrada, verifique também a caixa de SPAM ou lixo eletrônico. Alguns provedores podem filtrar mensagens automáticas.
        </Text>
        <Button color="blue" onClick={() => router.push('/login')} fullWidth>
          Ir para o Login
        </Button>
      </Paper>
    </Container>
  );
};

export default CheckEmailPage;