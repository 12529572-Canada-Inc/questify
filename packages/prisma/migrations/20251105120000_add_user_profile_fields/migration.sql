-- Add avatar URL and theme preference to users
CREATE TYPE "ThemePreference" AS ENUM ('light', 'dark', 'auto');

ALTER TABLE "User"
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "themePreference" "ThemePreference" NOT NULL DEFAULT 'light';
