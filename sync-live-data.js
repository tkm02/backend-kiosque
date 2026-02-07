const mongoose = require("mongoose");
const MalariaLive = require("./models/MalariaLive");
const MalariaDataset = require("./models/MalariaDataset");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Synchronize Live data into the main Dataset
 * This can be run periodically to update the training pool
 */
async function syncData() {
  try {
    if (!MONGODB_URI) throw new Error("MONGODB_URI manquant");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connecté pour la synchronisation...");

    // 1. Get all Live records not yet synced (you could add an 'is_synced' flag)
    // For now, we take all and avoid duplicates by checking consultation_id (if added to Dataset)
    const liveRecords = await MalariaLive.find({});
    console.log(`📊 ${liveRecords.length} records Live trouvés.`);

    let addedCount = 0;
    for (const live of liveRecords) {
      // Check if already in dataset (requires district/age/gender/etc match or a unique ID)
      // Since MalariaDataset is a flat pool, we just check existence of this specific profile
      const exists = await MalariaDataset.findOne({
        age: live.age,
        gender: live.gender,
        temperature: live.temperature,
        consultation_id: live.consultation_id // We should add this to Dataset schema for tracking
      });

      if (!exists) {
        await MalariaDataset.create({
          age: live.age,
          gender: live.gender,
          temperature: live.temperature,
          spo2: live.spo2,
          fever: live.fever,
          fever_duration: live.fever_duration,
          nausea: live.nausea,
          fatigue: live.fatigue,
          mosquito_net: live.mosquito_net,
          district: live.district,
          risk_zone_level: live.risk_zone_level,
          rainfall_index: live.rainfall_index,
          is_rainy_season: live.is_rainy_season,
          risk_label: live.xgb_risk_level // Use the confirmed/predicted label
        });
        addedCount++;
      }
    }

    console.log(`✨ Synchronisation terminée : ${addedCount} nouveaux records ajoutés au Dataset.`);

  } catch (error) {
    console.error("❌ Erreur de synchro:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnecté.");
  }
}

syncData();
