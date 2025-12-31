/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ACTUAL_SERVER_URL?: string;
  readonly VITE_ACTUAL_PASSWORD?: string;
  readonly VITE_ACTUAL_BUDGET_ID?: string; // Legacy name, maps to syncId
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
