-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "credencialesCambiadasEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."RecuperacionPassword" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecuperacionPassword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecuperacionPassword_tokenHash_key" ON "public"."RecuperacionPassword"("tokenHash");

-- CreateIndex
CREATE INDEX "RecuperacionPassword_usuarioId_createdAt_idx" ON "public"."RecuperacionPassword"("usuarioId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."RecuperacionPassword" ADD CONSTRAINT "RecuperacionPassword_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
