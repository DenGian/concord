-- Prevent duplicate memberships when the same invite is accepted concurrently.
CREATE UNIQUE INDEX "Member_profileId_serverId_key" ON "Member"("profileId", "serverId");
