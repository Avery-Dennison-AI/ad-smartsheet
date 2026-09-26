import { useRef } from 'react';
import { Copy } from 'lucide-react';
import Input from './Input';
import IconButton from './IconButton';
import { useToast } from './Toast';

export interface CopyFieldProps {
  value: string;
  label?: string;
}

/** Read-only input with a copy button. Copies to clipboard and shows a toast. */
export default function CopyField({ value, label }: CopyFieldProps) {
  const { addToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCopy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback: select text in the input
        if (inputRef.current) {
          inputRef.current.select();
          document.execCommand('copy');
        }
      }
      addToast('success', 'Link copied');
    } catch {
      // If clipboard fails, try fallback
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        addToast('success', 'Link copied');
      }
    }
  }

  return (
    <div
      className="flex flex-col gap-1.5"
      data-icod-id="src_components_ui_copyfield_tsx_root">
      {label && (
        <label
          className="text-sm font-medium text-foreground"
          data-icod-id="src_components_ui_copyfield_tsx_label">
          {label}
        </label>
      )}
      <div
        className="relative"
        data-icod-id="src_components_ui_copyfield_tsx_wrapper">
        <Input
          ref={inputRef}
          readOnly
          value={value}
          className="pr-10 font-mono"
          data-icod-id="src_components_ui_copyfield_tsx_input" />
        <div
          className="absolute right-1 top-1/2 -translate-y-1/2"
          data-icod-id="src_components_ui_copyfield_tsx_btn_wrap">
          <IconButton
            size="sm"
            tooltip="Copy link"
            onClick={handleCopy}
            data-icod-id="src_components_ui_copyfield_tsx_copy_btn">
            <Copy
              className="h-4 w-4"
              data-icod-id="src_components_ui_copyfield_tsx_copy_icon" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
