/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Bazowy adres backendu, np. https://api.example.com. Puste = ten sam origin. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
