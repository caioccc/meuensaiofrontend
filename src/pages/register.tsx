/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Container, Loader, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconArrowLeft, IconLock, IconMail, IconUser } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "../../lib/axios";
import { showNotification } from "@mantine/notifications";

interface RegisterForm {
  first_name: string;
  email: string;
  password: string;
  password2: string;
}

const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,64}$/;

const RegisterPage = () => {
  const { t } = useTranslation();
  const registerSchema = z.object({
    first_name: z.string().min(2, { message: t('register.validation.name_required', 'Nome obrigatório') }),
    email: z.string().email({ message: t('register.validation.email_invalid', 'Email inválido') }),
    password: z.string()
      .min(6, { message: t('register.validation.password_min', 'Senha deve ter no mínimo 6 caracteres') })
      .max(64, { message: t('register.validation.password_max', 'Senha deve ter no máximo 64 caracteres') })
      .regex(passwordRegex, { message: t('register.validation.password_regex', 'A senha deve conter letras, números e caracteres especiais') }),
    password2: z.string(),
  }).refine((data) => data.password === data.password2, {
    message: t('register.validation.passwords_not_match', 'As senhas não coincidem'),
    path: ["password2"],
  });

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    setLoading(true);
    try {
      await api.post("users/", {
        first_name: data.first_name,
        email: data.email,
        password: data.password,
      });
      showNotification({
        color: 'green',
        title: t('register.success', 'Sucesso'),
        message: t('register.success_message', 'Usuário registrado! Enviamos um link de confirmação para seu e-mail.'),
        autoClose: 5000,
      });
      router.push("/check-email");
    } catch (err: any) {
      showNotification({
        color: 'red',
        title: t('register.error', 'Erro ao registrar usuário'),
        message: err.response?.data?.detail || t('register.error_message', 'Não foi possível realizar o cadastro. Verifique seus dados ou tente novamente mais tarde.'),
        autoClose: 5000,
      });
      console.log(t('register.error', 'Erro ao registrar usuário'), err);
      setError(t('register.error_message', 'Não foi possível realizar o cadastro. Verifique seus dados ou tente novamente mais tarde.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} maw={400} mx="auto" mt={60}>
      <Title order={2} mb="md">{t('register.title', 'Criar Conta')}</Title>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label={t('register.name', 'Nome')}
            leftSection={<IconUser size={18} />}
            {...register("first_name")}
            error={errors.first_name?.message}
            autoComplete="name"
          />
          <TextInput
            label={t('register.email', 'Email')}
            leftSection={<IconMail size={18} />}
            {...register("email")}
            error={errors.email?.message}
            type="email"
            autoComplete="email"
          />
          <PasswordInput
            label={t('register.password', 'Senha')}
            leftSection={<IconLock size={18} />}
            {...register("password")}
            error={errors.password?.message}
            autoComplete="new-password"
          />
          <PasswordInput
            label={t('register.confirm_password', 'Confirmar Senha')}
            leftSection={<IconLock size={18} />}
            {...register("password2")}
            error={errors.password2?.message}
            autoComplete="new-password"
          />
          {error && <Text color="red" size="sm">{error}</Text>}
          <Button type="submit" loading={loading} fullWidth mt="md" leftSection={<IconUser size={18} />} disabled={loading}>
            {loading ? <Loader size={18} color="white" /> : t('register.submit', 'Registrar')}
          </Button>
          <Button
            variant="subtle"
            fullWidth
            mt="xs"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.push("/login")}
          >
            {t('register.back_to_login', 'Voltar para o login')}
          </Button>
        </Stack>
      </form>
    </Container>
  );
}

export default RegisterPage;