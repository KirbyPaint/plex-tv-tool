import { PrismaClient, Series } from "@prisma/client";

const prisma = new PrismaClient();

export async function mapSeriesToDatabaseEntry(
  entries: Series[]
): Promise<number> {
  let recordsInserted = 0;
  entries.forEach(async (entry) => {
    try {
      const create = {
        ...entry,
        nameTranslations: entry?.nameTranslations?.toString(),
        overviewTranslations: entry?.overviewTranslations?.toString(),
        aliases: entry?.aliases?.toString() ?? ``,
        status: entry?.status?.toString(),
        image: entry.image ?? ``,
        firstAired: entry?.firstAired ?? undefined,
        lastAired: entry?.lastAired ?? undefined,
        averageRuntime: entry.averageRuntime ?? undefined,
        originalCountry: entry.originalCountry ?? undefined,
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
