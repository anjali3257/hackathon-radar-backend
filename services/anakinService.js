import axios from "axios";

const ANAKIN_BASE_URL = "https://api.anakin.io/v1";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeUrl(url) {
  const submitResponse = await axios.post(
    `${ANAKIN_BASE_URL}/url-scraper`,
    { url: url, useBrowser: true },
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.ANAKIN_API_KEY,
      },
    }
  );

  const jobId = submitResponse.data.jobId;

  for (let attempt = 0; attempt < 30; attempt++) {
    await wait(2000);

    const pollResponse = await axios.get(`${ANAKIN_BASE_URL}/url-scraper/${jobId}`, {
      headers: {
        "X-API-Key": process.env.ANAKIN_API_KEY,
      },
    });

    if (pollResponse.data.status === "completed") {
      return pollResponse.data;
    }

    if (pollResponse.data.status === "failed") {
      throw new Error("Anakin scrape job failed");
    }
  }

  throw new Error("Anakin scrape job timed out after 60 seconds");
}

async function scrapeMultiple(urls) {
  const results = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const result = await scrapeUrl(urls[i]);
      results.push({ url: urls[i], success: true, data: result });
    } catch (error) {
      console.log(`Failed to scrape ${urls[i]}:`, error.message);
      results.push({ url: urls[i], success: false, error: error.message });
    }
  }

  return results;
}

export { scrapeUrl, scrapeMultiple };