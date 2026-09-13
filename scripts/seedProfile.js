import "dotenv/config";
import mongoose from "mongoose";
import UserProfile from "../models/UserProfile.js";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // Clear any existing profile first, then insert a fresh one
  await UserProfile.deleteMany({});

  const profile = await UserProfile.create({
    name: "Anjali",
    techStack: ["React", "Node.js", "Express", "MongoDB", "Claude API"],
    interests: ["AI agents", "web development", "DSA"],
    studentOnly: true,
    preferredTeamSize: 3,
    email: "your-email@example.com",
    collegeName: "IGDTUW",
  });

  console.log("Profile created:", profile);
  await mongoose.disconnect();
}

main();