-- CreateTable
CREATE TABLE "public"."Bloqueo" (
    "id" SERIAL NOT NULL,
    "bloqueadorId" INTEGER NOT NULL,
    "bloqueadoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bloqueo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bloqueo_bloqueadoId_idx" ON "public"."Bloqueo"("bloqueadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Bloqueo_bloqueadorId_bloqueadoId_key" ON "public"."Bloqueo"("bloqueadorId", "bloqueadoId");

-- AddForeignKey
ALTER TABLE "public"."Bloqueo" ADD CONSTRAINT "Bloqueo_bloqueadorId_fkey" FOREIGN KEY ("bloqueadorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bloqueo" ADD CONSTRAINT "Bloqueo_bloqueadoId_fkey" FOREIGN KEY ("bloqueadoId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
