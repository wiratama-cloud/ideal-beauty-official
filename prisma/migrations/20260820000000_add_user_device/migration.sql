-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'OTHER');

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'OTHER',
    "deviceName" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_token_key" ON "UserDevice"("token");

-- CreateIndex
CREATE INDEX "UserDevice_userId_isActive_idx" ON "UserDevice"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserDevice_deviceType_idx" ON "UserDevice"("deviceType");

-- CreateIndex
CREATE INDEX "UserDevice_lastActiveAt_idx" ON "UserDevice"("lastActiveAt");

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
