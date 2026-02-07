const mongoose = require("mongoose");
const Dataset = require("./models/MalariaDataset");
const ZoneRisk = require("./models/ZoneRisk");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

// 1. Données de référence pour les zones en Côte d'Ivoire
const IVORY_COAST_ZONES = [
  { district: "yamoussoukro", region: "belier", malaria_risk_index: 4, avg_rainfall: 0.8, avg_humidity: 0.75, is_rainy_season: 1 },
  { district: "abidjan", region: "lagunes", malaria_risk_index: 5, avg_rainfall: 0.9, avg_humidity: 0.85, is_rainy_season: 1 },
  { district: "korhogo", region: "poro", malaria_risk_index: 2, avg_rainfall: 0.3, avg_humidity: 0.40, is_rainy_season: 0 },
  { district: "bouake", region: "gbeke", malaria_risk_index: 3, avg_rainfall: 0.6, avg_humidity: 0.60, is_rainy_season: 1 },
  { district: "san-pedro", region: "san-pedro", malaria_risk_index: 4, avg_rainfall: 0.85, avg_humidity: 0.80, is_rainy_season: 1 }
];

function rand(min, max) { return Math.random() * (max - min) + min; }
function bool(p = 0.5) { return Math.random() < p ? 1 : 0; }

// Logique de calcul du risque (Label pour le ML)
function computeRisk(d) {
  let score = 0;
  if (d.fever) score += 3;
  if (d.temperature >= 38.5) score += 2;
  if (d.fever_duration >= 5) score += 2;
  if (d.risk_zone_level >= 4) score += 2; // Influence de la zone
  if (d.is_rainy_season) score += 1;      // Influence du climat
  if (d.spo2 < 94) score += 2;

  if (score >= 8) return "high";
  if (score >= 4) return "medium";
  return "low";
}

async function generateData(n = 1000) {
  try {
    if (!MONGODB_URI) throw new Error("MONGODB_URI manquant dans le fichier .env");

    console.log("⏳ Connexion au Cluster MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connecté.");

    // -- ÉTAPE A : Initialiser les zones de risque --
    console.log("⏳ Mise à jour des zones de risque...");
    await ZoneRisk.deleteMany({}); // On nettoie pour avoir des données propres
    await ZoneRisk.insertMany(IVORY_COAST_ZONES);
    console.log("✅ Zones de risque initialisées.");

    // -- ÉTAPE B : Générer les patients --
    const patients = [];
    console.log(`⏳ Génération de ${n} patients avec contexte géographique...`);

    for (let i = 0; i < n; i++) {
      // Choisir une zone au hasard
      const zone = IVORY_COAST_ZONES[Math.floor(Math.random() * IVORY_COAST_ZONES.length)];

      const p = {
        age: Math.floor(rand(1, 75)),
        gender: bool(),
        temperature: +rand(36, 40.5).toFixed(1),
        spo2: Math.floor(rand(85, 100)),
        fever: bool(0.6),
        fever_duration: Math.floor(rand(0, 10)),
        nausea: bool(0.3),
        fatigue: bool(0.5),
        mosquito_net: bool(0.4),
        
        // Champs liés à la zone (Données automatiques)
        district: zone.district,
        risk_zone_level: zone.malaria_risk_index,
        rainfall_index: zone.avg_rainfall,
        is_rainy_season: zone.is_rainy_season
      };

      p.risk_label = computeRisk(p);
      patients.push(p);
    }

    console.log("⏳ Nettoyage de l'ancien dataset...");
    await Dataset.deleteMany({}); 
    
    console.log(`⏳ Insertion de ${n} patients synthétiques...`);
    await Dataset.insertMany(patients);
    console.log(`✨ Succès : ${n} patients insérés avec succès.`);

  } catch (error) {
    console.error("❌ Erreur critique:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Déconnecté de MongoDB.");
  }
}

generateData(1000);
