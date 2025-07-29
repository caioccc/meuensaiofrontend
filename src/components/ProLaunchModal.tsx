import { Modal, Button, Text, Title, Group, Paper } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconCrown, IconGift } from '@tabler/icons-react';

const MODAL_KEY = 'pro_launch_modal_closed_at';
const MODAL_DELAY_DAYS = 3;

function shouldShowModal() {
  const closedAt = localStorage.getItem(MODAL_KEY);
  if (!closedAt) return true;
  const closedDate = new Date(closedAt);
  const now = new Date();
  const diffDays = (now.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= MODAL_DELAY_DAYS;
}

export default function ProLaunchModal({ opened, onClose }: { opened: boolean, onClose: () => void }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      withCloseButton
      overlayProps={{ opacity: 0.7, blur: 2 }}
      radius="lg"
      padding={0}
      styles={{ body: { padding: 0 } }}
    >
      <Paper className="p-8 rounded-xl shadow-xl !flex flex-col items-center gap-6" radius="lg">
        <Group mb={0} gap={16} align="center" justify="center">
          <IconCrown size={40} color="#fab005" />
          <IconGift size={36} color="#228be6" />
        </Group>
        <Title order={2} className="text-2xl md:text-3xl font-bold text-blue-700 text-center">Ano de Lançamento BeatKey!</Title>
        <Text size="lg" className="text-gray-700 text-center">
          Todos os usuários que se registrarem ganham <span className="font-bold text-blue-700">1 ano de conta PRO</span> grátis! Aproveite todos os recursos premium sem custo.
        </Text>
        <div className="w-full flex justify-center">
          <Button
            size="lg"
            radius="xl"
            color="blue"
            className="px-8 py-2 font-semibold shadow-lg hover:scale-105 transition-all"
            onClick={onClose}
          >
            Quero aproveitar!
          </Button>
        </div>
        <Text size="sm" className="text-gray-500 text-center">Promoção válida para todos os cadastros realizados em nosso primeiro ano de lançamento.</Text>
      </Paper>
    </Modal>
  );
}

export function useProLaunchModal() {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (shouldShowModal()) {
      setOpened(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(MODAL_KEY, new Date().toISOString());
    setOpened(false);
  };

  return { opened, handleClose };
}
