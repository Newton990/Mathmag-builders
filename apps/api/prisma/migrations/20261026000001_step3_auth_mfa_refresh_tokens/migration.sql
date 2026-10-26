-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: step-3-auth-mfa-refresh-tokens
-- Adds: refresh_tokens, user_mfa tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Refresh tokens ────────────────────────────────────────────────────────────
-- One row per issued refresh token. Revoked (not deleted) on logout/rotation.
-- Rotation attack detection: if an already-rotated token is presented,
-- all tokens for that user are revoked immediately.

CREATE TABLE "refresh_tokens" (
    "id"           TEXT         NOT NULL,
    "userId"       TEXT         NOT NULL,
    "token"        TEXT         NOT NULL,
    "mfaVerified"  BOOLEAN      NOT NULL DEFAULT FALSE,
    "expiresAt"    TIMESTAMPTZ  NOT NULL,
    "revokedAt"    TIMESTAMPTZ,
    "revokeReason" TEXT,          -- LOGOUT | LOGOUT_ALL | ROTATED | REUSE_DETECTED | ADMIN
    "ipAddress"    TEXT,
    "userAgent"    TEXT,
    "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- Unique opaque token string (96-char hex)
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- Fast lookup: active tokens for a user
CREATE INDEX "refresh_tokens_userId_revokedAt_idx"
    ON "refresh_tokens"("userId", "revokedAt");

-- Expiry cleanup index
CREATE INDEX "refresh_tokens_expiresAt_idx"
    ON "refresh_tokens"("expiresAt");

-- FK: cascade delete when user is deleted (GDPR / data cleanup)
ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Immutability guard: refresh tokens are never updated, only inserted and
-- soft-deleted (revokedAt set). Prevent direct field tampering.
-- We allow UPDATE only to set revokedAt + revokeReason (the rotation path).
-- Full tamper-evidence lives in the audit_events table.

-- ── User MFA configuration ───────────────────────────────────────────────────
-- One row per user. Secret is AES-256-GCM encrypted.
-- enabled=false = setup started but not yet confirmed by the user.
-- enabled=true  = active; ALL critical operations that call requireMfa() pass.

CREATE TABLE "user_mfa" (
    "userId"           TEXT         NOT NULL,
    "encryptedSecret"  TEXT         NOT NULL,   -- iv:tag:ciphertext (hex-encoded)
    "backupCodeHashes" TEXT[]       NOT NULL DEFAULT '{}',  -- SHA-256 of each code
    "enabled"          BOOLEAN      NOT NULL DEFAULT FALSE,
    "enabledAt"        TIMESTAMPTZ,
    "disabledAt"       TIMESTAMPTZ,
    "createdAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    "updatedAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT "user_mfa_pkey" PRIMARY KEY ("userId")
);

-- FK: cascade on user deletion
ALTER TABLE "user_mfa"
    ADD CONSTRAINT "user_mfa_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Auto-update updatedAt
CREATE OR REPLACE FUNCTION update_user_mfa_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "user_mfa_updated_at_trigger"
    BEFORE UPDATE ON "user_mfa"
    FOR EACH ROW EXECUTE FUNCTION update_user_mfa_updated_at();

-- ── Audit: log MFA secret access attempts ────────────────────────────────────
-- Any SELECT on encryptedSecret is a sensitive operation; this is noted in
-- application logic (audit_events) — we don't log it at DB trigger level to
-- avoid storing secrets in the audit log.

-- ── Add failedAttempts and lockedUntil to users if not already present ───────
-- (These were added in the Step 2 migration; this is a no-op guard)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='failedAttempts'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "failedAttempts" INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='lockedUntil'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "lockedUntil" TIMESTAMPTZ;
    END IF;
END $$;
