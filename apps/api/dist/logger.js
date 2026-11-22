// src/logger.ts — Simple structured logger for Wasmer Edge.
// IMPORTANT: Never log personal data, request bodies, or auth headers.
export const logger = {
    info: (msg, meta) => {
        const entry = { level: 'info', msg, ...(meta ?? {}) };
        console.log(JSON.stringify(entry));
    },
    error: (msg, meta) => {
        const entry = { level: 'error', msg, ...(meta ?? {}) };
        console.error(JSON.stringify(entry));
    },
    warn: (msg, meta) => {
        const entry = { level: 'warn', msg, ...(meta ?? {}) };
        console.warn(JSON.stringify(entry));
    },
    debug: (msg, meta) => {
        if (process.env.LOG_LEVEL === 'debug') {
            const entry = { level: 'debug', msg, ...(meta ?? {}) };
            console.debug(JSON.stringify(entry));
        }
    },
};
//# sourceMappingURL=logger.js.map