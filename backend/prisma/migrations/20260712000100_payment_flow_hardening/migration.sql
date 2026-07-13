ALTER TABLE "PaymentTransaction"
  ADD COLUMN "internalReference" TEXT,
  ADD COLUMN "providerReference" TEXT,
  ADD COLUMN "paymentMethod" TEXT,
  ADD COLUMN "providerName" TEXT NOT NULL DEFAULT 'paystack',
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "failureReason" TEXT,
  ADD COLUMN "instructions" JSONB;

UPDATE "PaymentTransaction"
SET
  "internalReference" = COALESCE("internalReference", "reference"),
  "providerReference" = COALESCE("providerReference", "reference"),
  "paymentMethod" = COALESCE("paymentMethod", "channel"),
  "status" = CASE
    WHEN LOWER("status") = 'success' THEN 'SUCCESS'
    WHEN LOWER("status") = 'failed' THEN 'FAILED'
    WHEN LOWER("status") = 'cancelled' THEN 'CANCELLED'
    WHEN LOWER("status") = 'expired' THEN 'EXPIRED'
    WHEN LOWER("status") = 'processing' THEN 'PROCESSING'
    WHEN LOWER("status") = 'pending' THEN 'PENDING'
    ELSE 'INITIALIZED'
  END;

CREATE UNIQUE INDEX "PaymentTransaction_internalReference_key" ON "PaymentTransaction"("internalReference");
CREATE UNIQUE INDEX "PaymentTransaction_providerReference_key" ON "PaymentTransaction"("providerReference");
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");
CREATE INDEX "PaymentTransaction_paymentMethod_idx" ON "PaymentTransaction"("paymentMethod");
