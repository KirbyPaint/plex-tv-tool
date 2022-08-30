import { Episode, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function mapEpisodeToDatabaseEntry(
  entries: Episode[]
): Promise<number> {
  let recordsInserted = 0;
  entries.forEach(async (entry) => {
    try {
      const create = {
        ...entry,
        nameTranslations: entry?.nameTranslations?.toString(),
        overviewTranslations: entry?.overviewTranslations?.toString(),
      };
      await prisma.episode.upsert({
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
