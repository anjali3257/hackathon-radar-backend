import mongoose from "mongoose";

const hackathonSchema = new mongoose.Schema({
  title: { type: String, required: true },
    sourceUrl: { type: String, required: true },
  listingUrl: { type: String }, // direct link to the specific hackathon page, if found
  sourcePlatform: { type: String }, // "devfolio", "unstop", "devpost", "mlh"

  rawContent: { type: String },

  deadline: { type: Date },
  eligibility: { type: String },
  teamSizeAllowed: { type: String },
  prizePool: { type: String },
    techFocus: [String],
  description: { type: String }, // short problem-statement/overview if available
  eventDates: { type: String }, // event timeline if mentioned (e.g. "Oct 5-7, 2026")

  relevanceScore: { type: Number, min: 0, max: 10 },
  reasoningNotes: { type: String },
  urgencyFlag: { type: Boolean, default: false },

  registrationStatus: {
    type: String,
    enum: ["not_registered", "form_drafted", "submitted"],
    default: "not_registered",
  },

  foundAt: { type: Date, default: Date.now },
});

export default mongoose.model("Hackathon", hackathonSchema);