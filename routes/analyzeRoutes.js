import express from "express";
import Hackathon from "../models/Hackathon.js";
import UserProfile from "../models/UserProfile.js";
import { extractAndRank } from "../services/geminiService.js";

const router = express.Router();

// Gemini sometimes returns dates that JS can't parse (like "TBA", "Rolling",
// or a format Date() doesn't understand). This safely returns undefined
// instead of crashing the whole save.
function parseDeadline(dateString) {
  if (!dateString) return undefined;

  const parsed = new Date(dateString);

  if (isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

// Calculates urgency ourselves instead of trusting Gemini's guess -
// more reliable since Gemini doesn't reliably know "today's date".
function calculateUrgency(deadlineDate) {
  if (!deadlineDate) return false;

  const now = new Date();
  const diffInMs = deadlineDate.getTime() - now.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // urgent if deadline is within the next 5 days (and hasn't already passed)
  return diffInDays >= 0 && diffInDays <= 5;
}

// POST /api/analyze/run - reads the raw scanned entries, runs Gemini
// reasoning on each one, and saves structured hackathon listings
router.post("/run", async (req, res) => {
  try {
    // Get the raw scan entries (the ones we saved in Day 2)
    const rawEntries = await Hackathon.find({ title: /^Raw scan/ });

    if (rawEntries.length === 0) {
      return res.status(400).json({ error: "No raw scan data found. Run /api/scan/run first." });
    }

    // For now we just use the one profile in the DB (single-user demo)
    const userProfile = await UserProfile.findOne();

    if (!userProfile) {
      return res.status(400).json({ error: "No user profile found. Run seedProfile.js first." });
    }

    const allExtracted = [];

    for (const rawEntry of rawEntries) {
      console.log(`Analyzing ${rawEntry.sourcePlatform}...`);

      const extractedListings = await extractAndRank(
        rawEntry.rawContent,
        rawEntry.sourcePlatform,
        userProfile
      );

      // Save each extracted listing as its own Hackathon document
      for (const listing of extractedListings) {
        const parsedDeadline = parseDeadline(listing.deadline);

               const saved = await Hackathon.create({
          title: listing.title,
          sourceUrl: rawEntry.sourceUrl,
          listingUrl: listing.listingUrl || rawEntry.sourceUrl,
          sourcePlatform: rawEntry.sourcePlatform,
          deadline: parsedDeadline,
          eligibility: listing.eligibility,
          prizePool: listing.prizePool,
          techFocus: listing.techFocus,
          description: listing.description,
          eventDates: listing.eventDates,
          relevanceScore: listing.relevanceScore,
          reasoningNotes: listing.reasoningNotes,
          urgencyFlag: calculateUrgency(parsedDeadline),
        });

        allExtracted.push(saved);
      }
    }

        if (allExtracted.length === 0) {
      return res.status(200).json({
        message: "No listings extracted. This usually means the AI service is temporarily rate-limited - please wait a minute and try again.",
        listings: [],
        warning: true,
      });
    }

        if (allExtracted.length === 0) {
      return res.status(200).json({
        message: "No listings extracted. This usually means the AI service is temporarily rate-limited - please wait a minute and try again.",
        listings: [],
        warning: true,
      });
    }

       if (allExtracted.length === 0) {
      return res.status(200).json({
        message: "No listings extracted. This usually means the AI service is temporarily rate-limited - please wait a minute and try again.",
        listings: [],
        warning: true,
      });
    }

      if (allExtracted.length === 0) {
      return res.status(200).json({
        message: "No listings extracted. This usually means the AI service is temporarily rate-limited - please wait a minute and try again.",
        listings: [],
        warning: true,
      });
    }

    res.json({
      message: `Analysis complete. Extracted ${allExtracted.length} hackathon listings.`,
      listings: allExtracted,
    });
  } catch (error) {
    console.log("Analysis failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analyze/ranked - fetch structured listings, sorted by relevance
router.get("/ranked", async (req, res) => {
  const listings = await Hackathon.find({ title: { $not: /^Raw scan/ } }).sort({
    relevanceScore: -1,
  });
  res.json(listings);
});

export default router;