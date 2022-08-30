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

// ok so basically this function will ask for an input from the user
// and that input somehow will determine what show is pulled
// probably do the show ID, and then get all episodes based on id

function promptUser(): void {
  prompt.start();
  prompt.get([`doTheThing`], (err, result) => {
    if (err) {
      throw new Error(err as unknown as string);
    }
    fetchSeriesEpisodesById(result.doTheThing.toString(), `default`);
  });
}
async function main(): Promise<void> {
  promptUser();
  downloadAPIThings(false);
}

main();
