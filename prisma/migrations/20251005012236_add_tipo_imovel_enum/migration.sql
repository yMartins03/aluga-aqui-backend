/*
  Warnings:

  - Changed the type of `tipo` on the `imoveis` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."TipoImovel" AS ENUM ('CASA', 'APARTAMENTO', 'KITNET', 'STUDIO', 'COBERTURA', 'SOBRADO', 'COMERCIAL', 'SALA_COMERCIAL', 'LOJA', 'GALPAO', 'TERRENO', 'CHACARA');

-- AlterTable
ALTER TABLE "public"."imoveis" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "public"."TipoImovel" NOT NULL;
