import { useAppContext } from '../context/appContext';
import type { FieldError } from '../lib/validation';

type FieldMessageProps = {
  error?: FieldError;
};

/** Komunikat walidacji pod polem formularza. Tekst powstaje z klucza słownika. */
export function FieldMessage({ error }: FieldMessageProps) {
  const { t } = useAppContext();

  if (!error) {
    return null;
  }

  return (
    <div className="field-error" role="alert">
      {t(error.key, error.params)}
    </div>
  );
}
