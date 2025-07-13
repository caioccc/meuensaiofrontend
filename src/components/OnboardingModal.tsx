/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Card, Group, Modal, MultiSelect, Notification, NumberInput, Select, Stack, Stepper, Switch, TextInput, Tooltip, LoadingOverlay, Box } from '@mantine/core';
import { IconAdjustments, IconCheck, IconClock, IconEye, IconGuitarPick, IconMusic, IconStar, IconTarget, IconUser } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import api from '../../lib/axios';
import { showNotification } from '@mantine/notifications';

const GOALS = [
  { value: 'Aprender músicas', label: 'Aprender músicas' },
  { value: 'Criar setlists', label: 'Criar setlists' },
  { value: 'Praticar técnicas', label: 'Praticar técnicas' },
  { value: 'Ensinar', label: 'Ensinar' },
];
const EXPERIENCE = [
  { value: 'Iniciante', label: 'Iniciante' },
  { value: 'Intermediário', label: 'Intermediário' },
  { value: 'Avançado', label: 'Avançado' },
];
const INSTRUMENTS = [
  { value: 'Guitarra', label: 'Guitarra' },
  { value: 'Violão', label: 'Violão' },
  { value: 'Baixo', label: 'Baixo' },
  { value: 'Teclado', label: 'Teclado' },
  { value: 'Vocal', label: 'Vocal' },
];
const GENRES = [
  { value: 'Rock', label: 'Rock' },
  { value: 'Pop', label: 'Pop' },
  { value: 'MPB', label: 'MPB' },
  { value: 'Jazz', label: 'Jazz' },
  { value: 'Sertanejo', label: 'Sertanejo' },
  { value: 'Gospel', label: 'Gospel' },
  { value: 'Funk', label: 'Funk' },
  { value: 'Clássico', label: 'Clássico' },
];
const PRACTICE = [
  { value: 'Ritmo', label: 'Ritmo' },
  { value: 'Acordes', label: 'Acordes' },
  { value: 'Transposições', label: 'Transposições' },
  { value: 'Tempo', label: 'Tempo' },
  { value: 'Pads Contínuos', label: 'Pads Contínuos' },
];

const LOCAL_KEY = 'onboarding_skip';

export default function OnboardingModal({ opened, onClose, onSuccess }: { opened: boolean, onClose: () => void, onSuccess: () => void }) {
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
        title: 'Erro',
        message: 'Não foi possível salvar seu perfil. Tente novamente mais tarde.',
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
    <Modal opened={opened} onClose={onClose} title="Bem-vindo ao Setlistify!" centered size="xl" withCloseButton={false}>
      <Box pos="relative">
        <LoadingOverlay visible={loadingOverlay} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <Stepper active={active} onStepClick={setActive} breakpoint="sm">
            <Stepper.Step label="Bem-vindo" description="Seus objetivos" >
              <Stack gap="12px">
                <MultiSelect
                  label="Quais seus objetivos?"
                  data={GOALS}
                  value={form.goals}
                  onChange={v => handleChange('goals', v)}
                  placeholder="Selecione..."
                  required
                  error={touched.goals && form.goals.length === 0 ? 'Selecione pelo menos um objetivo' : undefined}
                />
                <Select
                  label="Nível de experiência"
                  data={EXPERIENCE}
                  value={form.experience_level}
                  onChange={v => handleChange('experience_level', v)}
                  placeholder="Selecione..."
                  required
                  error={touched.experience_level && !form.experience_level ? 'Selecione o nível de experiência' : undefined}
                />
              </Stack>
            </Stepper.Step>
            <Stepper.Step label="Perfil musical" description="Seu estilo">
              <Stack gap="12px">
                <MultiSelect
                  label={<Tooltip label="Você pode escolher mais de um."><span>Instrumentos</span></Tooltip>}
                  data={INSTRUMENTS}
                  value={form.instrument}
                  onChange={v => handleChange('instrument', v)}
                  placeholder="Selecione..."
                  required
                  error={touched.instrument && form.instrument.length === 0 ? 'Selecione pelo menos um instrumento' : undefined}
                />
                <MultiSelect
                  label="Gêneros preferidos"
                  data={GENRES}
                  value={form.preferred_genres}
                  onChange={v => handleChange('preferred_genres', v)}
                  placeholder="Selecione..."
                  required
                  error={touched.preferred_genres && form.preferred_genres.length === 0 ? 'Selecione pelo menos um gênero' : undefined}
                />
                <TextInput
                  label="Artistas favoritos"
                  value={form.favorite_artists}
                  onChange={e => handleChange('favorite_artists', e.currentTarget.value)}
                  placeholder="Ex: Red Hot Chili Peppers, Djavan"
                />
              </Stack>
            </Stepper.Step>
            <Stepper.Step label="Preferências" description="Como você pratica?">
              <Stack gap="12px">
                <MultiSelect
                  label={<Tooltip label="Transposição ajuda a adaptar músicas para sua voz."><span>Foco de prática</span></Tooltip>}
                  data={PRACTICE}
                  value={form.practice_focus}
                  onChange={v => handleChange('practice_focus', v)}
                  placeholder="Selecione..."
                  required
                  error={touched.practice_focus && form.practice_focus.length === 0 ? 'Selecione pelo menos um foco' : undefined}
                />
                <NumberInput
                  label="BPM padrão"
                  value={form.default_bpm}
                  onChange={v => handleChange('default_bpm', v || 120)}
                  min={40}
                  max={300}
                  required
                  error={touched.default_bpm && !form.default_bpm ? 'Informe o BPM padrão' : undefined}
                />
                <Switch
                  label="Mostrar acordes em tempo real"
                  checked={form.show_chords_in_real_time}
                  onChange={e => handleChange('show_chords_in_real_time', e.currentTarget.checked)}
                />
              </Stack>
            </Stepper.Step>
            <Stepper.Step label="Finalização" description="Confirme">
              <Stack gap="12px">
                <Group grow>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconTarget size={20} /><b>Objetivos</b></Group>
                    <div>{form.goals.length ? form.goals.join(', ') : <span style={{ color: '#adb5bd' }}>Não informado</span>}</div>
                  </Card>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconUser size={20} /><b>Nível</b></Group>
                    <div>{form.experience_level || <span style={{ color: '#adb5bd' }}>Não informado</span>}</div>
                  </Card>
                </Group>
                <Group grow>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconGuitarPick size={20} /><b>Instrumentos</b></Group>
                    <div>{form.instrument.length ? form.instrument.join(', ') : <span style={{ color: '#adb5bd' }}>Não informado</span>}</div>
                  </Card>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconMusic size={20} /><b>Gêneros</b></Group>
                    <div>{form.preferred_genres.length ? form.preferred_genres.join(', ') : <span style={{ color: '#adb5bd' }}>Não informado</span>}</div>
                  </Card>
                </Group>
                <Group grow>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconStar size={20} /><b>Artistas favoritos</b></Group>
                    <div>{form.favorite_artists || <span style={{ color: '#adb5bd' }}>Não informado</span>}</div>
                  </Card>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconAdjustments size={20} /><b>Foco</b></Group>
                    <div>{form.practice_focus.length ? form.practice_focus.join(', ') : <span style={{ color: '#adb5bd' }}>Não informado</span>}</div>
                  </Card>
                </Group>
                <Group grow>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconClock size={20} /><b>BPM padrão</b></Group>
                    <div>{form.default_bpm || <span style={{ color: '#adb5bd' }}>Não informado</span>}</div>
                  </Card>
                  <Card shadow="sm" padding="md" radius="md" withBorder>
                    <Group gap={8}><IconEye size={20} /><b>Mostrar acordes em tempo real</b></Group>
                    <div>{form.show_chords_in_real_time ? 'Sim' : 'Não'}</div>
                  </Card>
                </Group>
                {showSuccess && <Notification color="teal" icon={<IconCheck size={18} />} mt="md">Perfil atualizado com sucesso!</Notification>}
              </Stack>
            </Stepper.Step>
          </Stepper>
          <Group position="apart" mt="md">
            <Group>
              <Button variant="subtle" color="gray" onClick={handleSkip}>Pular agora</Button>
              {active > 0 && <Button variant="default" onClick={handleBack}>Voltar</Button>}
            </Group>
            <Group>
              {active < 3 && <Button onClick={handleNext} disabled={!isStepValid()}>Próximo</Button>}
              {active === 3 && <Button leftIcon={<IconCheck size={16} />} loading={loading} type="submit" color="teal">Concluir</Button>}
            </Group>
          </Group>
        </form>
      </Box>
    </Modal>
  );
}
