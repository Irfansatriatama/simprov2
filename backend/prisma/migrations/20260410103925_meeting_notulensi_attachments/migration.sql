-- CreateTable
CREATE TABLE "MeetingNotulensiAttachment" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingNotulensiAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingNotulensiAttachment_meetingId_idx" ON "MeetingNotulensiAttachment"("meetingId");

-- AddForeignKey
ALTER TABLE "MeetingNotulensiAttachment" ADD CONSTRAINT "MeetingNotulensiAttachment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
