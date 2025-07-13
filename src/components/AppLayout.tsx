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
  Tooltip,
  useMantineColorScheme
} from "@mantine/core";
import { useMediaQuery } from '@mantine/hooks';
import { IconAlertCircle, IconArrowUpRight, IconLayoutDashboard, IconLogout, IconMenu2, IconMoon, IconMusic, IconSun, IconTable, IconTrophy, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import api from '../../lib/axios';
import OnboardingModal from "./OnboardingModal";
import PlansModal from "./PlansModal";


interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { user, isPro, subscription } = useAuth();
  const userEmail = user?.email || 'usuario@email.com';
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [navbarCollapsed, setNavbarCollapsed] = useState(false); // Começa aberto no desktop
  const pathname = usePathname();
  const { logout } = useAuth();
  const [loadingLogout, setLoadingLogout] = useState(false);

  const [opened, setOpened] = useState(false); // Modal de planos

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  useEffect(() => {
    if (user) {
      const skip = typeof window !== 'undefined' && localStorage.getItem('onboarding_skip');
      api.get('/user-profile/onboarding-status/')
        .then(res => {
          if (res.data && res.data.onboarded === false) {
            setOnboarded(false);
            if (!skip) setOnboardingOpen(true);
          } else {
            setOnboarded(true);
          }
        });
    }
  }, [user]);

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
            <Tooltip label="Mudar tema" position="bottom" withArrow>
              <ActionIcon
                variant="subtle"
                onClick={() => toggleColorScheme()}
                size="lg"
              >
                {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
              </ActionIcon>
            </Tooltip>
            {user && !onboarded && (
              <Tooltip label="Complete seu onboarding para personalizar sua experiência" position="bottom" withArrow>
                <ActionIcon
                  variant="light"
                  color="yellow"
                  size="lg"
                  onClick={() => setOnboardingOpen(true)}
                  title="Complete seu onboarding para personalizar sua experiência"
                  style={{ marginLeft: 4 }}
                >
                  <IconAlertCircle size={20} />
                </ActionIcon>
              </Tooltip>
            )}
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
                    <>
                      <Text size="sm" fw={500}>Olá, {userEmail}</Text>
                      {subscription && (
                        <Text size="xs" fw={700} px={8} py={2} style={{
                          background: isPro ? '#228be6' : '#fab005',
                          color: isPro ? '#fff' : '#232b3a',
                          borderRadius: 8,
                          marginLeft: 8,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}>
                          {isPro ? 'PRO' : (subscription.plan?.name || 'Gratuito')}
                        </Text>
                      )}
                      {!subscription && (
                        <Text size="xs" fw={700} px={8} py={2} style={{
                          background: '#adb5bd', color: '#fff', borderRadius: 8, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5
                        }}>Gratuito</Text>
                      )}
                    </>
                  )}
                  <Avatar radius="xl" color="blue" size={isMobile ? 36 : 40} style={{ background: '#fff', color: '#007bff', fontWeight: 700, fontSize: 18, position: 'relative' }}>
                    {userEmail[0]?.toUpperCase()}
                    {!onboarded && null}
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
                <Menu.Item leftSection={<IconAlertCircle size={18} color={!onboarded ? "#fab005": '#000'} />} onClick={() => setOnboardingOpen(true)}>
                  {!onboarded ? 'Completar onboarding' : 'Meu onboarding'}
                </Menu.Item>
                <Menu.Item leftSection={<IconUser size={18} />} onClick={() => router.push('/profile')}>
                  Meu Perfil
                </Menu.Item>
                <Menu.Item leftSection={<IconTrophy size={18} />} onClick={() => router.push('/achievements')}>
                  Minhas Conquistas
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
            component={Link}
            href="/achievements"
            label="Conquistas"
            leftSection={<IconTrophy size={18} />}
            active={pathname === "/achievements"}
          />
          <NavLink
            component={Link}
            href="/profile"
            label="Meu Perfil"
            leftSection={<IconUser size={18} />}
            active={pathname === "/profile"}
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
          <Text size="sm">&copy; {new Date().getFullYear()} Setlistify</Text>
        </Group>
      </AppShell.Footer>

      <PlansModal opened={opened} onClose={() => setOpened(false)} />

      {/* Modal de Onboarding */}
      <OnboardingModal
        opened={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onSuccess={() => setOnboarded(true)}
      />
    </AppShell>
  );
}
