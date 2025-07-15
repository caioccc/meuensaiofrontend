import { Group, SegmentedControl } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

const LANGS = [
  { label: 'PT', value: 'pt' },
  { label: 'EN', value: 'en' },
  { label: 'ES', value: 'es' },
];

export default function LanguageSwitcher({ size = 'xs' }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const { i18n } = useTranslation();
  const [value, setValue] = useState(i18n.language.slice(0, 2));

  useEffect(() => {
    setValue(i18n.language.slice(0, 2));
  }, [i18n.language]);

  const handleChange = (val: string) => {
    setValue(val);
    i18n.changeLanguage(val);
  };

  return (
    <Group justify="center" p={0} m={0}>
      <SegmentedControl
        size={size}
        value={value}
        onChange={handleChange}
        data={LANGS}
        radius="md"
        color="blue"
        fullWidth={false}
      />
    </Group>
  );
}
