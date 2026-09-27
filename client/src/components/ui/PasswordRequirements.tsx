import { Check, Minus } from 'lucide-react';
import { PASSWORD_RULES } from '@/utils/passwordPolicy';

export interface PasswordRequirementsProps {
  password: string;
}

/** Live checklist of password policy rules. */
export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <div
      className="flex flex-col gap-1"
      data-icod-id="src_components_ui_passwordrequirements_tsx_root">
      {PASSWORD_RULES.map((rule) => {
        const satisfied = rule.test(password);
        return (
          <div
            key={rule.id}
            className="flex items-center gap-2 text-token-sm"
            data-icod-id={`src_components_ui_passwordrequirements_tsx_rule_${rule.id}`}>
            {satisfied ? (
              <Check
                className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]"
                data-icod-id={`src_components_ui_passwordrequirements_tsx_check_${rule.id}`} />
            ) : (
              <Minus
                className="h-3.5 w-3.5 shrink-0 text-[var(--color-gray-400)]"
                data-icod-id={`src_components_ui_passwordrequirements_tsx_dash_${rule.id}`} />
            )}
            <span
              className={satisfied ? 'text-foreground' : 'text-muted-foreground'}
              data-icod-id={`src_components_ui_passwordrequirements_tsx_text_${rule.id}`}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
