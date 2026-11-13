-- AlterEnum
ALTER TYPE "public"."TipoNotificacion" ADD VALUE 'DOCUMENTO_ADJUNTO';

-- AlterTable
ALTER TABLE "public"."DocumentoContrato" DROP COLUMN "tipo",
DROP COLUMN "url",
ADD COLUMN     "archivo" TEXT NOT NULL,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "hash" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "tamano" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoContrato_archivo_key" ON "public"."DocumentoContrato"("archivo");

-- CreateIndex
CREATE INDEX "DocumentoContrato_contratoId_idx" ON "public"."DocumentoContrato"("contratoId");
