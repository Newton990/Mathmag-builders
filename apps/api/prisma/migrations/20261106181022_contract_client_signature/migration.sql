-- UAT-08, MAST-UAT-10: Client signature on contracts
-- Client must sign before contract can be executed

-- Add client signature columns to contracts table
ALTER TABLE "contracts" ADD COLUMN "clientSignedAt" TIMESTAMP(3);
ALTER TABLE "contracts" ADD COLUMN "clientSignedById" TEXT;
ALTER TABLE "contracts" ADD COLUMN "clientSignatureEvidenceKey" TEXT;
ALTER TABLE "contracts" ADD COLUMN "clientAccepted" BOOLEAN NOT NULL DEFAULT false;

-- Add foreign key for clientSignedById referencing users
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientSignedById_fkey" FOREIGN KEY ("clientSignedById") REFERENCES "users"("id") ON DELETE SET NULL;

-- Create index
CREATE INDEX "contracts_clientSignedById_idx" ON "contracts"("clientSignedById");
