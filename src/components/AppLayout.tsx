import { useAuth } from "@/contexts/AuthContext";
import {
  ActionIcon,
  AppShell,
  Avatar,
  Button,
  Divider,
  Group,
  Loader,
  Menu,
  NavLink,
  Text,
  Title,
  useMantineColorScheme
} from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowUpRight, IconLayoutDashboard, IconLogout, IconMenu2, IconMoon, IconMusic, IconSun, IconTable } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import PlansModal from "./PlansModal";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { user, isPro } = useAuth();
  const userEmail = user?.email || 'usuario@email.com';
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [navbarCollapsed, setNavbarCollapsed] = useState(false); // Começa aberto no desktop
  const pathname = usePathname();
  const { logout } = useAuth();
  const [loadingLogout, setLoadingLogout] = useState(false);

  const [opened, setOpened] = useState(false); // Modal de planos

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  const handleLogout = () => {
    setLoadingLogout(true);
    setTimeout(() => {
      logout();
      setLoadingLogout(false);
    }, 600); // tempo para mostrar o loading
  };

  useEffect(() => {
    setNavbarCollapsed(isMobile);
  }, [isMobile]);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: navbarCollapsed, desktop: navbarCollapsed } }}
      footer={{ height: 40 }}
    >
      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group justify="space-between">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => setNavbarCollapsed(c => !c)}
              // Mostra sempre o botão de colapso
              display={{ base: 'inline-flex', sm: 'inline-flex' }}
              aria-label="Abrir/fechar menu"
            >
              <IconMenu2 size={28} />
            </ActionIcon>
            <Group>
              <Title order={2}>Setlistify</Title>
            </Group>
          </Group>

          <Group>
            <ActionIcon
              variant="subtle"
              onClick={() => toggleColorScheme()}
              size="lg"
            >
              {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
            </ActionIcon>
            {
              // Botão de login só aparece se não estiver autenticado
              !user && (
                <Button variant="filled" onClick={() => router.push('/login')}>
                  Login
                </Button>
              )
            }
            <Menu shadow="md" width={220} position="bottom-end" withArrow>
              <Menu.Target>
                <Group gap={8} align="center" style={{ cursor: 'pointer' }}>
                  {!isMobile && (
                    <Text size="sm" fw={500}>Olá, {userEmail}</Text>
                  )}
                  <Avatar radius="xl" color="blue" size={isMobile ? 36 : 40} style={{ background: '#fff', color: '#007bff', fontWeight: 700, fontSize: 18 }}>
                    {userEmail[0]?.toUpperCase()}
                  </Avatar>
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <Text size="xs" c="dimmed" truncate>{userEmail}</Text>
                </Menu.Label>
                <Divider my="xs" />
                <Menu.Item leftSection={<IconArrowUpRight size={18} />} onClick={() => {
                  setOpened(true);
                }}>
                  Fazer upgrade do plano
                </Menu.Item>
                <Menu.Item color="red" leftSection={loadingLogout ? <Loader size={18} color="red" /> : <IconLogout size={18} />} onClick={handleLogout} disabled={loadingLogout}>
                  Sair
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <NavLink
            component={Link}
            href="/"
            label="Início"
            leftSection={<IconLayoutDashboard size={18} />}
            active={pathname === "/"}
          />
          <NavLink
            component={Link}
            href="/songs"
            label="Músicas"
            leftSection={<IconMusic size={18} />}
            active={pathname === "/songs" || pathname.startsWith("/songs/")}
          />
          <NavLink
            component={Link}
            href="/setlists"
            label="Setlists"
            leftSection={<IconTable size={18} />}
            active={pathname === "/setlists" || pathname.startsWith("/setlists/")}
          />
          <NavLink
            label="Sair"
            leftSection={<IconLogout size={18} />}
            color="red"
            onClick={handleLogout}
            disabled={loadingLogout}
            style={{ marginTop: 16 }}
          />
        </AppShell.Section>
        <AppShell.Section>
          {!isPro && (
            <NavLink
              label={
                <Group gap={4} align="center">
                  <Text size="xs" fw={600} color="blue.7">Fazer upgrade do plano</Text>
                </Group>
              }
              description={<Text size="xs" c="dimmed">Tenha acesso completo às setlists</Text>}
              leftSection={<IconArrowUpRight size={18} color="#228be6" />}
              onClick={() => {
                setOpened(true);
              }}
              style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}
            />
          )}
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main style={{ marginTop: '16px', marginBottom: '16px' }}>
        {children}
      </AppShell.Main>
      <AppShell.Footer>
        <Group h="100%" px="md" justify="space-between">
          <Text size="sm">&copy; {new Date().getFullYear()} Meu Ensaio</Text>
        </Group>
      </AppShell.Footer>

      <PlansModal opened={opened} onClose={() => setOpened(false)} />
    </AppShell>
  );
}
