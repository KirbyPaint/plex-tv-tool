import { PrismaClient, Series } from "@prisma/client";

const prisma = new PrismaClient();

// I mean I don't really need create
export async function create(data: Series): Promise<Series> {
  const series = await prisma.series.create({
    data,
  });
  return series;
}

export async function findAll(): Promise<Series[]> {
  const series = await prisma.series.findMany();
  return series;
}
