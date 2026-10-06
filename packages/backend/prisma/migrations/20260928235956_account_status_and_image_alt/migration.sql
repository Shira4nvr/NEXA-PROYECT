-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "altText" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "name" DROP NOT NULL;
