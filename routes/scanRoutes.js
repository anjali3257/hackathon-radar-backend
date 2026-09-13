import express from "express";
import Hackathon from "../models/Hackathon.js";
import { scrapeMultiple } from "../services/anakinService.js";

const router = express.Router();

// Sources we're scanning - starting with 2-3 to keep it manageable and testable
const SOURCES = [
  { url: "https://unstop.com/hackathons", platform: "unstop" },
  { url: "https://devfolio.co/hackathons/open", platform: "devfolio" },
  { url: "https://devpost.com/hackathons", platform: "devpost" },
  { url: "https://mlh.io/seasons/2026/events", platform: "mlh" },
];

// POST /api/scan/run - triggers a fresh scan of all sources and saves raw results
router.post("/run", async (req, res) => {
  try {
    console.log("Starting scan of", SOURCES.length, "sources...");
 // Clear old data before scanning fresh - prevents duplicate listings
    // from piling up every time we run a scan
    await Hackathon.deleteMany({});
    
    const urls = SOURCES.map((source) => source.url);
    const results = await scrapeMultiple(urls);

    const savedEntries = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const source = SOURCES[i];

      if (!result.success) {
        console.log(`Skipping ${source.platform} - scrape failed`);
        continue;
      }

      // For now we save the raw markdown as one entry per source.
      // Day 3 (reasoning layer) will parse this into individual hackathon
      // listings with proper titles/deadlines/etc.
      const entry = await Hackathon.create({
        title: `Raw scan - ${source.platform}`,
        sourceUrl: source.url,
        sourcePlatform: source.platform,
        rawContent: result.data.markdown,
      });

      savedEntries.push(entry);
    }

    res.json({
      message: `Scan complete. Saved ${savedEntries.length} entries.`,
      entries: savedEntries,
    });
  } catch (error) {
    console.log("Scan failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/scan/results - just fetches whatever's currently saved
router.get("/results", async (req, res) => {
  const entries = await Hackathon.find().sort({ foundAt: -1 });
  res.json(entries);
});

export default router;