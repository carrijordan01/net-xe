-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "firmaBloqueadaHasta" TIMESTAMP(3),
ADD COLUMN     "intentosFirmaFallidos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pinFirmaHash" TEXT;
