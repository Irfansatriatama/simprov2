-- Repair drift: coverImageUrl may already exist if it was added via db push / manual SQL.
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
