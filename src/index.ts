import axios from "axios";
import dotenv from "dotenv";
import { mapSeriesToDatabaseEntry } from "./utils/utils";

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
      console.log(e);
    }
  }
}

function main(): void {
  downloadAPIThings(false);
}

main();
