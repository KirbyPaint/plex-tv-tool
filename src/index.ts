import dotenv from "dotenv";
import { fetchSeriesById, showToId } from "./utils/api";

import { PrismaClient } from "@prisma/client";
import { ezDownload } from "./utils/ezDownload";
import chalk from "chalk";
import {
  findEpisodesBySeriesId,
  mapSeriesToDatabaseEntry,
} from "./utils/database-functions";
import { mapEpisodeToDatabaseEntry } from "./utils/mapEpisodeToDatabaseEntry";
import { readdir } from "fs";
import path from "path";

const prisma = new PrismaClient();
const prompt = require("prompt-sync")();

dotenv.config();

async function preStart(): Promise<any> {
  return await prisma.lastSyncedAt.findFirst({
    orderBy: {
      timestamp: "desc",
    },
  });
}

async function main(): Promise<void> {
  const lastSyncedAt = await preStart();
  const test = new Date(lastSyncedAt?.timestamp);
  const difference = new Date().getTime() - test.getTime();
  const oneWeekInMilliseconds = 60480000;
  if (difference > oneWeekInMilliseconds || lastSyncedAt === null) {
    console.log(chalk.blue(`last sync was more than a week ago`));
    console.log(chalk.blue(`syncing shows, please wait...`));
    // await ezDownload(400); // this MUST finish before proceeding
    // otherwise we have no local db
  }
  const showName = prompt("Enter show name: ");
  const [showId, showNameFull] = await showToId(showName);
  // Check local db for episodes
  const localEpisodes = await findEpisodesBySeriesId(showId);
  if (localEpisodes.length >= 1) {
    console.log(chalk.blue(`found ${localEpisodes.length} episodes locally`));
    console.log(chalk.blue(`found show name: ${showNameFull}`));
    // immediately go to comparing local episode count phase
  } else {
    // Otherwise, program will fetch episodes for show from API
    console.log(chalk.blue(`Fetching episodes from API`));
    const apiEpisodes = await fetchSeriesById(showId, `default`);
    console.log(chalk.blue(`Found ${apiEpisodes.length} episodes on TVDB`));
    // Program will seed episodes in local db
    // but only if there are more than 0 episodes
    if (apiEpisodes.length > 0) {
      const seededEpisodeCount = await mapEpisodeToDatabaseEntry(apiEpisodes);
      console.log(chalk.green(`seeded ${seededEpisodeCount} Episodes`));
    }
    if (apiEpisodes instanceof Error) {
      throw new Error(apiEpisodes.message);
    }
  }
  // Compare local file count to episode count
  // Test if we have this directory we are looking for
  const targetDir = path.join(__dirname, `..`, `..`, `..`, showNameFull);
  console.log({ targetDir });
  readdir(targetDir, async (err, files) => {
    if (err) {
      console.log(chalk.red(`No directory found for ${showNameFull}`));
      console.log(
        chalk.red(
          `Please move the media files into the root directory this project is in`
        )
      );
    }
    const localFileCount = files.length;
    console.log(
      chalk.blue(`Found ${localFileCount} files in ${showNameFull} directory`)
    );
    files.forEach((file) => {
      console.log(chalk.blue(`found file: ${file}`));
    });
  });

  // For each season, replace filenames with episode names
  // Structured like Plex likes it
  // Optional TVDB id in the season folder name WITH CURLY BRACKETS
  // /Band of Brothers (2001)/Season 01/Band of Brothers (2001) - s01e01 - Currahee.mkv
  // /seriesName (year) {tvdb-#####}/Season ##/seriesName (year) - s##e## - episodeName.mkv
  // Programmatically get this information from the current directory
  // rl.close();
  // (async () => {
  //   try {

  //   } catch (e) {
  //     console.error("unable to prompt", e);
  //   }
  // })();
  // rl.on("close", () => process.exit(0));
}

main();
