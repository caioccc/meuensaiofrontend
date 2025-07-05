import { ListView } from '@/components/ListView';
import { GalleryView } from '@/components/GalleryView';
import ImportGuestsModal from '@/components/ImportGuestsModal';
import { guests_create, guests_delete, guests_download_model, guests_export, guests_import, guests_list, guests_update } from '@/services/guests';
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Menu,
  Modal,
  rem,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineTheme,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBrandWhatsapp, IconCards, IconDotsVertical, IconDownload, IconEdit, IconFileTypePdf, IconLayoutGrid, IconList, IconMail, IconPlus, IconTrash, IconUpload, IconUser } from '@tabler/icons-react';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useRef, useState } from 'react';

import { Pagination, SegmentedControl } from '@mantine/core';


interface Guest {
  id: number;
  name: string;
  phone: string;
  whatsapp: string; // agora é string (número)
  email: string;
  alergias?: string;
  acompanhantes?: number;
  observacoes?: string;
}

function validateEmail(email: string) {
  return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
}

export default function GuestTable() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'name', direction: 'asc' });
  const [search, setSearch] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const theme = useMantineTheme();

  const form = useForm({
    initialValues: {
      name: '',
      phone: '',
      hasWhatsapp: false,
      whatsapp: '',
      email: '',
      alergias: '',
      acompanhantes: '',
      observacoes: '',
    },
    validate: {
      name: value => value.trim() ? null : 'Nome obrigatório',
      phone: value => value.replace(/\D/g, '').length >= 10 ? null : 'Telefone inválido',
      whatsapp: (value, values) => values.hasWhatsapp && value.replace(/\D/g, '').length < 10 ? 'WhatsApp inválido' : null,
      email: value => value === '' || validateEmail(value) ? null : 'Email inválido',
      acompanhantes: value => value === '' || (!isNaN(Number(value)) && Number(value) >= 0) ? null : 'Acompanhantes inválido',
    },
  });

  // Busca convidados do backend conforme paginação, busca e ordenação
  useEffect(() => {
    async function fetchGuests() {
      setLoading(true);
      try {
        const ordering = sortStatus.columnAccessor
          ? `${sortStatus.direction === 'desc' ? '-' : ''}${sortStatus.columnAccessor}`
          : '';
        const data = await guests_list({
          page,
          page_size: recordsPerPage,
          search,
          ordering,
        });
        setGuests(data.results || []);
        setTotalRecords(data.count || 0);
      } finally {
        setLoading(false);
      }
    }
    fetchGuests();
  }, [page, recordsPerPage, search, sortStatus]);

  function handleAdd() {
    setEditing(null);
    form.setValues({ name: '', phone: '', hasWhatsapp: false, whatsapp: '', email: '', alergias: '', acompanhantes: '', observacoes: '' });
    setModalOpen(true);
  }

  function handleEdit(guest: Guest) {
    setEditing(guest);
    form.setValues({
      name: guest.name,
      phone: guest.phone,
      hasWhatsapp: !!guest.whatsapp,
      whatsapp: guest.whatsapp || '',
      email: guest.email,
      alergias: guest.alergias || '',
      acompanhantes: guest.acompanhantes?.toString() || '',
      observacoes: guest.observacoes || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(values: typeof form.values) {
    const payload = {
      name: values.name,
      phone: values.phone,
      whatsapp: values.hasWhatsapp ? values.whatsapp : '',
      email: values.email,
      alergias: values.alergias,
      acompanhantes: values.acompanhantes === '' ? null : Number(values.acompanhantes),
      observacoes: values.observacoes,
    };
    if (editing) {
      const updated = await guests_update(editing.id, payload);
      setGuests(guests => guests.map(g => g.id === editing.id ? updated : g));
    } else {
      const created = await guests_create(payload);
      setGuests(guests => [...guests, created]);
    }
    setModalOpen(false);
    form.reset();
  }

  async function handleDelete(id: number) {
    await guests_delete(id);
    setGuests(guests => guests.filter(g => g.id !== id));
  }

  // Exportar convidados
  async function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    setExporting(format);
    try {
      const ordering = sortStatus.columnAccessor
        ? `${sortStatus.direction === 'desc' ? '-' : ''}${sortStatus.columnAccessor}`
        : '';
      // const res = await guests_export(format, { search, ordering });
      const res = await guests_export(format);
      let filename = `convidados.${format}`;
      if (format === 'xlsx') filename = 'convidados.xlsx';
      if (format === 'pdf') filename = 'convidados.pdf';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notifications.show({ color: 'green', message: `Exportação ${format.toUpperCase()} concluída!` });
    } catch {
      notifications.show({ color: 'red', message: 'Erro ao exportar convidados.' });
    } finally {
      setExporting(null);
    }
  }

  return (
    <Stack spacing="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>Meus Convidados</Title>
      </Group>
      <Group mb="md" align="end" justify="end">
        <Group>
          <Button leftSection={<IconPlus size={18} />} onClick={handleAdd} variant="filled" color="blue">
            Adicionar convidado
          </Button>
          <Menu shadow="md" width={220} position="bottom-end">
            <Menu.Target>
              <Button variant="light" px={8} style={{ minWidth: 44 }}>
                <IconDotsVertical size={22} />
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconDownload size={18} />}
                onClick={() => setImportModalOpen(true)}
              >
                Baixar modelo de planilha
              </Menu.Item>
              <Menu.Item
                leftSection={<IconUpload size={18} />}
                onClick={() => setImportModalOpen(true)}
              >
                Importar convidados
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFileTypePdf size={18} />}
                onClick={() => handleExport('pdf')}
                loading={exporting === 'pdf'}
              >
                Exportar PDF
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      {/* Busca global */}
      <TextInput
        placeholder="Buscar por nome, e-mail, telefone..."
        value={search}
        onChange={e => { setSearch(e.currentTarget.value); setPage(1); }}
        mb={-8}
        style={{ maxWidth: 320 }}
      />
      <Group justify="flex-end">
        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          data={[
            { value: 'table', label: <IconList size={16} /> },
            { value: 'cards', label: <IconCards size={16} /> },
            { value: 'gallery', label: <IconLayoutGrid size={16} /> },
          ]}
        />
      </Group>
      {viewMode === 'table' && (
        <DataTable
          withBorder
          borderRadius="md"
          highlightOnHover
          verticalSpacing="sm"
          horizontalSpacing="md"
          minHeight={200}
          noRecordsText="Nenhum convidado cadastrado."
          columns={[
            { accessor: 'name', title: 'Nome', width: 140, sortable: true },
            { accessor: 'phone', title: 'Telefone', width: 110, sortable: true },
            { accessor: 'whatsapp', title: 'WhatsApp', width: 110, render: g => g.whatsapp ? g.whatsapp : '-', textAlign: 'center', sortable: true },
            { accessor: 'email', title: 'Email', width: 160, sortable: true },
            { accessor: 'acompanhantes', title: 'Acompanhantes', width: 80, render: g => g.acompanhantes ?? '-', sortable: true },
            {
              accessor: 'actions',
              title: '',
              width: 130,
              render: (g: Guest) => (
                <Group gap={4}>
                  {g.whatsapp && (
                    <ActionIcon
                      variant="subtle"
                      color="green"
                      component="a"
                      href={`https://wa.me/55${g.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('🎉 Olá! Você está convidado para nosso casamento 💍. Por favor, confirme sua presença (RSVP) pelo site ou respondendo esta mensagem. Esperamos você! 🥂')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar RSVP por WhatsApp"
                    >
                      <IconBrandWhatsapp size={18} />
                    </ActionIcon>
                  )}
                  {g.email && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      component="a"
                      href={`mailto:${g.email}?subject=${encodeURIComponent('Convite de Casamento - RSVP')}&body=${encodeURIComponent('🎉 Olá! Você está convidado para nosso casamento 💍. Por favor, confirme sua presença (RSVP) pelo site ou respondendo este e-mail. Esperamos você! 🥂')}`}
                      title="Enviar RSVP por Email"
                    >
                      <IconMail size={18} />
                    </ActionIcon>
                  )}
                  <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(g)}>
                    <IconEdit size={18} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(g.id)}>
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              ),
            },
          ]}
          records={guests}
          totalRecords={totalRecords}
          page={page}
          onPageChange={setPage}
          recordsPerPage={recordsPerPage}
          onRecordsPerPageChange={setRecordsPerPage}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          rowStyle={() => ({ background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : '#f8f9fa' })}
          styles={{
            table: { fontSize: rem(15) },
          }}
          striped
          responsive
          fetching={loading}
          paginationText={({ from, to, totalRecords }) => `${from}–${to} de ${totalRecords}`}
          paginationActiveTextColor="blue"
        />
      )}
      {viewMode === 'cards' && (
        <ListView
          items={guests}
          getItemId={(g) => g.id}
          getImageUrl={(g) => undefined} // Convidados não têm imagem, então é undefined
          fallbackIcon={<IconUser size={48} color="var(--mantine-color-gray-5)" />}
          renderContent={(g) => (
            <>
              <Text fw={500} lineClamp={2}>{g.name}</Text>
              <Text size="sm" c="dimmed">Telefone: {g.phone}</Text>
              {g.whatsapp && <Text size="sm" c="dimmed">WhatsApp: {g.whatsapp}</Text>}
              {g.email && <Text size="sm" c="dimmed">Email: {g.email}</Text>}
              {g.acompanhantes !== undefined && <Text size="sm" c="dimmed">Acompanhantes: {g.acompanhantes}</Text>}
              {g.alergias && <Text size="sm" c="dimmed">Alergias: {g.alergias}</Text>}
              {g.observacoes && <Text size="sm" c="dimmed">Observações: {g.observacoes}</Text>}
            </>
          )}
          renderActions={(g) => (
            <>
              {g.whatsapp && (
                <Tooltip label="Enviar RSVP por WhatsApp" position="right">
                  <Menu.Item
                    leftSection={<IconBrandWhatsapp size={14} />}
                    component="a"
                    href={`https://wa.me/55${g.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('🎉 Olá! Você está convidado para nosso casamento 💍. Por favor, confirme sua presença (RSVP) pelo site ou respondendo esta mensagem. Esperamos você! 🥂')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </Menu.Item>
                </Tooltip>
              )}
              {g.email && (
                <Tooltip label="Enviar RSVP por Email" position="right">
                  <Menu.Item
                    leftSection={<IconMail size={14} />}
                    component="a"
                    href={`mailto:${g.email}?subject=${encodeURIComponent('Convite de Casamento - RSVP')}&body=${encodeURIComponent('🎉 Olá! Você está convidado para nosso casamento 💍. Por favor, confirme sua presença (RSVP) pelo site ou respondendo este e-mail. Esperamos você! 🥂')}`}
                  >
                    Email
                  </Menu.Item>
                </Tooltip>
              )}
              <Tooltip label="Editar convidado" position="right">
                <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(g)}>
                  Editar
                </Menu.Item>
              </Tooltip>
              <Tooltip label="Excluir convidado" position="right">
                <Menu.Item leftSection={<IconTrash size={14} />} onClick={() => handleDelete(g.id)} color="red">
                  Excluir
                </Menu.Item>
              </Tooltip>
            </>
          )}
        />
      )}
      {viewMode === 'gallery' && (
        <GalleryView
          items={guests}
          getItemId={(g) => g.id}
          getImageUrl={(g) => undefined} // Convidados não têm imagem, então é undefined
          fallbackIcon={<IconUser size={48} color="var(--mantine-color-gray-5)" />}
          renderContent={(g) => (
            <Stack gap="xs">
              <Text fw={500} lineClamp={2}>{g.name}</Text>
              <Text size="sm" c="dimmed">Telefone: {g.phone}</Text>
              {g.whatsapp && <Text size="sm" c="dimmed">WhatsApp: {g.whatsapp}</Text>}
              {g.email && <Text size="sm" c="dimmed">Email: {g.email}</Text>}
              {g.acompanhantes !== undefined && <Text size="sm" c="dimmed">Acompanhantes: {g.acompanhantes}</Text>}
              {g.alergias && <Text size="sm" c="dimmed">Alergias: {g.alergias}</Text>}
              {g.observacoes && <Text size="sm" c="dimmed">Observações: {g.observacoes}</Text>}
            </Stack>
          )}
          renderActions={(g) => (
            <>
              {g.whatsapp && (
                <Tooltip label="Enviar RSVP por WhatsApp" position="right">
                  <Menu.Item
                    leftSection={<IconBrandWhatsapp size={14} />}
                    component="a"
                    href={`https://wa.me/55${g.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('🎉 Olá! Você está convidado para nosso casamento 💍. Por favor, confirme sua presença (RSVP) pelo site ou respondendo esta mensagem. Esperamos você! 🥂')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </Menu.Item>
                </Tooltip>
              )}
              {g.email && (
                <Tooltip label="Enviar RSVP por Email" position="right">
                  <Menu.Item
                    leftSection={<IconMail size={14} />}
                    component="a"
                    href={`mailto:${g.email}?subject=${encodeURIComponent('Convite de Casamento - RSVP')}&body=${encodeURIComponent('🎉 Olá! Você está convidado para nosso casamento 💍. Por favor, confirme sua presença (RSVP) pelo site ou respondendo este e-mail. Esperamos você! 🥂')}`}
                  >
                    Email
                  </Menu.Item>
                </Tooltip>
              )}
              <Tooltip label="Editar convidado" position="right">
                <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(g)}>
                  Editar
                </Menu.Item>
              </Tooltip>
              <Tooltip label="Excluir convidado" position="right">
                <Menu.Item leftSection={<IconTrash size={14} />} onClick={() => handleDelete(g.id)} color="red">
                  Excluir
                </Menu.Item>
              </Tooltip>
            </>
          )}
        />
      )}
      {(viewMode === 'cards' || viewMode === 'gallery') && (
        <Group justify="center" mt="md">
          <Pagination total={Math.ceil(totalRecords / recordsPerPage)} value={page} onChange={setPage} />
        </Group>
      )}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar convidado' : 'Adicionar convidado'}
        centered
        size="xs"
        overlayProps={{ blur: 2 }}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nome"
              required
              {...form.getInputProps('name')}
              autoFocus
            />
            <TextInput
              label="Telefone"
              required
              maxLength={15}
              value={form.values.phone}
              onChange={e => {
                // Aplica máscara ao digitar
                const raw = e.currentTarget.value.replace(/\D/g, '');
                let masked = '';
                if (raw.length <= 10) {
                  masked = raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
                } else {
                  masked = raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
                }
                form.setFieldValue('phone', masked);
              }}
              error={form.errors.phone}
              placeholder="(11) 99999-9999"
            />
            <Checkbox
              label="Possui WhatsApp?"
              checked={form.values.hasWhatsapp}
              onChange={e => form.setFieldValue('hasWhatsapp', e.currentTarget.checked)}
            />
            {form.values.hasWhatsapp && (
              <TextInput
                label="Número do WhatsApp"
                required
                maxLength={15}
                value={form.values.whatsapp}
                onChange={e => {
                  const raw = e.currentTarget.value.replace(/\D/g, '');
                  let masked = '';
                  if (raw.length <= 10) {
                    masked = raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
                  } else {
                    masked = raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
                  }
                  form.setFieldValue('whatsapp', masked);
                }}
                error={form.errors.whatsapp}
                placeholder="(11) 98888-8888"
              />
            )}
            <TextInput
              label="Email"
              type="email"
              {...form.getInputProps('email')}
              error={form.errors.email}
              placeholder="exemplo@email.com"
            />
            <TextInput
              label="Alergias"
              {...form.getInputProps('alergias')}
              placeholder="Ex: Amendoim, frutos do mar..."
            />
            <TextInput
              label="Acompanhantes"
              type="number"
              min={0}
              {...form.getInputProps('acompanhantes')}
              placeholder="0"
            />
            <TextInput
              label="Observações"
              {...form.getInputProps('observacoes')}
              placeholder="Observações adicionais"
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setModalOpen(false)} type="button">
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <ImportGuestsModal
        opened={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          setImportModalOpen(false);
          // Refresh guests list after successful import
          guests_list({ page, page_size: recordsPerPage, search, ordering: sortStatus.columnAccessor ? `${sortStatus.direction === 'desc' ? '-' : ''}${sortStatus.columnAccessor}` : '' })
            .then(data => {
              setGuests(data.results || []);
              setTotalRecords(data.count || 0);
            });
        }}
      />
      {/* Responsividade customizada para mobile */}
      <style>{`
        @media (max-width: 600px) {
          .mantine-DataTable-table {
            font-size: 13px;
          }
          .mantine-DataTable-table th, .mantine-DataTable-table-td {
            padding: 8px 4px;
          }
        }
      `}</style>
    </Stack>
  );
}
