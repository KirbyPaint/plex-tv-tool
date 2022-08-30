import { writeFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";
import { mapSeriesToDatabaseEntry } from "./utils/utils";

dotenv.config();

async function downloadAPIThings(): Promise<void> {
  const url = process.env.BASE_URL;
  console.log(`downloading api things`);
  let count = 0;
  try {
    await axios
      .get(url + `series`, {
        headers: {
          Authorization: `Bearer ` + process.env.BEARER,
        },
      })
      .then(async (res) => {
        console.log(res);
        count = await mapSeriesToDatabaseEntry(res.data.data);
        writeFileSync(`./series.json`, JSON.stringify(res.data));
      });
  } catch (e) {
    console.log(e);
  }
  console.log(`${count} things downloaded`);
}

function main(): void {
  downloadAPIThings();
}

main();
