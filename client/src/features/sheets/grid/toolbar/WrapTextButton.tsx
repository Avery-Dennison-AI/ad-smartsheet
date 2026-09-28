import { WrapText } from 'lucide-react';
import ToggleButton from '@/components/ui/ToggleButton';

interface WrapTextButtonProps {
  pressed: boolean | 'mixed';
  onToggle: () => void;
  disabled?: boolean;
}

export default function WrapTextButton({ pressed, onToggle, disabled }: WrapTextButtonProps) {
  return (
    <ToggleButton
      pressed={pressed}
      onToggle={onToggle}
      tooltip="Wrap text"
      icon={<WrapText
        className="h-4 w-4"
        data-icod-id="src_features_sheets_grid_toolbar_wraptextbutton_tsx_4b6a" />}
      disabled={disabled}
      size="sm"
      data-icod-id="src_features_sheets_grid_toolbar_wraptextbutton_tsx_ff91" />
  );
}
