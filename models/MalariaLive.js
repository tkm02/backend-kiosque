const mongoose = require("mongoose");

const malariaLiveSchema = new mongoose.Schema({
  age: Number,
  gender: Number,
  temperature: Number,
  spo2: Number,
  fever: Number,
  fever_duration: Number,
  nausea: Number,
  fatigue: Number,
  mosquito_net: Number,
  district: String,
  risk_zone_level: Number,
  rainfall_index: Number,
  is_rainy_season: Number,
  
  // Model results
  xgb_risk_level: String,
  xgb_confidence: Number,
  llm_challenge_result: String,
  llm_explanation: String,
  
  // Metadata
  nurse_name: String,
  health_center: String,
  robot_id: String,
  consultation_id: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("MalariaLive", malariaLiveSchema);
