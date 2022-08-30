import { writeFileSync } from "fs";

function downloadAPIThings() {
  console.log("downloading api things");
  const fakeJSON = {
    hello: "world",
  };
  writeFileSync("api-things.json", JSON.stringify(fakeJSON), "utf8");
}

function main(): void {
  downloadAPIThings();
}

main();
