import { PrismaClient } from "@prisma/client";
import { readdir, readFile } from "fs";
import path from "path";
import { mapSeriesToDatabaseEntry } from "../src/utils/database-functions";
import { TOUCH_GRASS_OPTIONS } from "../src/utils/consts";

const prisma = new PrismaClient();
async function seedSeries() {
  const activity =
    TOUCH_GRASS_OPTIONS[Math.floor(Math.random() * TOUCH_GRASS_OPTIONS.length)];
  // Get list of ALL files in the data folder
  // Eventually, it would be cool if this path name was flexible
  // Right now, this is a data folder located in the same directory
  // as the entire project is located
  const pathName = path.join(__dirname, `..`, `..`, `data`);
  readdir(pathName, async (err, files) => {
    if (err) {
      console.error(err);
      return;
    }
    // Filter out all of the files that aren't .json
    const jsonFiles = files.filter((file) => file.endsWith(".json"));
    const totalCount = await prisma.series.count();
    if (totalCount >= jsonFiles.length) {
      console.log(
        `more shows in local db than tvdb, skipping seeding, you've earned a break, go ${activity}`
      );
      return;
    }
    console.log(
      `seeding ${jsonFiles.length} series, takes up to 5 minutes, go ${activity}`
    );
    // each of these files is named by their ID
    // have db check if the ID exists BEFORE seeding
    // Read each file and import it into the database
    jsonFiles.forEach((file) => {
      readFile(path.join(pathName, file), async (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        const fileId = parseInt(file.split(".")[0]);
        const exists = await prisma.series.findUnique({
          where: { id: fileId },
        });
        if (exists) {
          return;
        }
        const series = JSON.parse(data.toString());
        mapSeriesToDatabaseEntry([series]);
      });
    });
    return;
  });
}
// function seedEpisodes() {}

async function main() {
  await prisma.$connect();
  await seedSeries();
  await prisma.$disconnect();
}

main();
