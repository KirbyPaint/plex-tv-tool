import { Episode, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function mapEpisodeToDatabaseEntry(
  entries: Episode[]
): Promise<number> {
  entries.forEach(async (entry) => {
    try {
      const create = {
        ...entry,
        nameTranslations: JSON.stringify(entry?.nameTranslations),
        overviewTranslations: JSON.stringify(entry?.overviewTranslations),
      };
      await prisma.episode.upsert({
        where: { id: entry.id },
        create,
        update: create,
      });
    } catch (e) {
      throw new Error(e as unknown as string);
    }
  });
  return entries.length; // I want this to be the number from the await, ideally
  // confirming exactly how many entries got created
}
