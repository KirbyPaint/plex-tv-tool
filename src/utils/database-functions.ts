import { Episode, PrismaClient, Series } from "@prisma/client";

const prisma = new PrismaClient();

export async function findEpisodesBySeriesId(
  seriesId: number
): Promise<Episode[]> {
  const episodes = await prisma.episode.findMany({
    where: { seriesId },
  });
  return episodes;
}

export async function mapSeriesToDatabaseEntry(
  entries: Series[]
): Promise<number> {
  let recordsInserted = 0;
  entries.forEach(async (entry) => {
    try {
      const create = {
        ...entry,
        nameTranslations: JSON.stringify(entry?.nameTranslations),
        overviewTranslations: JSON.stringify(entry?.overviewTranslations),
        aliases: JSON.stringify(entry?.aliases) ?? ``,
        status: JSON.stringify(entry?.status),
        image: entry.image ?? ``,
        firstAired: entry?.firstAired ?? undefined,
        lastAired: entry?.lastAired ?? undefined,
        averageRuntime: entry.averageRuntime ?? undefined,
        originalCountry: entry.originalCountry ?? undefined,
        name: entry.name ?? undefined,
      };
      await prisma.series.upsert({
        where: { id: entry.id },
        create,
        update: create,
      });
      recordsInserted++;
    } catch (e) {
      throw new Error(e as unknown as string);
    }
  });
  return recordsInserted;
}
