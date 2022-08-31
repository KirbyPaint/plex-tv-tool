import { Episode, PrismaClient } from "@prisma/client";
import axios from "axios";
import { readdirSync, writeFileSync } from "fs";
import path from "path";
import { mapEpisodeToDatabaseEntry } from "./mapEpisodeToDatabaseEntry";
import chalk from "chalk";
import { mapSeriesToDatabaseEntry } from "./mapSeriesToDatabaseEntry";

const prisma = new PrismaClient();
const log = console.log;

// Need to break this up into other functions
export async function fetchSeriesEpisodesById(
  showName: string,
  seasonType: string
): Promise<void> {
  // first, search the existing db for the show
  // to try and avoid making extra calls to the API
  const existingShows = await prisma.series.findMany({
    where: { name: { contains: showName } },
  });
  log(chalk.blue(`this search found ${existingShows.length} results`));
  log({ existingShows });
  if (existingShows.length > 0) {
    log(chalk.green(`hey look we probably already downloaded it`));
    log(`defaulting to the first result: ${existingShows[0].name}`);
    const episodes = await prisma.episode.findMany({
      where: { seriesId: existingShows[0].id },
    });
    log(
      chalk.blue(
        `we have ${episodes.length} episodes of show ${existingShows[0].name} in the TVDB records`
      )
    );
    log(chalk.blue(`scanning local files for episode count`));
    // This will presumably run in the folder where the show's seasons lie
    // Recursively scan the folder for seasons containing episodes
    if (!existingShows[0].name) {
      throw new Error(`you're on your own`);
    }
    const tryPath = path.resolve(__dirname, `../../../`, existingShows[0].name);
    const dirents = readdirSync(tryPath, { withFileTypes: true });
    const filesNames = dirents
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name);
    log(
      chalk.blue(
        `found ${filesNames.length} files in local ${existingShows[0].name} directory`
      )
    );
    if (filesNames.length !== episodes.length) {
      log(
        chalk.red(
          `Episode count mismatch between TVDB and local files, consider manually reviewing episode list before mass-renaming to prevent inconsistency`
        )
      );
      return;
    }
    // readdir(
    //   tryPath,
    //   { withFileTypes: true },
    //   function (err: NodeJS.ErrnoException | null, files: string[]) {
    //     //handling error
    //     if (err) {
    //       return log(`Unable to scan directory: ` + err);
    //     }
    //     //listing all files using forEach
    //     files.forEach(function (file) {
    //       // Do whatever you want to do with the file
    //       log(file);
    //     });
    //   }
    // );
    return;
  }
  // if we get here, we need to fetch the show from the API
  // if (matching.length === 0) {
  //   log(chalk.blue(`fetching show ${showName} from the API`));
  //   fetchSeriesById(id, seasonType);
  // }
}

// plain function only to fetch the show episodes from the API
// THIS IS THE ONE TO USE TO GET EPISODES ONLY FROM API
export async function fetchEpisodesBySeriesId(
  id: number,
  seasonType?: string
): Promise<Episode[]> {
  const baseUrl = process.env.BASE_URL;
  const url = new URL(
    baseUrl + `series/` + id + `/episodes/` + (seasonType ?? `default`)
  ).pathname;
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ` + process.env.BEARER,
      },
    });
    return response.data;
  } catch (e) {
    throw new Error(e as unknown as string);
  }
}

// This should just download into the database
export async function fetchSeriesById(
  id: number,
  seasonType?: string
): Promise<Episode[] | Error | undefined> {
  let episodes;
  const baseUrl = process.env.BASE_URL;
  const url = new URL(
    baseUrl + `series/` + id + `/episodes/` + (seasonType ?? `default`)
  ).pathname;
  const existingShow = await prisma.series.findFirst({
    where: { id },
  });
  if (existingShow?.name) {
    log(
      chalk.blue(
        `show ${existingShow.name} already exists in the local database`
      )
    );
    log(chalk.blue(`Checking for episodes`));
  }
  const existingEpisodes = await prisma.episode.findMany({
    where: { seriesId: id },
  });
  if (existingEpisodes.length > 0) {
    log(
      chalk.blue(
        `we have ${existingEpisodes.length} episodes of show ${existingShow?.name} in the local database`
      )
    );
    return existingEpisodes;
  }
  log(chalk.blue(`fetching show with id ${id} from the API`));
  const apiEpisodes = await fetchEpisodesBySeriesId(id, seasonType);
  if (apiEpisodes instanceof Error) {
    throw new Error(apiEpisodes.message);
  }
  if (apiEpisodes?.length === 0) {
    log(chalk.red(`no episodes found for show with id ${id}`));
    return;
  }
  log(
    chalk.blue(`found ${apiEpisodes.length} episodes for show with id ${id}`)
  );
  log(chalk.blue(`mapping episodes to database entries`));
  await mapEpisodeToDatabaseEntry(apiEpisodes);
}

export async function showToId(showName: string): Promise<number> {
  const show = await prisma.series.findFirstOrThrow({
    where: { name: { contains: showName } },
  });
  return show.id;
}

export async function fetchAllShows(
  doTheThing: boolean,
  pageNumber: string
): Promise<void> {
  if (doTheThing) {
    const url = process.env.BASE_URL;
    try {
      await axios
        .get(url + `series?page=${pageNumber}`, {
          headers: {
            Authorization: `Bearer ` + process.env.BEARER,
          },
        })
        .then(async (res) => {
          await mapSeriesToDatabaseEntry(res.data.data);
        });
    } catch (e) {
      throw new Error(e as unknown as string);
    }
  }
}
