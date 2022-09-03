-- CreateTable
CREATE TABLE "Series" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "nameTranslations" TEXT,
    "overviewTranslations" TEXT,
    "aliases" TEXT,
    "firstAired" TEXT,
    "lastAired" TEXT,
    "nextAired" TEXT,
    "score" INTEGER,
    "status" TEXT,
    "originalCountry" TEXT,
    "originalLanguage" TEXT,
    "defaultSeasonType" INTEGER,
    "isOrderRandomized" BOOLEAN,
    "lastUpdated" TEXT,
    "averageRuntime" INTEGER,
    "episodes" TEXT,
    "overview" TEXT,
    "year" TEXT
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seriesId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "aired" TEXT,
    "runtime" INTEGER,
    "nameTranslations" TEXT,
    "overview" TEXT,
    "overviewTranslations" TEXT,
    "image" TEXT,
    "imageType" INTEGER,
    "isMovie" INTEGER,
    "seasons" TEXT,
    "number" INTEGER,
    "seasonNumber" INTEGER,
    "lastUpdated" TEXT,
    "finaleType" TEXT,
    "year" TEXT,
    "airsBeforeSeason" INTEGER,
    "airsAfterSeason" INTEGER,
    "airsBeforeEpisode" INTEGER,
    "airsAfterEpisode" INTEGER
);

-- CreateTable
CREATE TABLE "LastSyncedAt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Series_id_key" ON "Series"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_id_key" ON "Episode"("id");

-- CreateIndex
CREATE UNIQUE INDEX "LastSyncedAt_id_key" ON "LastSyncedAt"("id");
