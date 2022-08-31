import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { readdirSync, writeFileSync } from "fs";
import path from "path";
import { mapEpisodeToDatabaseEntry } from "./mapEpisodeToDatabaseEntry";
import chalk from "chalk";

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

// This should just download into the database
export async function fetchSeriesById(
  id: number,
  seasonType?: string
): Promise<void> {
  const baseUrl = process.env.BASE_URL;
  const url = new URL(
    baseUrl + `series/` + id + `/episodes/` + (seasonType ?? `default`)
  ).pathname;
  log(chalk.blue(`fetching show with id ${id} from the API`));
  try {
    await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ` + process.env.BEARER,
        },
      })
      .then(async (res) => {
        log(res.data.data.episodes);
        writeFileSync(
          `./episodes.json`,
          JSON.stringify(res.data.data.episodes)
        );
        await mapEpisodeToDatabaseEntry(res.data.data.episodes);
      });
  } catch (e) {
    throw new Error(e as unknown as string);
  }
}
