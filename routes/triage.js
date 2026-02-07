const express = require("express");
const router = express.Router();
const Consultation = require("../models/Consultation");
const MalariaLive = require("../models/MalariaLive");
const PredictionService = require("../services/predictionService");

/**
 * POST /triage/evaluate
 * Main endpoint for patient evaluation
 */
router.post("/evaluate", async (req, res) => {
  const startTime = Date.now();
  try {
    const data = req.body;
    
    // 1. Prepare data for XGBoost (Map frontend fields to model fields)
    const xgbInput = {
      age: data.age_years || 0,
      gender: data.gender === "M" ? 1 : 0,
      temperature: data.temperature_c,
      spo2: data.spo2_pct,
      fever: data.fever ? 1 : 0,
      fever_duration: data.duree_fievre_jours || 0,
      nausea: data.nausees_vomissements ? 1 : 0,
      fatigue: data.fatigue ? 1 : 0,
      mosquito_net: data.usage_moustiquaire ? 1 : 0,
      district: data.district?.toLowerCase(),
      risk_zone_level: 4, // Default or fetch from ZoneRisk if needed
      rainfall_index: 0.6, // Mock for now
      is_rainy_season: 1   // Mock for now
    };

    // 2. Get XGBoost Prediction (via child_process)
    console.log("🚀 [AI-Engine] Lancement XGBoost...");
    const xgbStart = Date.now();
    const xgbResult = await PredictionService.getXGPrediction(xgbInput);
    console.log(`⏱️ [AI-Engine] XGBoost terminé en ${Date.now() - xgbStart}ms`);

    // 3. Challenge with Perplexity AI
    console.log("🤖 [LLM-Expert] Challenge avec Perplexity...");
    const llmStart = Date.now();
    const llmResult = await PredictionService.challengeWithPerplexity(xgbInput, xgbResult);
    console.log(`⏱️ [LLM-Expert] Perplexity terminé en ${Date.now() - llmStart}ms`);

    // 4. Store in Consultation (Clinical Record)
    // ... rest of the code as is ...

    // 4. Store in Consultation (Clinical Record)
    const consultation = new Consultation({
      consultationId: data.consultation_id || `CONS-${Date.now()}`,
      patientId: data.patient_id || "ANON",
      ageYears: data.age_years,
      gender: data.gender,
      district: data.district,
      temperatureC: data.temperature_c,
      spo2Pct: data.spo2_pct,
      fievre: data.fievre,
      nauseesVomissements: data.nausees_vomissements,
      fatigue: data.fatigue,
      robotId: data.robot_id,
      sourceType: "kiosque"
    });
    await consultation.save();

    // 5. Store in MalariaLive (for future ML training)
    const liveData = new MalariaLive({
      ...xgbInput,
      xgb_risk_level: xgbResult.risk_level,
      xgb_confidence: xgbResult.confidence,
      llm_challenge_result: "validated", // Basic logic or actual LLM check
      llm_explanation: llmResult.explanation,
      nurse_name: data.nurse_name,
      health_center: data.health_center,
      robot_id: data.robot_id,
      consultation_id: consultation.consultationId
    });
    await liveData.save();

    // 6. Map risk level and calculate logical severity score (0-100%)
    const riskMap = { "low": "Faible", "medium": "Modéré", "high": "Élevé" };
    const displayRisk = riskMap[xgbResult.risk_level] || xgbResult.risk_level;

    // Calculate a "Severity Score" that matches the label (not just model confidence)
    let displayScore = 0;
    const conf = xgbResult.confidence;
    if (xgbResult.risk_level === "low") {
      displayScore = Math.round(conf * 33);
    } else if (xgbResult.risk_level === "medium") {
      displayScore = Math.round(34 + (conf * 32));
    } else {
      displayScore = Math.round(67 + (conf * 33));
    }

    // 7. Response to Frontend
    res.json({
      status: "success",
      risk_level: displayRisk,
      confidence: xgbResult.confidence,
      ml_scores: { gravite_oms: displayScore },
      clinical_guidelines: {
        recommendations: [
          "Vérifier les signes de danger",
          "Hydratation",
          xgbResult.risk_level === "high" ? "Urgence immédiate" : "Suivi régulier"
        ],
        orientation: xgbResult.risk_level === "high" ? "Hôpital de référence" : "Centre de santé local"
      },
      explanations: [
        {
          feature: "Comparaison IA vs Expert",
          importance: 1,
          value: llmResult.explanation
        }
      ]
    });

    console.log(`✨ [Triage] Évaluation complète terminée en ${Date.now() - startTime}ms`);

  } catch (error) {
    console.error("Evaluation Error:", error);
    res.status(500).json({ error: "Erreur lors de l'évaluation", message: error.message });
  }
});

module.exports = router;
