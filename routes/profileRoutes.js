import express from "express";
import UserProfile from "../models/UserProfile.js";

const router = express.Router();

// GET /api/profile - fetch the current profile (single-user demo, so just get the one)
router.get("/", async (req, res) => {
  try {
    const profile = await UserProfile.findOne();
    res.json(profile || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/profile - create or update the profile
router.post("/", async (req, res) => {
  try {
    const { name, techStack, interests, studentOnly, email, collegeName } = req.body;

    let profile = await UserProfile.findOne();

    if (profile) {
      profile.name = name;
      profile.techStack = techStack;
      profile.interests = interests;
      profile.studentOnly = studentOnly;
      profile.email = email;
      profile.collegeName = collegeName;
      await profile.save();
    } else {
      profile = await UserProfile.create({
        name,
        techStack,
        interests,
        studentOnly,
        email,
        collegeName,
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;