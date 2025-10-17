
import classes from '@/components/Navbar/HeaderMenu.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, Burger, Button, Container, Group, Text, Title } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { IconMusic } from '@tabler/icons-react';
import Head from 'next/head';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure(false);
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const isMobile = useMediaQuery('(max-width: 768px)');

  const links = [
    { link: '#hero', label: 'header.home' },
    { link: '#features', label: 'header.features' },
    { link: '#pricing', label: 'header.pricing' },
    { link: '/blog', label: 'header.blog' },
    { link: '#contact', label: 'header.contact' },
    { link: '/tone', label: 'Afinação e Tom' },
  ];

  const handleNavClick = (href: string) => {
    close();
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(href);
    }
  };

  const items = links.map((link) => {
    return (
      <a
        key={link.label}
        href={link.link}
        className={classes.link}
        onClick={() => handleNavClick(link.link)}
      >
        {t(link.label)}
      </a>
    );
  });





  return (
    <>
      <Head>
        <title>{t('seo.title', 'BeatKey - Organize suas músicas e setlists')}</title>
        <meta name="description" content={t('seo.description', 'Plataforma moderna para músicos: organize músicas, setlists, exporte PDFs, acesse pads e cifras avançadas.')} />
        <meta name="keywords" content={t('seo.keywords', 'músicas, setlists, cifras, pads, PDF, ensaio, banda, músicos')} />
        <meta property="og:title" content={t('seo.ogTitle', 'BeatKey - Organize suas músicas e setlists')} />
        <meta property="og:description" content={t('seo.ogDescription', 'Plataforma moderna para músicos: organize músicas, setlists, exporte PDFs, acesse pads e cifras avançadas.')} />
        <meta property="og:image" content="/android-chrome-512x512.png" />
        <meta property="og:type" content="website" />
        {/* hreflang para SEO multi-idioma */}
        <link rel="alternate" href="https://beatkey.tech/" hreflang="pt-BR" />
        <link rel="alternate" href="https://beatkey.tech/en" hreflang="en" />
        <link rel="alternate" href="https://beatkey.tech/es" hreflang="es" />
        <link rel="alternate" href="https://app.beatkey.tech/" hreflang="pt-BR" />
        <link rel="alternate" href="https://app.beatkey.tech/en" hreflang="en" />
        <link rel="alternate" href="https://app.beatkey.tech/es" hreflang="es" />
        <link rel="alternate" href="https://meuensaiofrontend.vercel.app/" hreflang="pt-BR" />
        <link rel="alternate" href="https://meuensaiofrontend.vercel.app/en" hreflang="en" />
        <link rel="alternate" href="https://meuensaiofrontend.vercel.app/es" hreflang="es" />

        <script async src={`https://www.googletagmanager.com/gtag/js?id=G-X9GV1H74E5`}></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-X9GV1H74E5');
      `,
          }}
        />

        {/* Dados estruturados JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": t('seo.title', 'BeatKey - Organize suas músicas e setlists'),
            "url": [
              "https://beatkey.tech/",
              "https://app.beatkey.tech/",
              "https://meuensaiofrontend.vercel.app/"
            ],
            "description": t('seo.description', 'Plataforma moderna para músicos: organize músicas, setlists, exporte PDFs, acesse pads e cifras avançadas.'),
            "inLanguage": "pt-BR",
            "potentialAction": [
              {
                "@type": "SearchAction",
                "target": "https://beatkey.tech/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              {
                "@type": "SearchAction",
                "target": "https://app.beatkey.tech/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              {
                "@type": "SearchAction",
                "target": "https://meuensaiofrontend.vercel.app/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            ],
            "sameAs": [
              "https://www.facebook.com/beatkeyapp",
              "https://www.instagram.com/beatkeyapp",
              "https://beatkey.tech/sitemap.xml",
              "https://app.beatkey.tech/sitemap.xml",
              "https://meuensaiofrontend.vercel.app/sitemap.xml"
            ]
          })
        }} />
      </Head>
      <AppShell
        header={{ height: 55 }}
        footer={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header>
          <header className={classes.header}>
            <Container size="md">
              <div className={classes.inner}>
                <Group>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0082ff] rounded-lg flex items-center justify-center">
                      <IconMusic size={20} className="text-white" />
                    </div>
                    <Title order={2} className="text-xl font-bold text-[#0082ff]">
                      {t('appLayout.title', 'BeatKey')}
                    </Title>
                  </div>
                </Group>
                <Group gap={5} visibleFrom="sm">
                  {items}
                </Group>
                {
                  !isMobile && (
                    <LanguageSwitcher size='sm' />
                  )
                }
                {
                  !user && !isMobile && (
                    <Button
                      variant="filled"
                      style={{ background: '#0082ff', color: '#fff', fontWeight: 600 }}
                      onClick={() => router.push('/login')}
                    >
                      {t('header.login', 'Login')}
                    </Button>
                  )
                }
                {
                  user && !isMobile && (
                    <Button
                      variant="filled"
                      style={{ background: '#495057', color: '#fff', fontWeight: 600 }}
                      onClick={() => router.push('/dashboard')}
                    >
                      {t('enter', 'Entrar')}
                    </Button>
                  )
                }
                <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
              </div>
            </Container>
          </header>
        </AppShell.Header>
        <AppShell.Main style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 55, minHeight: 'calc(100vh - 55px - 60px)' }}>
          {children}
        </AppShell.Main>
        <AppShell.Footer>
          <Container size="lg" py={16}>
            <Group justify="space-between">
              <Text size="sm" color="dimmed">© {new Date().getFullYear()} BeatKey. Todos os direitos reservados.</Text>
              <Text size="sm" color="dimmed">Feito com <span className="text-[#FF6B6B]">♥</span> por BeatKey</Text>
            </Group>
          </Container>
        </AppShell.Footer>
      </AppShell>

    </>
  );
}
