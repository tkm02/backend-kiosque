const mongoose = require("mongoose");

const malariaSchema = new mongoose.Schema({
  age: Number,
  gender: Number,
  temperature: Number,
  spo2: Number,
  fever: { type: Number, default: 0 },
  fever_duration: Number,
  nausea: { type: Number, default: 0 },
  fatigue: { type: Number, default: 0 },
  mosquito_net: { type: Number, default: 0 },
  
  // Champs liés à la zone
  district: String,
  risk_zone_level: Number,
  rainfall_index: Number,
  is_rainy_season: Number, // 0 ou 1
  
  risk_label: String // Label final (low, medium, high)
});

module.exports = mongoose.model("MalariaDataset", malariaSchema);
