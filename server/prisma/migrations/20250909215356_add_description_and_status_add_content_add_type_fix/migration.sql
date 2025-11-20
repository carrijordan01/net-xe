-- AlterTable
ALTER TABLE "public"."Contract" ADD COLUMN     "description" TEXT NOT NULL DEFAULT 'pendiente',
ALTER COLUMN "status" DROP DEFAULT;
