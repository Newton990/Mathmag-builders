/// <reference types="vite/client" />

/**
 * Augment Vite's ImportMetaEnv with MBMS-specific variables.
 * All VITE_* variables are replaced at build time and must not contain secrets.
 */
interface ImportMetaEnv {
  /**
   * Set to 'false' in production to disable demo/offline mode entirely.
   * Defaults to 'true' (demo mode active) when unset.
   */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
