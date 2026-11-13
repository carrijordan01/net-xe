-- CreateEnum
CREATE TYPE "public"."TipoNotificacion" AS ENUM ('CONTRATO_RECIBIDO', 'CONTRATO_EDITADO', 'CONTRATO_ELIMINADO', 'CONTRATO_ACEPTADO', 'CONTRATO_RECHAZADO', 'CONTRATO_FIRMADO', 'VENCIMIENTO_PROXIMO');

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "clave" TEXT,
ADD COLUMN     "contratoId" INTEGER,
ADD COLUMN     "tipo" "public"."TipoNotificacion" NOT NULL;

-- CreateIndex
CREATE INDEX "Notification_usuarioId_createdAt_idx" ON "public"."Notification"("usuarioId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_usuarioId_clave_key" ON "public"."Notification"("usuarioId", "clave");

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
