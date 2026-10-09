-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SOLICITANTE', 'CONTRAPARTE');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('INDIVIDUAL', 'EMPRESA');

-- CreateEnum
CREATE TYPE "public"."ContractState" AS ENUM ('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'FIRMADO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "public"."ContractType" AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'OBRA_FAENA', 'JORNADA_PARCIAL', 'REEMPLAZO', 'APRENDIZAJE', 'HONORARIOS', 'SERVICIOS_PROFESIONALES', 'MANDATO', 'ARRENDAMIENTO_SERVICIOS', 'COMPRAVENTA_BIENES', 'COMPRAVENTA_DOMINIO', 'COMPRAVENTA_INTERNACIONAL', 'SOCIEDAD', 'SUMINISTRO', 'FRANQUICIA', 'LEASING', 'FACTORING', 'DISTRIBUCION', 'AGENCIA', 'ARRIENDO', 'COMODATO', 'DONACION', 'MUTUO', 'HIPOTECA', 'EJECUCION_INMEDIATA', 'TRACTO_SUCESIVO');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "accountType" "public"."AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "role" "public"."Role" NOT NULL DEFAULT 'SOLICITANTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contrato" (
    "id" SERIAL NOT NULL,
    "tipo" "public"."ContractType" NOT NULL,
    "estado" "public"."ContractState" NOT NULL DEFAULT 'PENDIENTE',
    "modalidad" TEXT,
    "fechaTermino" TIMESTAMP(3),
    "solicitanteId" INTEGER NOT NULL,
    "contraparteId" INTEGER NOT NULL,
    "datos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firmadoSolicitante" BOOLEAN NOT NULL DEFAULT false,
    "firmadoContraparte" BOOLEAN NOT NULL DEFAULT false,
    "fechaFirmaSolicitante" TIMESTAMP(3),
    "fechaFirmaContraparte" TIMESTAMP(3),
    "ipFirmaSolicitante" TEXT,
    "ipFirmaContraparte" TEXT,
    "firmaSolicitanteHash" TEXT,
    "firmaContraparteHash" TEXT,

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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contrato" ADD CONSTRAINT "Contrato_contraparteId_fkey" FOREIGN KEY ("contraparteId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
