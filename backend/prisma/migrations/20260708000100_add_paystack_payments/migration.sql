ALTER TABLE "ProviderProfile"
  ADD COLUMN "requestedPlan" TEXT,
  ADD COLUMN "billingStatus" TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN "paystackCustomerCode" TEXT,
  ADD COLUMN "paystackSubscriptionCode" TEXT,
  ADD COLUMN "paystackEmailToken" TEXT,
  ADD COLUMN "subscriptionStartedAt" TIMESTAMP(3),
  ADD COLUMN "nextBillingAt" TIMESTAMP(3);

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerId" TEXT,
  "plan" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'ZAR',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "channel" TEXT NOT NULL DEFAULT 'paystack',
  "authorizationUrl" TEXT,
  "accessCode" TEXT,
  "paystackId" TEXT,
  "customerCode" TEXT,
  "subscriptionCode" TEXT,
  "emailToken" TEXT,
  "paidAt" TIMESTAMP(3),
  "metadata" JSONB,
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentTransaction_reference_key" ON "PaymentTransaction"("reference");
CREATE INDEX "PaymentTransaction_userId_idx" ON "PaymentTransaction"("userId");
CREATE INDEX "PaymentTransaction_providerId_idx" ON "PaymentTransaction"("providerId");

ALTER TABLE "PaymentTransaction"
  ADD CONSTRAINT "PaymentTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentTransaction"
  ADD CONSTRAINT "PaymentTransaction_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
