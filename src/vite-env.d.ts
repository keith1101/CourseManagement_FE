/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_URL?: string;
  readonly ZALO_URL?: string;
  readonly ENABLE_MOCKS?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_ZALO_URL?: string;
  readonly VITE_ENABLE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
