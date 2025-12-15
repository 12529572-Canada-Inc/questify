-- Persona metadata for AI model selection
CREATE TYPE "PersonaSpeed" AS ENUM ('fast', 'faster', 'fastest');

CREATE TYPE "PersonaCost" AS ENUM ('low', 'medium', 'high');

CREATE TYPE "PersonaContext" AS ENUM ('short', 'medium', 'long');

CREATE TABLE "ModelPersona" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bestFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "speed" "PersonaSpeed" NOT NULL,
    "cost" "PersonaCost" NOT NULL,
    "contextLength" "PersonaContext" NOT NULL,
    "provider" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "notes" TEXT,
    "infoUrl" TEXT,
    "recommended" BOOLEAN NOT NULL DEFAULT FALSE,
    "recommendedReason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelPersona_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ModelPersona_key_key" ON "ModelPersona"("key");
CREATE INDEX "ModelPersona_provider_idx" ON "ModelPersona"("provider");
CREATE INDEX "ModelPersona_modelId_idx" ON "ModelPersona"("modelId");
CREATE INDEX "ModelPersona_active_idx" ON "ModelPersona"("active");
