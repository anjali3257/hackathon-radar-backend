import { chromium } from "playwright";

// Keeps the browser page open between "fill" and "submit" steps so we
// can show the user a preview before committing to the final action.
const activeSessions = new Map();

// Step 1: opens the mock page and fills it, but does NOT submit yet.
// Returns a sessionId + screenshot so the user can review before confirming.
async function fillRegistration(hackathonTitle, userProfile) {
 const browser = await chromium.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
  const page = await browser.newPage();

  const url = `http://localhost:${process.env.PORT || 5000}/mock-register.html?title=${encodeURIComponent(hackathonTitle)}`;

  await page.goto(url);

  await page.fill("#name", userProfile.name);
  await page.fill("#email", userProfile.email || "not-provided@example.com");
  await page.fill("#college", userProfile.collegeName || "Not specified");
  await page.fill("#techStack", userProfile.techStack.join(", "));

  const sessionId = `session-${Date.now()}`;
  const screenshotPath = `public/screenshots/${sessionId}.png`;
  await page.screenshot({ path: screenshotPath });

  // keep browser + page open, waiting for user confirmation
  activeSessions.set(sessionId, { browser, page });

  return {
    sessionId,
    screenshotPath: screenshotPath.replace("public", ""),
  };
}

// Step 2: user has reviewed the screenshot and confirmed - now actually click submit.
async function confirmSubmit(sessionId) {
  const session = activeSessions.get(sessionId);

  if (!session) {
    throw new Error("Session expired or not found. Please fill the form again.");
  }

  const { browser, page } = session;

  await page.click("button[type=submit]");
  const confirmationVisible = await page.isVisible("#confirmation");

  await browser.close();
  activeSessions.delete(sessionId);

  return { success: confirmationVisible };
}

export { fillRegistration, confirmSubmit };