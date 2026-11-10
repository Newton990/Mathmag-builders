// src/logger.ts — Simple structured logger for Wasmer Edge.
// IMPORTANT: Never log personal data, request bodies, or auth headers.

export const logger = {
  info: (msg: string, meta?: any) => {
    const entry = { level: 'info', msg, ...(meta ?? {}) };
    console.log(JSON.stringify(entry));
  },
  error: (msg: string, meta?: any) => {
    const entry = { level: 'error', msg, ...(meta ?? {}) };
    console.error(JSON.stringify(entry));
  },
  warn: (msg: string, meta?: any) => {
    const entry = { level: 'warn', msg, ...(meta ?? {}) };
    console.warn(JSON.stringify(entry));
  },
  debug: (msg: string, meta?: any) => {
    if (process.env.LOG_LEVEL === 'debug') {
      const entry = { level: 'debug', msg, ...(meta ?? {}) };
      console.debug(JSON.stringify(entry));
    }
  },
};
