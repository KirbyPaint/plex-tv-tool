import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { writeFileSync } from "fs";
import { mapEpisodeToDatabaseEntry } from "./mapEpisodeToDatabaseEntry";

const prisma = new PrismaClient();

export async function fetchSeriesEpisodesById(
  showName: string,
  seasonType: string
): Promise<void> {
  // first, search the existing db for the show
  // to try and avoid making extra calls to the API
  const existingShow = await prisma.series.findFirstOrThrow({
    where: { name: showName },
  });
  if (existingShow) {
    console.log(`hey look we already downloaded it`);
    return;
  }
  // if (existingShow) {
  //   // if the show is in the db, then we can just get the episodes from the db
  //   const episodes = await prisma.episodes.findMany({
  //     where: { seriesId: existingShow.id },
  //   });
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
