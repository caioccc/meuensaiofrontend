import { Select } from "@mantine/core";

export interface OrderOption {
  value: string;
  label: string;
}

interface OrderSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: OrderOption[];
  label?: string;
}

export default function OrderSelect({ value, onChange, options, label }: OrderSelectProps) {
  return (
    <Select
      label={label}
      placeholder="Ordenar por..."
      data={options}
      value={value}
      onChange={onChange}
      clearable={false}
      style={{ minWidth: 180 }}
      size="sm"
    />
  );
}
