/* eslint-disable @typescript-eslint/no-explicit-any */
import LandingLayout from '@/components/LandingLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Rating,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title
} from '@mantine/core';
import {
  IconArrowRight,
  IconBrandYoutube,
  IconCheck,
  IconCrown,
  IconGauge,
  IconHistory,
  IconMail,
  IconMapPin,
  IconMusic,
  IconMusicStar,
  IconPlayerPlay,
  IconPlaylist,
  IconRocket,
  IconSparkles,
  IconStar,
  IconTrendingUp,
  IconUsers
} from '@tabler/icons-react';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LandingPage: React.FC = () => {
  const [showBg, setShowBg] = React.useState(true);

  React.useEffect(() => {
    // Função para checar largura da tela
    const checkWidth = () => {
      setShowBg(window.innerWidth > 1110);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);
  const { t } = useTranslation();
  const { refreshUser, user } = useAuth();
  const router = useRouter();

  const features = [
    {
      icon: IconBrandYoutube,
      title: 'features.autoExtraction.title',
      description: 'features.autoExtraction.desc',
      color: 'red',
    },
    {
      icon: IconGauge,
      title: 'features.bpmDetection.title',
      description: 'features.bpmDetection.desc',
      color: 'blue',
    },
    {
      icon: IconMusicStar,
      title: 'features.chordDetection.title',
      description: 'features.chordDetection.desc',
      color: 'green',
    },
    {
      icon: IconPlaylist,
      title: 'features.smartSetlists.title',
      description: 'features.smartSetlists.desc',
      color: 'dark'
    },
    {
      icon: IconPlayerPlay,
      title: 'features.learningPlayer.title',
      description: 'features.learningPlayer.desc',
      color: 'orange',
    },
    {
      icon: IconHistory,
      title: 'features.musicHistory.title',
      description: 'features.musicHistory.desc',
      color: 'teal',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      icon: IconBrandYoutube,
      title: 'howItWorks.step1.title',
      description: 'howItWorks.step1.desc',
      image: '/mockups/1.svg'
    },
    {
      step: 2,
      icon: IconSparkles,
      title: 'howItWorks.step2.title',
      description: 'howItWorks.step2.desc',
      image: '/mockups/2.svg'
    },
    {
      step: 3,
      icon: IconRocket,
      title: 'howItWorks.step3.title',
      description: 'howItWorks.step3.desc',
      image: '/mockups/3.svg'
    },
    {
      step: 4,
      icon: IconSparkles,
      title: 'howItWorks.step4.title',
      description: 'howItWorks.step4.desc',
      image: '/mockups/4.svg'
    }
  ];

  const testimonials = [
    {
      name: 'testimonials.user1.name',
      role: 'testimonials.user1.role',
      text: 'testimonials.user1.text',
      rating: 5,
      avatar: '🎸',
    },
    {
      name: 'testimonials.user2.name',
      role: 'testimonials.user2.role',
      text: 'testimonials.user2.text',
      rating: 5,
      avatar: '🎹',
    },
    {
      name: 'testimonials.user3.name',
      role: 'testimonials.user3.role',
      text: 'testimonials.user3.text',
      rating: 5,
      avatar: '🥁',
    },
  ];

  const stats = [
    {
      value: '10K+',
      label: 'stats.songs',
      icon: IconMusic,
    },
    {
      value: '2K+',
      label: 'stats.users',
      icon: IconUsers,
    },
    {
      value: '5K+',
      label: 'stats.setlists',
      icon: IconPlaylist,
    },
    {
      value: '99%',
      label: 'stats.accuracy',
      icon: IconTrendingUp,
    },
  ];

  const plans = [
    {
      name: 'pricing.free.name',
      price: 'pricing.free.price',
      originalPrice: null,
      features: 'pricing.free.features',
      highlight: false,
      badge: null,
      cta: 'pricing.free.cta',
      disabled: true,
      description: 'pricing.free.description',
    },
    {
      name: 'pricing.pro.name',
      price: 'pricing.pro.price',
      originalPrice: null,
      features: 'pricing.pro.features',
      highlight: true,
      badge: 'pricing.recommended',
      cta: 'pricing.pro.cta',
      disabled: false,
      description: 'pricing.pro.description',
    },
    {
      name: 'pricing.pro_annual.name',
      price: 'pricing.pro_annual.price',
      originalPrice: 'pricing.pro_annual.originalPrice',
      features: 'pricing.pro_annual.features',
      highlight: false,
      badge: 'pricing.save',
      cta: 'pricing.pro_annual.cta',
      disabled: false,
      description: 'pricing.pro_annual.description',
    },
  ];

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <LandingLayout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#fff]" id="hero">
        {/* Background só aparece se a tela for maior que 1110px */}
        <div className="absolute inset-0 z-0">
          {showBg ? (
            <img
              src="/background_mobiles.svg"
              alt="Celulares BeatKey"
              className="object-cover w-full h-full"
              style={{ objectPosition: 'right' }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#e9ecef] to-[#fff]"></div>
          )}
        </div>
        <Container size="xl" className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-start h-full">
          {showBg ? (
            <div className="w-full lg:w-1/3 flex flex-col items-center xl:items-start justify-center md:pl-8 py-20 md:py-0 gap-4">
              <Title
                order={1}
                className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight text-center lg:text-left"
                style={{ color: '#171717' }}
              >
                {t('hero.title')}
              </Title>

              <Text
                size="xl"
                className="text-lg md:text-xl lg:text-2xl mb-6 max-w-3xl leading-relaxed text-center lg:text-left"
                style={{ color: '#23272a' }}
              >
                {t('hero.subtitle')}
              </Text>

              <Group justify="center" xl-justify="start" gap="md" className="mb-16 mt-2 w-full">
                <Button
                  style={{ background: '#0082ff', color: '#fff', fontWeight: 600 }}
                  size="xl"
                  radius="xl"
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  rightSection={<IconArrowRight size={20} />}
                >
                  {t('hero.cta')}
                </Button>
              </Group>

              {/* Stats */}
              {/* <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl" className="max-w-2xl">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-left">
                  <div className="flex mb-2">
                    <ThemeIcon size={40} radius="xl" style={{ background: '#0082ff22', color: '#0082ff' }}>
                      <stat.icon size={20} />
                    </ThemeIcon>
                  </div>
                  <Text className="text-2xl font-bold" style={{ color: '#171717' }}>{stat.value}</Text>
                  <Text className="text-sm" style={{ color: '#495057' }}>{t(stat.label)}</Text>
                </div>
              ))}
            </SimpleGrid> */}
            </div>
          ) : (
            //texts center
            <div className="w-full flex flex-col items-center justify-center gap-4 py-20">
              <Title
                order={1}
                className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight text-center"
                style={{ color: '#171717' }}
              >
                {t('hero.title')}
              </Title>

              <Text
                size="xl"
                className="text-lg md:text-xl lg:text-2xl mb-6 max-w-3xl leading-relaxed text-center"
                style={{ color: '#23272a' }}
              >
                {t('hero.subtitle')}
              </Text>

              <Group justify="center" gap="md" className="mb-16 mt-2 w-full">
                <Button
                  style={{ background: '#0082ff', color: '#fff', fontWeight: 600 }}
                  size="xl"
                  radius="xl"
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  rightSection={<IconArrowRight size={20} />}
                >
                  {t('hero.cta')}
                </Button>
              </Group>
            </div>
          )}

        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50" id='features'>
        <Container size="xl">
          <div className="flex flex-col justify-center items-center text-center mb-16 gap-2">
            <Badge size="lg" variant="light" color="blue" className="mb-4">
              {t('features.badge')}
            </Badge>
            <Title order={2} className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('features.title')}
            </Title>
            <Text className="text-lg max-w-2xl mx-auto place-self-center"
              style={{ color: '#23272a' }}
            >
              {t('features.description')}
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  shadow="md"
                  padding="xl"
                  radius="lg"
                  className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0"
                >
                  <div className="text-center">
                    <ThemeIcon
                      size={60}
                      radius="xl"
                      variant="gradient"
                      gradient={{ from: feature.color, to: `${feature.color}.6` }}
                      className="mx-auto mb-4"
                    >
                      <Icon size={30} />
                    </ThemeIcon>
                    <Title order={3} className="text-xl font-bold mb-3 text-gray-900">
                      {t(feature.title)}
                    </Title>
                    <Text className="text-gray-600 leading-relaxed">
                      {t(feature.description)}
                    </Text>
                  </div>
                </Card>
              );
            })}
          </SimpleGrid>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <Container size="xl">
          <div className="flex flex-col text-center mb-16 justify-center items-center text-center gap-2">
            <Badge size="lg" variant="light" color="blue" className="mb-4">
              {t('howItWorks.badge')}
            </Badge>
            <Title order={2} className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('howItWorks.title')}
            </Title>
            <Text className="text-lg text-gray-600 max-w-2xl mx-auto place-self-center">
              {t('howItWorks.description')}
            </Text>
          </div>

          <div className="max-w-6xl mx-auto space-y-20">
            {howItWorks.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={idx}
                  className={`flex flex-col-reverse lg:flex-row ${!isEven ? 'lg:flex-row-reverse' : ''
                    } items-center gap-10`}
                >
                  {/* Text Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="mb-4">
                      <Badge variant="gradient" gradient={{ from: 'blue', to: 'blue' }} size="lg">
                        {t(`howItWorks.step${idx + 1}.badge`)}
                      </Badge>
                    </div>
                    <Title order={3} className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                      {t(`howItWorks.step${idx + 1}.title`)}
                    </Title>
                    <Text className="text-gray-600 text-lg">{t(`howItWorks.step${idx + 1}.description`)}</Text>
                  </div>

                  {/* Image / Mockup */}
                  <div className="flex-1">
                    <img
                      src={step.image}
                      alt={t(`howItWorks.step${idx + 1}.title`)}
                      className="w-full max-w-md mx-auto"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <Container size="xl">
          <div className="text-center mb-16">
            <Badge size="lg" variant="light" color="green" className="mb-4">
              {t('testimonials.badge')}
            </Badge>
            <Title order={2} className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('testimonials.title')}
            </Title>
            <Text className="text-lg text-gray-600 max-w-2xl mx-auto place-self-center">
              {t('testimonials.description')}
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
            {testimonials.map((testimonial, idx) => (
              <Card
                key={idx}
                shadow="md"
                padding="xl"
                radius="lg"
                className="hover:shadow-xl transition-all duration-300"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Text className="text-2xl">{testimonial.avatar}</Text>
                  </div>
                  <Rating value={testimonial.rating} readOnly size="sm" className="mb-2 place-self-center" />
                  <Text className="text-gray-600 italic leading-relaxed mb-4">
                    "{t(testimonial.text)}"
                  </Text>
                  <Text className="font-semibold text-gray-900">{t(testimonial.name)}</Text>
                  <Text className="text-sm text-gray-500">{t(testimonial.role)}</Text>
                </div>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white" id="pricing">
        <Container size="xl">
          <div className="text-center mb-16">
            <Badge size="lg" variant="light" color="orange" className="mb-4">
              {t('pricing.badge')}
            </Badge>
            <Title order={2} className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('pricing.title')}
            </Title>
            <Text className="text-lg text-gray-600 max-w-2xl mx-auto place-self-center">
              {t('pricing.description')}
            </Text>
          </div>

          <div className="max-w-5xl mx-auto">
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
              {plans.map((plan, idx) => {
                const features = t(plan.features, { returnObjects: true });
                return (
                  <Card
                    key={idx}
                    shadow={plan.highlight ? "xl" : "md"}
                    padding="xl"
                    radius="lg"
                    className={`relative transition-all duration-300 transform hover:scale-105 ${plan.highlight ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-purple-50' : ''
                      }`}
                  >
                    <div className="text-center mb-6">
                      {plan.badge && (
                        <Badge
                          size="lg"
                          variant="gradient"
                          gradient={{ from: 'blue', to: 'purple' }}
                          className="mb-2"
                        >
                          {t(plan.badge)}
                        </Badge>
                      )}
                      <div className="mb-4">
                        {plan.highlight ? (
                          <IconCrown size={40} className="mx-auto text-yellow-500" />
                        ) : (
                          <IconStar size={36} className="mx-auto text-gray-400" />
                        )}
                      </div>
                      <Title order={3} className="text-xl font-bold mb-2 text-gray-900">
                        {t(plan.name)}
                      </Title>
                      <Text className="text-gray-600 mb-4">
                        {t(plan.description)}
                      </Text>
                      <div className="mb-4">
                        <Text className="text-3xl font-bold text-gray-900">
                          {t(plan.price)}
                        </Text>
                        {plan.originalPrice && (
                          <Text className="text-lg text-gray-500 line-through">
                            {t(plan.originalPrice)}
                          </Text>
                        )}
                      </div>
                    </div>

                    <Stack gap="sm" className="mb-6">
                      {Array.isArray(features) && features.map((feature, i) => (
                        <Group key={i} gap="xs" align="center" className="text-sm">
                          <IconCheck size={16} className="text-green-500 flex-shrink-0" />
                          <Text className="text-gray-700">{feature}</Text>
                        </Group>
                      ))}
                    </Stack>

                    <Button
                      fullWidth
                      variant={plan.highlight ? "gradient" : "outline"}
                      gradient={plan.highlight ? { from: 'blue', to: 'blue' } : undefined}
                      size="lg"
                      onClick={() => router.push('/register')}
                      radius="lg"
                      disabled={plan.disabled}
                      className={`font-semibold ${plan.highlight ? 'shadow-lg' : ''}`}
                    >
                      {t(plan.cta)}
                    </Button>
                  </Card>
                );
              })}
            </SimpleGrid>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white">
        <Container size="xl">
          <div className="text-center max-w-4xl mx-auto flex flex-col items-center justify-center gap-4">
            <Title order={2} className="text-3xl md:text-4xl font-bold mb-6">
              {t('cta.title')}
            </Title>
            <Text className="text-lg mb-8 text-gray-300">
              {t('cta.description')}
            </Text>
            <Group justify="center" gap="md" mt={20}>
              <Button
                variant="white"
                color="dark"
                size="xl"
                onClick={() => router.push('/login')}
                radius="xl"
                className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                rightSection={<IconArrowRight size={20} />}
              >
                {t('cta.button')}
              </Button>
            </Group>
          </div>
        </Container>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <Container size="xl">
          <div className="text-center mb-16">
            <Badge size="lg" variant="light" color="teal" className="mb-4">
              {t('contact.badge')}
            </Badge>
            <Title order={2} className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('contact.title')}
            </Title>
            <Text className="text-lg text-gray-600 max-w-2xl mx-auto place-self-center">
              {t('contact.description')}
            </Text>
          </div>

          <div className="max-w-4xl mx-auto">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <div>
                <Title order={3} className="text-xl font-bold mb-6 text-gray-900">
                  {t('contact.info.title')}
                </Title>
                <Stack gap={20}>
                  <Group mt={10}>
                    <ThemeIcon size={40} radius="xl" variant="light" color="blue">
                      <IconMail size={20} />
                    </ThemeIcon>
                    <div>
                      <Text className="font-semibold text-gray-900">Email</Text>
                      <Text className="text-gray-600">app.noreply.ai.model@gmail.com</Text>
                    </div>
                  </Group>
                  <Group>
                    <ThemeIcon size={40} radius="xl" variant="light">
                      <IconMapPin size={20} />
                    </ThemeIcon>
                    <div>
                      <Text className="font-semibold text-gray-900">{t('contact.info.location')}</Text>
                      <Text className="text-gray-600">Campina Grande, PB</Text>
                    </div>
                  </Group>
                </Stack>
              </div>

              <Card shadow="md" padding="xl" radius="lg">
                <Title order={3} className="text-xl font-bold mb-6 text-gray-900">
                  {t('contact.form.title')}
                </Title>
                <Stack gap="md">
                  <TextInput
                    label={t('contact.form.name')}
                    placeholder={t('contact.form.namePlaceholder')}
                    required
                  />
                  <TextInput
                    label={t('contact.form.email')}
                    placeholder={t('contact.form.emailPlaceholder')}
                    type="email"
                    required
                  />
                  <Textarea
                    label={t('contact.form.message')}
                    placeholder={t('contact.form.messagePlaceholder')}
                    minRows={4}
                    required
                  />
                  <Button
                    size="lg"
                    radius="lg"
                    className="font-semibold"
                  >
                    {t('contact.form.submit')}
                  </Button>
                </Stack>
              </Card>
            </SimpleGrid>
          </div>
        </Container>
      </section>
    </LandingLayout>
  );
};

export default LandingPage;