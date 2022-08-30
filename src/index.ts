import axios from "axios";
import dotenv from "dotenv";
import { mapSeriesToDatabaseEntry } from "./utils/mapSeriesToDatabaseEntry";
import prompt from "prompt";
import { fetchSeriesEpisodesById } from "./utils/api";

dotenv.config();

async function downloadAPIThings(doTheThing: boolean): Promise<void> {
  if (doTheThing) {
    const url = process.env.BASE_URL;
    try {
      await axios
        .get(url + `series`, {
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
  prompt.get([`fetchShows`, `showName`], (err, result) => {
    if (err) {
      throw new Error(err as unknown as string);
    }
    if ([`yes`, `1`].includes(result.fetchShows.toString().toLowerCase())) {
      downloadAPIThings(true);
    }
    fetchSeriesEpisodesById(result.showName.toString(), `default`);
  });
}
async function main(): Promise<void> {
  promptUser();
}

main();
