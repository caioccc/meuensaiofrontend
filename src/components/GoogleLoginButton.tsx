
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/contexts/AuthContext";
import { showNotification } from "@mantine/notifications";
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from "next/router";
import api from "../../lib/axios";

export function GoogleLoginButton() {
  const router = useRouter();

  const { login } = useAuth();

  const loginWithGoogle = async (token: string) => {
    const response = await api.post('/auth/google/', {
      token,
    });
    return response;
  };


  const handleSuccess = async (credentialResponse: any) => {
    const { credential } = credentialResponse;
    if (credential) {
      try {
        const response = await loginWithGoogle(credential);

        const data = response.data;
        if (data.access) {
          login(data.access, data.refresh);
          router.push('/');
        } else {
          showNotification({
            title: 'Erro de autenticação',
            message: 'Não foi possível autenticar com o Google. Tente novamente.',
            color: 'red',
          });
          console.log('Token inválido.');
        }
      } catch (error) {
        showNotification({
          title: 'Erro ao autenticar',
          message: 'Não foi possível autenticar com o Google. Tente novamente.',
          color: 'red',
        });
        console.log('Erro ao autenticar com Google', error);
      }
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => toast({
        title: 'Erro no login',
        description: 'Não foi possível autenticar com o Google. Tente novamente.',
      })}
    />
  );
}