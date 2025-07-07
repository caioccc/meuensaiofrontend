import { useAuth } from "@/contexts/AuthContext";
import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  Text,
  Loader,
  useMantineColorScheme,
  Title,
  Button
} from "@mantine/core";
import { IconLayoutDashboard, IconLogout, IconTable, IconMenu2, IconMusic, IconSun, IconMoon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [navbarCollapsed, setNavbarCollapsed] = useState(true); // Começa collapsed no mobile
  const pathname = usePathname();
  const { logout } = useAuth();
  const [loadingLogout, setLoadingLogout] = useState(false);

  const { isAuthenticated } = useAuth();

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  const handleLogout = () => {
    setLoadingLogout(true);
    setTimeout(() => {
      logout();
      setLoadingLogout(false);
    }, 600); // tempo para mostrar o loading
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: navbarCollapsed } }}
      footer={{ height: 40 }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group justify="space-between">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => setNavbarCollapsed(c => !c)}
              display={{ base: 'inline-flex', sm: 'none' }}
              aria-label="Abrir menu"
            >
              <IconMenu2 size={28} />
            </ActionIcon>
            <Group>
              <IconMusic size={28} color="var(--mantine-color-blue-6)" />
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
              !isAuthenticated && (
                <Button variant="filled" onClick={() => router.push('/login')}>
                  Login
                </Button>
              )
            }
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
        </AppShell.Section>
        <AppShell.Section>
          <ActionIcon
            variant="light"
            color="red"
            style={{ width: "100%", justifyContent: "flex-start" }}
            onClick={handleLogout}
            disabled={loadingLogout}
          >
            {loadingLogout ? <Loader size={18} color="red" /> : <IconLogout size={18} style={{ marginRight: 8 }} />}
            <Text fw={500}>Sair</Text>
          </ActionIcon>
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main style={{ margin: '16px' }}>
        {children}
      </AppShell.Main>
      <AppShell.Footer>
        <Group h="100%" px="md" justify="space-between">
          <Text size="sm">&copy; {new Date().getFullYear()} Meu Ensaio</Text>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
