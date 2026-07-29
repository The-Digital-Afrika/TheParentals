CREATE INDEX "ProviderProfile_status_idx" ON "ProviderProfile"("status");
CREATE INDEX "ProviderProfile_publicDisplay_status_idx" ON "ProviderProfile"("publicDisplay", "status");
CREATE INDEX "ProviderProfile_createdAt_idx" ON "ProviderProfile"("createdAt");

CREATE INDEX "Review_providerId_idx" ON "Review"("providerId");
CREATE INDEX "Review_status_idx" ON "Review"("status");

CREATE INDEX "FeaturedSlot_providerId_idx" ON "FeaturedSlot"("providerId");
CREATE INDEX "FeaturedSlot_expiresAt_idx" ON "FeaturedSlot"("expiresAt");
