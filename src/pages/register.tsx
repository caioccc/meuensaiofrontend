"use client";
import { useForm } from "react-hook-form";
import { TextInput, PasswordInput, Button, Box, Title, Stack, Text, Loader } from "@mantine/core";
import { useState } from "react";
import api from "../../lib/axios";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft, IconUser, IconLock, IconMail } from "@tabler/icons-react";

interface RegisterForm {
  first_name: string;
  email: string;
  password: string;
  password2: string;
}

const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,64}$/;

const registerSchema = z.object({
  first_name: z.string().min(2, { message: "Nome obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string()
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" })
    .max(64, { message: "Senha deve ter no máximo 64 caracteres" })
    .regex(passwordRegex, { message: "A senha deve conter letras, números e caracteres especiais" }),
  password2: z.string(),
}).refine((data) => data.password === data.password2, {
  message: "As senhas não coincidem",
  path: ["password2"],
});

export default function RegisterPage() {
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
      router.push("/login");
    } catch (err: any) {
      setError("Não foi possível realizar o cadastro. Verifique seus dados ou tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maw={400} mx="auto" mt={60}>
      <Title order={2} mb="md">Criar Conta</Title>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <TextInput
            label="Nome"
            leftSection={<IconUser size={18} />}
            {...register("first_name")}
            error={errors.first_name?.message}
            autoComplete="name"
          />
          <TextInput
            label="Email"
            leftSection={<IconMail size={18} />}
            {...register("email")}
            error={errors.email?.message}
            type="email"
            autoComplete="email"
          />
          <PasswordInput
            label="Senha"
            leftSection={<IconLock size={18} />}
            {...register("password")}
            error={errors.password?.message}
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirmar Senha"
            leftSection={<IconLock size={18} />}
            {...register("password2")}
            error={errors.password2?.message}
            autoComplete="new-password"
          />
          {error && <Text color="red" size="sm">{error}</Text>}
          <Button type="submit" loading={loading} fullWidth mt="md" leftSection={<IconUser size={18} />} disabled={loading}>
            {loading ? <Loader size={18} color="white" /> : "Registrar"}
          </Button>
          <Button
            variant="subtle"
            fullWidth
            mt="xs"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.push("/login")}
          >
            Voltar para o login
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
