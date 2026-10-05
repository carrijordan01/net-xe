/*
  Warnings:

  - You are about to drop the `Contract` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('INDIVIDUAL', 'EMPRESA');

-- CreateEnum
CREATE TYPE "public"."ContractState" AS ENUM ('PENDIENTE', 'FIRMADO', 'RECHAZADO', 'EN_REVISION');

-- DropForeignKey
ALTER TABLE "public"."Contract" DROP CONSTRAINT "Contract_ownerId_fkey";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "accountType" "public"."AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "company" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "public"."Contract";

-- CreateTable
CREATE TABLE "public"."Contrato" (
    "id" SERIAL NOT NULL,
    "tipo" "public"."ContractType" NOT NULL,
    "estado" "public"."ContractState" NOT NULL DEFAULT 'PENDIENTE',
    "solicitanteId" INTEGER NOT NULL,
    "proponenteId" INTEGER NOT NULL,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmadoSolicitante" BOOLEAN NOT NULL DEFAULT false,
    "firmadoProponente" BOOLEAN NOT NULL DEFAULT false,
    "fechaFirmaSolicitante" TIMESTAMP(3),
    "fechaFirmaProponente" TIMESTAMP(3),
    "firmaSolicitanteHash" TEXT,
    "firmaProponenteHash" TEXT,
    "pinFirma" TEXT,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccionHistorial" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "evento" TEXT NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccionHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MensajeContrato" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensajeContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentoContrato" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_proponenteId_fkey" FOREIGN KEY ("proponenteId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccionHistorial" ADD CONSTRAINT "AccionHistorial_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccionHistorial" ADD CONSTRAINT "AccionHistorial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MensajeContrato" ADD CONSTRAINT "MensajeContrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MensajeContrato" ADD CONSTRAINT "MensajeContrato_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoContrato" ADD CONSTRAINT "DocumentoContrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "public"."Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentoContrato" ADD CONSTRAINT "DocumentoContrato_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
