import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  techStack: [String],
  interests: [String],
  studentOnly: { type: Boolean, default: true },
  preferredTeamSize: { type: Number },

  email: { type: String },
  phone: { type: String },
  collegeName: { type: String },
});

export default mongoose.model("UserProfile", userProfileSchema);