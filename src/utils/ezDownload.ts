import { PrismaClient, Series } from "@prisma/client";
import chalk from "chalk";
import { writeFileSync } from "fs";
import { fetchSeriesByPageNumber } from "./api";

const prisma = new PrismaClient();

export async function ezDownload(page: number): Promise<any[]> {
  const pages = [...Array(page).keys()].map((x) => (x++).toString());
  const result: Series[] = [];
  pages.forEach(async (page) => {
    const data = await fetchSeriesByPageNumber(true, page);
    data.data.data.forEach((series: Series) => {
      writeFileSync(`./src/data/${series.id}.json`, JSON.stringify(series));
      console.log(chalk.blue(`adding ${series.name} to the database`));
    });
    // console.log(data.data.data);
    result.push(data.data.data.series);
  });
  await prisma.lastSyncedAt.create({
    data: {},
  });
  return result;
}
