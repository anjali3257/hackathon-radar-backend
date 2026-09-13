import "dotenv/config";
import { scrapeUrl } from "../services/anakinService.js";

async function main() {
  const testUrl = "https://unstop.com/hackathons";

  console.log("Scraping:", testUrl);
  console.log("---");

  try {
    const result = await scrapeUrl(testUrl);
    console.log("Status:", result.status);
    console.log("Markdown preview (first 1000 chars):");
    console.log(result.markdown.slice(0, 1000));
  } catch (error) {
    console.log("Scrape failed:", error.response ? error.response.data : error.message);
  }
}

main();