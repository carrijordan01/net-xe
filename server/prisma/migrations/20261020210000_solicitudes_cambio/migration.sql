-- CreateEnum
CREATE TYPE "public"."TipoSolicitud" AS ENUM ('EDICION', 'ELIMINACION');

-- CreateEnum
CREATE TYPE "public"."EstadoSolicitud" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."TipoNotificacion" ADD VALUE 'SOLICITUD_CAMBIO';
ALTER TYPE "public"."TipoNotificacion" ADD VALUE 'SOLICITUD_RESPONDIDA';

-- CreateTable
CREATE TABLE "public"."SolicitudCambio" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "tipo" "public"."TipoSolicitud" NOT NULL,
    "estado" "public"."EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT NOT NULL,
    "propuesta" JSONB,
    "cambios" TEXT[],
    "respuesta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidaAt" TIMESTAMP(3),

    CONSTRAINT "SolicitudCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitudCambio_contratoId_estado_idx" ON "public"."SolicitudCambio"("contratoId", "estado");

-- AddForeignKey
ALTER TABLE "public"."SolicitudCambio" ADD CONSTRAINT "SolicitudCambio_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolicitudCambio" ADD CONSTRAINT "SolicitudCambio_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
