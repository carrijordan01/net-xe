-- CreateEnum
CREATE TYPE "public"."Modalidad" AS ENUM ('EJECUCION_INMEDIATA', 'TRACTO_SUCESIVO');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ContractType_new" AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'JORNADA_PARCIAL', 'OBRA_FAENA', 'REEMPLAZO', 'SERVICIOS_PROFESIONALES', 'COMPRAVENTA_BIENES', 'COMPRAVENTA_DOMINIO', 'AGENCIA', 'DISTRIBUCION', 'SUMINISTRO', 'ARRIENDO', 'COMODATO', 'DONACION', 'MUTUO', 'CONTRATO_SIMPLE');
ALTER TABLE "public"."Contrato" ALTER COLUMN "tipo" TYPE "public"."ContractType_new" USING ("tipo"::text::"public"."ContractType_new");
ALTER TYPE "public"."ContractType" RENAME TO "ContractType_old";
ALTER TYPE "public"."ContractType_new" RENAME TO "ContractType";
DROP TYPE "public"."ContractType_old";
COMMIT;

-- AlterTable (conserva los valores existentes; los no reconocidos quedan en NULL)
ALTER TABLE "public"."Contrato" ALTER COLUMN "modalidad" TYPE "public"."Modalidad"
  USING (CASE WHEN "modalidad" IN ('EJECUCION_INMEDIATA', 'TRACTO_SUCESIVO') THEN "modalidad"::"public"."Modalidad" ELSE NULL END);
