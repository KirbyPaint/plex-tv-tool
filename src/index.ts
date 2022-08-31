import axios from "axios";
import dotenv from "dotenv";
import { mapSeriesToDatabaseEntry } from "./utils/mapSeriesToDatabaseEntry";
import prompt from "prompt";
import { fetchSeriesEpisodesById } from "./utils/api";

dotenv.config();

async function downloadAPIThings(
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

function promptUser(): void {
  prompt.start();
  prompt.get([`fetchShows`, `showName`, `pageNumber`], (err, result) => {
    if (err) {
      throw new Error(err as unknown as string);
    }
    if ([`yes`, `1`].includes(result.fetchShows.toString().toLowerCase())) {
      downloadAPIThings(true, result.pageNumber.toString());
    }
    fetchSeriesEpisodesById(result.showName.toString(), `default`);
  });
}

function ezDownload(pages: string[]): void {
  pages.forEach(async (page) => {
    await downloadAPIThings(true, page);
  });
}
async function main(): Promise<void> {
  const offset = 100;
  const pages = [...Array(100).keys()].map((x) => (offset + x++).toString());
  ezDownload(pages);
}

main();
