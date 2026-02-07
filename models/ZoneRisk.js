const mongoose = require("mongoose");

const zoneRiskSchema = new mongoose.Schema({
  district: { type: String, required: true, unique: true },
  malaria_risk_index: Number, // 1 (bas) à 5 (élevé)
  avg_rainfall: Number,      // Précipitations
  avg_humidity: Number,      // Humidité
  is_rainy_season: Boolean    // État climatique actuel
});

module.exports = mongoose.model("ZoneRisk", zoneRiskSchema);
