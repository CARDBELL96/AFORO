import { MAX_PER_TIER } from '../lib/cart';
import { Icon } from './Icon';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function Stepper({ value, onChange, label, min = 0, max = MAX_PER_TIER, disabled }: StepperProps) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label={`Quitar una: ${label}`}>
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label={`Agregar una: ${label}`}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
