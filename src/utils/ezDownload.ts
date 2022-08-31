import { fetchAllShows } from "./api";

export function ezDownload(pages: string[]): void {
  pages.forEach(async (page) => {
    await fetchAllShows(true, page);
  });
}
