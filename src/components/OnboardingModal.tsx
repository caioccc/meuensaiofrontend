/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Card, Group, Modal, MultiSelect, Notification, NumberInput, Select, Stack, Stepper, Switch, TextInput, Tooltip, LoadingOverlay, Box } from '@mantine/core';
import { IconAdjustments, IconCheck, IconClock, IconEye, IconGuitarPick, IconMusic, IconStar, IconTarget, IconUser } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import { showNotification } from '@mantine/notifications';

const useOnboardingOptions = (t: any) => ({
  GOALS: [
    { value: 'learn_songs', label: t('onboarding.goals.learn_songs', 'Aprender músicas') },
    { value: 'create_setlists', label: t('onboarding.goals.create_setlists', 'Criar setlists') },
    { value: 'practice_techniques', label: t('onboarding.goals.practice_techniques', 'Praticar técnicas') },
    { value: 'teach', label: t('onboarding.goals.teach', 'Ensinar') },
  ],
  EXPERIENCE: [
    { value: 'Iniciante', label: t('onboarding.experience.beginner', 'Iniciante') },
    { value: 'Intermediário', label: t('onboarding.experience.intermediate', 'Intermediário') },
    { value: 'Avançado', label: t('onboarding.experience.advanced', 'Avançado') },
  ],
  INSTRUMENTS: [
    { value: 'guitar', label: t('onboarding.instruments.guitar', 'Guitarra') },
    { value: 'acoustic', label: t('onboarding.instruments.acoustic', 'Violão') },
    { value: 'bass', label: t('onboarding.instruments.bass', 'Baixo') },
    { value: 'keyboard', label: t('onboarding.instruments.keyboard', 'Teclado') },
    { value: 'vocal', label: t('onboarding.instruments.vocal', 'Vocal') },
  ],
  GENRES: [
    { value: 'rock', label: t('onboarding.genres.rock', 'Rock') },
    { value: 'pop', label: t('onboarding.genres.pop', 'Pop') },
    { value: 'mpb', label: t('onboarding.genres.mpb', 'MPB') },
    { value: 'jazz', label: t('onboarding.genres.jazz', 'Jazz') },
    { value: 'sertanejo', label: t('onboarding.genres.sertanejo', 'Sertanejo') },
    { value: 'gospel', label: t('onboarding.genres.gospel', 'Gospel') },
    { value: 'funk', label: t('onboarding.genres.funk', 'Funk') },
    { value: 'classical', label: t('onboarding.genres.classical', 'Clássico') },
  ],
  PRACTICE: [
    { value: 'rhythm', label: t('onboarding.practice.rhythm', 'Ritmo') },
    { value: 'chords', label: t('onboarding.practice.chords', 'Acordes') },
    { value: 'transpositions', label: t('onboarding.practice.transpositions', 'Transposições') },
    { value: 'tempo', label: t('onboarding.practice.tempo', 'Tempo') },
    { value: 'pads', label: t('onboarding.practice.pads', 'Pads Contínuos') },
  ],
});

const LOCAL_KEY = 'onboarding_skip';

export default function OnboardingModal({ opened, onClose, onSuccess }: { opened: boolean, onClose: () => void, onSuccess: () => void }) {
  const { t } = useTranslation();
  const { GOALS, EXPERIENCE, INSTRUMENTS, GENRES, PRACTICE } = useOnboardingOptions(t);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    goals: [],
    experience_level: '',
    instrument: [],
    preferred_genres: [],
    favorite_artists: '',
    practice_focus: [],
    default_bpm: 120,
    show_chords_in_real_time: true,
  });
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});

  useEffect(() => {
    if (opened) {
      setLoadingOverlay(true);
      api.get('/user-profile/').then(res => {
        if (res.data && res.data.length > 0) {
          setForm({ ...form, ...res.data[0] });
        }
      }).finally(() => setLoadingOverlay(false));
    }
    // eslint-disable-next-line
  }, [opened]);

  const isStepValid = () => {
    if (active === 0) {
      return form.goals.length > 0 && !!form.experience_level;
    }
    if (active === 1) {
      return form.instrument.length > 0 && form.preferred_genres.length > 0;
    }
    if (active === 2) {
      return form.practice_focus.length > 0 && !!form.default_bpm;
    }
    return true;
  };

  const handleNext = () => {
    setTouched(t => ({ ...t, ...fieldsForStep(active).reduce((acc, f) => ({ ...acc, [f]: true }), {}) }));
    if (isStepValid()) setActive((c) => (c < 3 ? c + 1 : c));
  };

  const fieldsForStep = (step: number) => {
    if (step === 0) return ['goals', 'experience_level'];
    if (step === 1) return ['instrument', 'preferred_genres'];
    if (step === 2) return ['practice_focus', 'default_bpm'];
    return [];
  };
  const handleBack = () => setActive((c) => (c > 0 ? c - 1 : c));

  const handleChange = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setTouched(t => ({ ...t, [field]: true }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingOverlay(true);
    try {
      await api.post('/user-profile/complete-onboarding/', form);
      setShowSuccess(true);
      localStorage.removeItem(LOCAL_KEY);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      console.log('Erro ao salvar perfil');
      showNotification({
        title: t('onboarding.notification.error_title', 'Erro'),
        message: t('onboarding.notification.error_message', 'Não foi possível salvar seu perfil. Tente novamente mais tarde.'),
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
      setLoadingOverlay(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(LOCAL_KEY, '1');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('onboarding.title', 'Bem-vindo ao BeatKey!')} centered size="xl" withCloseButton={false}>
      <Box pos="relative">
        <LoadingOverlay visible={loadingOverlay} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <Stepper active={active} onStepClick={setActive} breakpoint="sm">
          <Stepper.Step label={t('onboarding.step1.label', 'Bem-vindo')} description={t('onboarding.step1.desc', 'Seus objetivos')} >
              <Stack gap="12px">
                <MultiSelect
                  label={t('onboarding.goals.label', 'Quais seus objetivos?')}
                  data={GOALS}
                  value={form.goals}
                  onChange={v => handleChange('goals', v)}
                  placeholder={t('onboarding.select', 'Selecione...')}
                  required
                  error={touched.goals && form.goals.length === 0 ? t('onboarding.goals.error', 'Selecione pelo menos um objetivo') : undefined}
                />
                <Select
                  label={t('onboarding.experience.label', 'Nível de experiência')}
                  data={EXPERIENCE}
                  value={form.experience_level}
                  onChange={v => handleChange('experience_level', v)}
                  placeholder={t('onboarding.select', 'Selecione...')}
                  required
                  error={touched.experience_level && !form.experience_level ? t('onboarding.experience.error', 'Selecione o nível de experiência') : undefined}
                />
              </Stack>
            </Stepper.Step>
            <Stepper.Step label={t('onboarding.step2.label', 'Perfil musical')} description={t('onboarding.step2.desc', 'Seu estilo')}>
              <Stack gap="12px">
                <MultiSelect
                  label={<Tooltip label={t('onboarding.instruments.tooltip', 'Você pode escolher mais de um.')}><span>{t('onboarding.instruments.label', 'Instrumentos')}</span></Tooltip>}
                  data={INSTRUMENTS}
                  value={form.instrument}
                  onChange={v => handleChange('instrument', v)}
                  placeholder={t('onboarding.select', 'Selecione...')}
                  required
                  error={touched.instrument && form.instrument.length === 0 ? t('onboarding.instruments.error', 'Selecione pelo menos um instrumento') : undefined}
                />
                <MultiSelect
                  label={t('onboarding.genres.label', 'Gêneros preferidos')}
                  data={GENRES}
                  value={form.preferred_genres}
                  onChange={v => handleChange('preferred_genres', v)}
                  placeholder={t('onboarding.select', 'Selecione...')}
                  required
                  error={touched.preferred_genres && form.preferred_genres.length === 0 ? t('onboarding.genres.error', 'Selecione pelo menos um gênero') : undefined}
                />
                <TextInput
                  label={t('onboarding.artists.label', 'Artistas favoritos')}
                  value={form.favorite_artists}
                  onChange={e => handleChange('favorite_artists', e.currentTarget.value)}
                  placeholder={t('onboarding.artists.placeholder', 'Ex: Red Hot Chili Peppers, Djavan')}
                />
              </Stack>
            </Stepper.Step>
            <Stepper.Step label={t('onboarding.step3.label', 'Preferências')} description={t('onboarding.step3.desc', 'Como você pratica?')}>
              <Stack gap="12px">
                <MultiSelect
                  label={<Tooltip label={t('onboarding.practice.tooltip', 'Transposição ajuda a adaptar músicas para sua voz.')}><span>{t('onboarding.practice.label', 'Foco de prática')}</span></Tooltip>}
                  data={PRACTICE}
                  value={form.practice_focus}
                  onChange={v => handleChange('practice_focus', v)}
                  placeholder={t('onboarding.select', 'Selecione...')}
                  required
                  error={touched.practice_focus && form.practice_focus.length === 0 ? t('onboarding.practice.error', 'Selecione pelo menos um foco') : undefined}
                />
                <NumberInput
                  label={t('onboarding.bpm.label', 'BPM padrão')}
                  value={form.default_bpm}
                  onChange={v => handleChange('default_bpm', v || 120)}
                  min={40}
                  max={300}
                  required
                  error={touched.default_bpm && !form.default_bpm ? t('onboarding.bpm.error', 'Informe o BPM padrão') : undefined}
                />
                <Switch
                  label={t('onboarding.chords.label', 'Mostrar acordes em tempo real')}
                  checked={form.show_chords_in_real_time}
                  onChange={e => handleChange('show_chords_in_real_time', e.currentTarget.checked)}
                />
              </Stack>
            </Stepper.Step>
            <Stepper.Step label={t('onboarding.step4.label', 'Finalização')} description={t('onboarding.step4.desc', 'Confirme')}>
              <Stack gap="12px">
                <Group grow>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconTarget size={20} /><b>{t('onboarding.goals.label', 'Objetivos')}</b></Group>
                    <div>{form.goals.length ? form.goals.map(g => t(`onboarding.goals.${g}`, g)).join(', ') : <span style={{ color: '#adb5bd' }}>{t('onboarding.not_informed', 'Não informado')}</span>}</div>
                  </Card>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconUser size={20} /><b>{t('onboarding.experience.label', 'Nível')}</b></Group>
                    <div>{form.experience_level ? t(`onboarding.experience.${form.experience_level}`, form.experience_level) : <span style={{ color: '#adb5bd' }}>{t('onboarding.not_informed', 'Não informado')}</span>}</div>
                  </Card>
                </Group>
                <Group grow>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconGuitarPick size={20} /><b>{t('onboarding.instruments.label', 'Instrumentos')}</b></Group>
                    <div>{form.instrument.length ? form.instrument.map(i => t(`onboarding.instruments.${i}`, i)).join(', ') : <span style={{ color: '#adb5bd' }}>{t('onboarding.not_informed', 'Não informado')}</span>}</div>
                  </Card>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconMusic size={20} /><b>{t('onboarding.genres.label', 'Gêneros')}</b></Group>
                    <div>{form.preferred_genres.length ? form.preferred_genres.map(g => t(`onboarding.genres.${g}`, g)).join(', ') : <span style={{ color: '#adb5bd' }}>{t('onboarding.not_informed', 'Não informado')}</span>}</div>
                  </Card>
                </Group>
                <Group grow>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconStar size={20} /><b>{t('onboarding.artists.label', 'Artistas favoritos')}</b></Group>
                    <div>{form.favorite_artists || <span style={{ color: '#adb5bd' }}>{t('onboarding.not_informed', 'Não informado')}</span>}</div>
                  </Card>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconAdjustments size={20} /><b>{t('onboarding.practice.label', 'Foco')}</b></Group>
                    <div>{form.practice_focus.length ? form.practice_focus.map(p => t(`onboarding.practice.${p}`, p)).join(', ') : <span style={{ color: '#adb5bd' }}>{t('onboarding.not_informed', 'Não informado')}</span>}</div>
                  </Card>
                </Group>
                <Group grow>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconClock size={20} /><b>{t('onboarding.bpm.label', 'BPM padrão')}</b></Group>
                    <div>{form.default_bpm || <span style={{ color: '#adb5bd' }}>{t('onboarding.not_informed', 'Não informado')}</span>}</div>
                  </Card>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconEye size={20} /><b>{t('onboarding.chords.label', 'Mostrar acordes em tempo real')}</b></Group>
                    <div>{form.show_chords_in_real_time ? t('onboarding.yes', 'Sim') : t('onboarding.no', 'Não')}</div>
                  </Card>
                </Group>
                {showSuccess && <Notification color="teal" icon={<IconCheck size={18} />} mt="md">{t('onboarding.notification.success', 'Perfil atualizado com sucesso!')}</Notification>}
              </Stack>
            </Stepper.Step>
          </Stepper>
          <Group position="apart" mt="md">
            <Group>
              <Button variant="subtle" color="gray" onClick={handleSkip}>{t('onboarding.skip', 'Pular agora')}</Button>
              {active > 0 && <Button variant="default" onClick={handleBack}>{t('onboarding.back', 'Voltar')}</Button>}
            </Group>
            <Group>
              {active < 3 && <Button onClick={handleNext} disabled={!isStepValid()}>{t('onboarding.next', 'Próximo')}</Button>}
              {active === 3 && <Button leftIcon={<IconCheck size={16} />} loading={loading} type="submit" color="teal">{t('onboarding.finish', 'Concluir')}</Button>}
            </Group>
          </Group>
        </form>
      </Box>
    </Modal>
  );
}
