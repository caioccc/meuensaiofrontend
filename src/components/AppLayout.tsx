import { useAuth } from "@/contexts/AuthContext";
import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  Text,
  Loader
} from "@mantine/core";
import { IconLayoutDashboard, IconLogout, IconTable, IconMenu2 } from "@tabler/icons-react";
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
        <Group h="100%" px="md" position="apart">
          {/* Botão de menu só no mobile */}
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => setNavbarCollapsed(c => !c)}
            display={{ base: 'inline-flex', sm: 'none' }}
            aria-label="Abrir menu"
          >
            <IconMenu2 size={28} />
          </ActionIcon>
          <Text size="lg" fw={700}>Meu Ensaio</Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <NavLink
            component={Link}
            href="/"
            label="Início"
            icon={<IconLayoutDashboard size={18} />}
            active={pathname === "/"}
          />
          <NavLink
            component={Link}
            href="/setlists"
            label="Setlists"
            icon={<IconTable size={18} />}
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
        <Group h="100%" px="md" position="apart">
          <Text size="sm">&copy; {new Date().getFullYear()} Meu Ensaio</Text>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
