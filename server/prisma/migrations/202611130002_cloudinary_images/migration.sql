-- Add Cloudinary metadata without losing existing image bytes.
ALTER TABLE "MediaAsset"
  ALTER COLUMN "data" DROP NOT NULL,
  ADD COLUMN "cloudName" TEXT,
  ADD COLUMN "cloudPublicId" TEXT,
  ADD COLUMN "cloudAssetId" TEXT,
  ADD COLUMN "cloudUrl" TEXT;
