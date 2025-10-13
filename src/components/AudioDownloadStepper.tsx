import { Button, Modal, Stack, Stepper, Text } from '@mantine/core';
import { useState } from 'react';
import api from '../../lib/axios';

interface AudioDownloadStepperProps {
  videoUrl: string;
  opened: boolean;
  onClose: () => void;
  onSuccess: (audioUrl: string) => void;
}

export default function AudioDownloadStepper({ videoUrl, opened, onClose, onSuccess }: AudioDownloadStepperProps) {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/youtube-audio/step1-download/', { url: videoUrl });
      setFilePath(res.data.file_path);
      setVideoId(res.data.video_id);
      setActive(1);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Erro ao baixar áudio.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/youtube-audio/step2-upload/', { file_path: filePath, video_id: videoId });
      setAudioUrl(res.data.audio_url);
      setActive(2);
      // Não fechar automaticamente, só chama onSuccess ao fechar
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Erro ao enviar para o Cloudinary.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (audioUrl) {
      onSuccess(audioUrl); // Só envia para o parent ao fechar, garantindo preview
    }
    setActive(0);
    setFilePath(null);
    setVideoId(null);
    setTimeout(() => setAudioUrl(null), 500);
    setError(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Processar Música" centered size="lg">
      <Stepper active={active} onStepClick={setActive} breakpoint="sm">
        <Stepper.Step label="Download" description="Baixar do YouTube">
          <Stack align="center" gap={16}>
            <Text>Baixar áudio do YouTube</Text>
            {error && <Text c="red">{error}</Text>}
            <Button onClick={handleDownload} loading={loading} disabled={!!filePath}>Baixar</Button>
          </Stack>
        </Stepper.Step>
        <Stepper.Step label="Upload" description="Enviar para repositório">
          <Stack align="center" gap={16}>
            <Text>Enviar áudio para o repositório do usuário</Text>
            {error && <Text c="red">{error}</Text>}
            <Button onClick={handleUpload} loading={loading} disabled={!filePath || !!audioUrl}>Enviar</Button>
          </Stack>
        </Stepper.Step>
        <Stepper.Step label="Finalizado" description="Pré-visualizar">
          <Stack align="center" gap={16}>
            <Text>Áudio enviado com sucesso!</Text>
            {audioUrl && <audio src={audioUrl} controls style={{ width: '100%' }} />}
            <Button onClick={handleClose}>Fechar</Button>
          </Stack>
        </Stepper.Step>
      </Stepper>
    </Modal>
  );
}
