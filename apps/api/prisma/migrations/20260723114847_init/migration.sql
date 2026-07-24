-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "defaultHourlyRateCents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Representative" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Representative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRepresentative" (
    "ownerId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "representativeId" UUID NOT NULL,
    "relationship" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StudentRepresentative_pkey" PRIMARY KEY ("studentId","representativeId")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "agencyId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'PLANNED',
    "hourlyRateCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Agency_ownerId_isActive_idx" ON "Agency"("ownerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_ownerId_name_key" ON "Agency"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_id_ownerId_key" ON "Agency"("id", "ownerId");

-- CreateIndex
CREATE INDEX "Student_ownerId_agencyId_idx" ON "Student"("ownerId", "agencyId");

-- CreateIndex
CREATE INDEX "Student_ownerId_isActive_idx" ON "Student"("ownerId", "isActive");

-- CreateIndex
CREATE INDEX "Student_ownerId_lastName_firstName_idx" ON "Student"("ownerId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Student_id_ownerId_key" ON "Student"("id", "ownerId");

-- CreateIndex
CREATE INDEX "Representative_ownerId_lastName_firstName_idx" ON "Representative"("ownerId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Representative_id_ownerId_key" ON "Representative"("id", "ownerId");

-- CreateIndex
CREATE INDEX "StudentRepresentative_ownerId_idx" ON "StudentRepresentative"("ownerId");

-- CreateIndex
CREATE INDEX "StudentRepresentative_representativeId_idx" ON "StudentRepresentative"("representativeId");

-- CreateIndex
CREATE INDEX "Lesson_ownerId_startsAt_idx" ON "Lesson"("ownerId", "startsAt");

-- CreateIndex
CREATE INDEX "Lesson_ownerId_studentId_startsAt_idx" ON "Lesson"("ownerId", "studentId", "startsAt");

-- CreateIndex
CREATE INDEX "Lesson_ownerId_agencyId_startsAt_idx" ON "Lesson"("ownerId", "agencyId", "startsAt");

-- CreateIndex
CREATE INDEX "Lesson_ownerId_status_startsAt_idx" ON "Lesson"("ownerId", "status", "startsAt");

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_agencyId_ownerId_fkey" FOREIGN KEY ("agencyId", "ownerId") REFERENCES "Agency"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Representative" ADD CONSTRAINT "Representative_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRepresentative" ADD CONSTRAINT "StudentRepresentative_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRepresentative" ADD CONSTRAINT "StudentRepresentative_studentId_ownerId_fkey" FOREIGN KEY ("studentId", "ownerId") REFERENCES "Student"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRepresentative" ADD CONSTRAINT "StudentRepresentative_representativeId_ownerId_fkey" FOREIGN KEY ("representativeId", "ownerId") REFERENCES "Representative"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_studentId_ownerId_fkey" FOREIGN KEY ("studentId", "ownerId") REFERENCES "Student"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_agencyId_ownerId_fkey" FOREIGN KEY ("agencyId", "ownerId") REFERENCES "Agency"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;
