-- AlterTable
ALTER TABLE "user" ADD COLUMN "clientId" TEXT;

-- CreateIndex
CREATE INDEX "user_clientId_idx" ON "user"("clientId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
