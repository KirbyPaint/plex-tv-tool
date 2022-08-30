import { writeFileSync } from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function downloadAPIThings() {
  const url = process.env.BASE_URL;
  console.log("downloading api things");
  try {
    await axios
      .get(url + "series", {
        headers: {
          Authorization: "Bearer " + process.env.BEARER,
        },
      })
      .then((res) => {
        console.log(res);
        writeFileSync("./series.json", JSON.stringify(res.data));
      });
  } catch (e) {
    console.log(e);
  }
}

function main(): void {
  // downloadAPIThings();
}

main();
