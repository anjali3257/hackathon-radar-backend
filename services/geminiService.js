import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
// Takes the messy raw markdown from one source + the user's profile,
// and asks Gemini to pull out real hackathon listings with reasoning.
// Returns an array of structured hackathon objects.
async function extractAndRank(rawMarkdown, sourcePlatform, userProfile) {
  const prompt = `
You are helping a student find relevant hackathons from scraped website content.

Below is raw scraped markdown from ${sourcePlatform}. It contains a mix of
real hackathon listings and irrelevant page noise (navigation, icons, ads).

STUDENT PROFILE:
- Tech stack: ${userProfile.techStack.join(", ")}
- Interests: ${userProfile.interests.join(", ")}
- Student only: ${userProfile.studentOnly}

TASK:
1. Find actual hackathon/competition listings in the content below (ignore navigation, ads, icons, unrelated text).
2. For each real listing found, extract: title, deadline (if mentioned), eligibility, prize pool (if mentioned), tech focus areas, a direct URL to that specific hackathon's page (markdown links look like [text](url) - find the one that points to this hackathon's own page, not the general listings page), a one-sentence description/problem-statement if visible, and event timeline dates if mentioned (e.g. "Oct 5-7, 2026").
3. Give each one a relevanceScore from 0-10 based on fit with the student profile.
4. Add a short reasoningNotes explaining the score in one sentence.
5. Set urgencyFlag to true if the deadline is within the next 5 days (assume today's date if not given, otherwise leave false).

Respond ONLY with a valid JSON array, no other text, in this exact format:
[
  {
    "title": "...",
    "deadline": "...",
    "eligibility": "...",
    "prizePool": "...",
    "techFocus": ["..."],
    "listingUrl": "...",
    "description": "...",
    "eventDates": "...",
    "relevanceScore": 0,
    "reasoningNotes": "...",
    "urgencyFlag": false
  }
]

If listingUrl, description, or eventDates are not found, use an empty string "" for that field.

If you find no real hackathon listings in the content, respond with an empty array: []

RAW CONTENT:
${rawMarkdown.slice(0, 8000)}
`;

  // Retry up to 3 times if Gemini is temporarily overloaded (503) or
  // returns something we can't parse - keeps one bad source from
  // crashing the whole analyze run.
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Gemini sometimes wraps JSON in markdown code fences - strip those if present
      const cleaned = responseText.replace(/```json|```/g, "").trim();

      return JSON.parse(cleaned);
    } catch (error) {
      lastError = error;
      console.log(`Gemini attempt ${attempt + 1} for ${sourcePlatform} failed:`, error.message);

      if (attempt < 2) {
        // wait a bit longer each retry - 3s, then 6s
        await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
      }
    }
  }

  console.log(`All Gemini retries failed for ${sourcePlatform}:`, lastError.message);
  return [];
}

export { extractAndRank };