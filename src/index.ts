import dotenv from "dotenv";
import { fetchSeriesById, showToId } from "./utils/api";

import { Episode, PrismaClient } from "@prisma/client";
import chalk from "chalk";
import { findEpisodesBySeriesId } from "./utils/database-functions";
import { mapEpisodeToDatabaseEntry } from "./utils/mapEpisodeToDatabaseEntry";
import { rename } from "fs";
import path from "path";
import dirTree from "directory-tree";
import { FILE_FORMATS, MS_WEEK } from "./utils/consts";

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

// BLUE logs for information
// GREEN logs for success
// RED logs for errors

// Instead of making many calls to the API, we should
// make a few at the beginning and store the info in a variable
async function main(): Promise<void> {
  const lastSyncedAt = await preStart();
  const test = new Date(lastSyncedAt?.timestamp);
  const difference = new Date().getTime() - test.getTime();

  if (difference > MS_WEEK || lastSyncedAt === null) {
    console.log(chalk.blue(`last sync was more than a week ago`));
    console.log(chalk.blue(`syncing shows, please wait...`));
    // await ezDownload(400); // this MUST finish before proceeding
    // otherwise we have no local db
  }
  const showName = prompt("Enter show name: ");
  const [showId, showNameFull, year] = await showToId(showName);
  // Check local db for episodes
  const localEpisodes = await findEpisodesBySeriesId(showId);
  // Variable for API episodes if needed
  let apiEpisodes: Episode[];
  if (localEpisodes.length >= 1) {
    console.log(chalk.blue(`found ${localEpisodes.length} episodes locally`));
    console.log(chalk.blue(`found show name: ${showNameFull}`));
    apiEpisodes = localEpisodes;
    // immediately go to comparing local episode count phase
  } else {
    // Otherwise, program will fetch episodes for show from API
    console.log(chalk.blue(`Fetching episodes from API`));
    apiEpisodes = await fetchSeriesById(showId, `default`);
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
  // Test if we have this directory we are looking for
  // Folder might not have the date, need to account for that
  const targetDir = path.join(__dirname, `..`, `..`, `..`, showNameFull);
  const { children: seasonsDir } = dirTree(targetDir);
  if (seasonsDir !== undefined) {
    // LOOP OVER SEASON
    seasonsDir.forEach(async (season) => {
      const { children: episodes } = season;
      if (season.name.includes("Season")) {
        console.log(
          chalk.blue(
            `${season.name} contains ${episodes?.length ?? 0} episodes:`
          )
        );
        const apiEpisodesPerThisSeason = apiEpisodes?.filter((episode) => {
          return episode.seasonNumber === parseInt(season.name.split(" ")[1]);
        });
        // const apiEpisodesPerThisSeason = await prisma.episode.findMany({
        //   where: {
        //     seriesId: showId,
        //     seasonNumber: parseInt(season.name.split(" ")[1]),
        //   },
        // });
        if (
          episodes?.length !==
          apiEpisodesPerThisSeason.filter((episode) => {
            return !episode.name.startsWith(".");
          }).length
        ) {
          console.log(
            chalk.red(
              `${season.name} contains ${
                episodes?.length ?? 0
              } episodes locally but ${showNameFull} has ${
                apiEpisodesPerThisSeason.length
              } episodes on TVDB`
            )
          );
          throw new Error(
            `Local episode count does not match remote episode count`
          );
        }
        // The season number we'll be using in the episode name
        const seasonNumber = season.name.split(" ")[1];
        // LOOP OVER EPISODES IN SEASON
        let episodeCount = 1;
        episodes?.forEach((episode) => {
          console.log(chalk.bgCyan(`found ${episode.name}`));
          console.log({ episode });
          // check that episode ends in a proper extension
          FILE_FORMATS.forEach(async (format) => {
            if (episode.name.endsWith(format)) {
              console.log(chalk.cyan(`found ${episode.name}`));
              // Get episode title from local db
              // const localEpisodeName = episode.name.split(" ")[1];
              // console.log({ showId, seasonNumber, localEpisodeName });
              console.log(chalk.yellow(`episodeCount: ${episodeCount}`));
              const episodeTitle = await prisma.episode
                .findFirst({
                  where: {
                    AND: [
                      {
                        seriesId: showId,
                        seasonNumber: parseInt(seasonNumber),
                        number: episodeCount,
                      },
                    ],
                  },
                })
                .then((episode) => {
                  return episode?.name;
                });
              // console.log(chalk.yellow(episodeTitle));
              const newFileName = `${showNameFull} (${year}) {tvdb-${showId}} - s${seasonNumber}e${episodeCount.toLocaleString(
                "en-US",
                {
                  minimumIntegerDigits: 2,
                  useGrouping: false,
                }
              )} - ${episodeTitle}.${format}`;
              const filePathName = path.join(
                targetDir,
                season.name,
                episode.name
              );
              const newFilePathName = path.join(
                targetDir,
                season.name,
                newFileName
              );
              rename(filePathName, newFilePathName, function (err) {
                if (err) throw err;
                // console.log(`File Renamed to "${newFileName}"`);
              });
              episodeCount++;
              // For each season, replace filenames with episode names
              // Structured like Plex likes it
              // Optional TVDB id in the season folder name WITH CURLY BRACKETS
              // /Band of Brothers (2001)/Season 01/Band of Brothers (2001) - s01e01 - Currahee.mkv
              // /seriesName (year) {tvdb-#####}/Season ##/seriesName (year) - s##e## - episodeName.mkv
            }
          });
        });
      }
    });
  }
}

main();
