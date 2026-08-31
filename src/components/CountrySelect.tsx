import { useAppContext } from '../context/appContext';

type CountrySelectProps = {
  id?: string;
  value: string;
  onChange: (country: string) => void;
  required?: boolean;
};

/**
 * Lista krajów z konfiguracji backendu.
 *
 * Kod kraju z sesji był zapisywany przy logowaniu i udostępniany przez hook
 * uwierzytelnienia, ale nie korzystał z niego żaden komponent. Tutaj jest
 * używany: konto techniczne działa w jednym kraju, więc pole jest ustawione
 * na ten kraj i zablokowane — zamiast pozwalać wybrać kraj, w którym backend
 * i tak odrzuci operację.
 */
export function CountrySelect({ id, value, onChange, required = true }: CountrySelectProps) {
  const { t, config, session } = useAppContext();
  const locked = session.country !== null && !session.isAdmin;
  const options = locked ? [session.country as string] : config.countries;

  return (
    <>
      <select
        id={id}
        className="input"
        value={locked ? (session.country as string) : value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={locked}
      >
        {!locked && <option value="">{t('selectCountry')}</option>}
        {options.map((countryCode) => (
          <option key={countryCode} value={countryCode}>{countryCode}</option>
        ))}
      </select>
      {locked && (
        <small style={{ color: 'var(--text-light)' }}>
          {t('countryLockedHint', { country: session.country as string })}
        </small>
      )}
    </>
  );
}
