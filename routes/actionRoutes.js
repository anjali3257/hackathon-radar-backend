import express from "express";
import Hackathon from "../models/Hackathon.js";
import UserProfile from "../models/UserProfile.js";
import { fillRegistration, confirmSubmit } from "../services/actionService.js";

const router = express.Router();

// POST /api/action/prepare/:hackathonId - fills the form, returns a
// screenshot for the user to review BEFORE anything is submitted
router.post("/prepare/:hackathonId", async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found" });
    }

    const userProfile = await UserProfile.findOne();
    if (!userProfile) {
      return res.status(400).json({ error: "No user profile found" });
    }

    const result = await fillRegistration(hackathon.title, userProfile);

    hackathon.registrationStatus = "form_drafted";
    await hackathon.save();

    res.json({
      message: `Form filled for "${hackathon.title}". Review the screenshot, then confirm to submit.`,
      sessionId: result.sessionId,
      screenshot: result.screenshotPath,
    });
  } catch (error) {
    console.log("Prepare failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/action/confirm/:hackathonId - actually submits, only called
// after the user has seen the screenshot and approved it
router.post("/confirm/:hackathonId", async (req, res) => {
  try {
    const { sessionId } = req.body;
    const hackathon = await Hackathon.findById(req.params.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found" });
    }

    const result = await confirmSubmit(sessionId);

    hackathon.registrationStatus = result.success ? "submitted" : "form_drafted";
    await hackathon.save();

    res.json({
      message: `Registration ${result.success ? "submitted" : "failed"} for "${hackathon.title}"`,
      hackathon: hackathon,
    });
  } catch (error) {
    console.log("Confirm failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;