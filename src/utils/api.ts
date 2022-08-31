import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { readdir, readdirSync, writeFileSync } from "fs";
import path from "path";
import { mapEpisodeToDatabaseEntry } from "./mapEpisodeToDatabaseEntry";

const prisma = new PrismaClient();

export async function fetchSeriesEpisodesById(
  showName: string,
  seasonType: string
): Promise<void> {
  // first, search the existing db for the show
  // to try and avoid making extra calls to the API
  const existingShows = await prisma.series.findMany({
    where: { name: { contains: showName } },
  });
  console.log(`this search found ${existingShows.length} results`);
  if (existingShows) {
    console.log(`hey look we probably already downloaded it`);
    console.log(`defaulting to the first result: ${existingShows[0].name}`);
    const episodes = await prisma.episode.findMany({
      where: { seriesId: existingShows[0].id },
    });
    console.log(
      `we have ${episodes.length} episodes of show ${existingShows[0].name} in the TVDB records`
    );
    console.log(`scanning local files for episode count`);
    // This will presumably run in the folder where the show's seasons lie
    // Recursively scan the folder for seasons containing episodes
    const tryPath = path.resolve(__dirname, `../../../`, existingShows[0].name);
    const dirents = readdirSync(tryPath, { withFileTypes: true });
    const filesNames = dirents
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name);
    console.log(
      `found ${filesNames.length} files in local ${existingShows[0].name} directory`
    );
    if (filesNames.length !== episodes.length) {
      console.log(
        `Episode count mismatch between TVDB and local files, consider manually reviewing episode list before mass-renaming to prevent inconsistency`
      );
      return;
    }
    // readdir(
    //   tryPath,
    //   { withFileTypes: true },
    //   function (err: NodeJS.ErrnoException | null, files: string[]) {
    //     //handling error
    //     if (err) {
    //       return console.log(`Unable to scan directory: ` + err);
    //     }
    //     //listing all files using forEach
    //     files.forEach(function (file) {
    //       // Do whatever you want to do with the file
    //       console.log(file);
    //     });
    //   }
    // );
    return;
  }
  // if (existingShow) {
  //   // if the show is in the db, then we can just get the episodes from the db
  //   console.log(episodes);
  // } else {
  // search the db for shows matching the showName
  const matching = await prisma.series.findMany({
    where: { name: showName },
  });
  if (matching.length === 0) {
    throw new Error(`No show found with name ${showName}`);
  }
  const id = matching[0].id;

  const url = process.env.BASE_URL;
  try {
    await axios
      .get(url + `series/` + id + `/episodes/` + seasonType, {
        headers: {
          Authorization: `Bearer ` + process.env.BEARER,
        },
      })
      .then(async (res) => {
        console.log(res.data.data.episodes);
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
