/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __STANDPOWER_CONFIG__?: {
    apiUrl: string;
    isDemoMode: boolean;
    geminiKey: string;
  };
}
