import axios from "axios";
import dotenv from "dotenv";
import { mapSeriesToDatabaseEntry } from "./utils/mapSeriesToDatabaseEntry";
// import prompt from "prompt";
import {
  fetchAllShows,
  fetchSeriesById,
  fetchSeriesEpisodesById,
  showToId,
} from "./utils/api";
import ReadLine from "readline";

import { readdirSync, writeFileSync } from "fs";

const rl = ReadLine.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const prompt = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

dotenv.config();

function promptUser(): void {
  // prompt.start();
  // prompt.get([`fetchShows`, `showName`, `pageNumber`], (err, result) => {
  //   if (err) {
  //     throw new Error(err as unknown as string);
  //   }
  //   if ([`yes`, `1`].includes(result.fetchShows.toString().toLowerCase())) {
  //     downloadAPIThings(true, result.pageNumber.toString());
  //   }
  //   fetchSeriesEpisodesById(result.showName.toString(), `default`);
  // });
}

async function testing(): Promise<void> {
  try {
    const test = prompt(`Enter something`);
    console.log(test);
    rl.close();
  } catch (e) {
    throw new Error(e as unknown as string);
  }
  rl.on("close", () => process.exit(0));
}

async function main(): Promise<void> {
  (async () => {
    try {
      const fetchShows = await prompt("Re-fetch database? (yes/no) ");
      if ([`yes`, `1`].includes(fetchShows.toString().toLowerCase())) {
        const pages = [...Array(400).keys()].map((x) => (x++).toString());
        pages.forEach(async (page) => {
          await fetchAllShows(true, page);
        });
      }
      const showName = await prompt(`Lookup show: `);
      const showId = await showToId(showName);
      const episodes = await fetchSeriesById(showId, `default`);
      if (episodes instanceof Error) {
        throw new Error(episodes.message);
      }
      if (episodes?.length === 0) {
        console.log(`no episodes found for show with id ${showId}`);
        return;
      }
      console.log(episodes);
      rl.close();
    } catch (e) {
      console.error("unable to prompt", e);
    }
  })();

  rl.on("close", () => process.exit(0));
}

main();
