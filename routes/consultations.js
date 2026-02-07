const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const { normalizeMedicalData } = require('../services/perplexity');
const { v4: uuidv4 } = require('uuid');

/**
 * Utility: Transform raw payload into descriptive text for the LLM.
 */
function payloadToRawText(payload) {
    console.log("payload", payload);
    let text = `Consultation Paludisme: `;
    if (payload.ageYears) text += `Âge: ${payload.ageYears} ans. `;
    if (payload.gender) text += `Sexe: ${payload.gender === 'M' ? 'Masculin' : 'Féminin'}. `;
    if (payload.temperatureC) text += `Température: ${payload.temperatureC}°C. `;
    if (payload.tdrPaludisme) text += `TDR: ${payload.tdrPaludisme}. `;
    if (payload.region || payload.district) text += `Localisation: ${payload.district || ''}, ${payload.region || ''}. `;
    
    // Add signs
    const symptoms = [];
    if (payload.fievre) symptoms.push("Fièvre");
    if (payload.troublesConscience) symptoms.push("Troubles de la conscience");
    if (payload.convulsions) symptoms.push("Convulsions");
    if (symptoms.length > 0) text += `Symptômes: ${symptoms.join(', ')}. `;

    return text;
}

/**
 * Utility: Check if the payload is already structured JSON from a form.
 */
function isStructured(payload) {
    // Si on a des champs cliniques clés, on considère que c'est structuré
    const clinicalFields = ['ageYears', 'temperatureC', 'tdrPaludisme', 'fievre', 'cephalees'];
    const foundFields = clinicalFields.filter(field => payload[field] !== undefined);
    return foundFields.length >= 2; // Au moins 2 champs cliniques présents
}

/**
 * @route POST /api/consultations
 * @desc Collect, normalize and store malaria data
 */ 
router.post('/', async (req, res) => {
    try {
        const rawPayload = req.body;
        let finalData;

        if (isStructured(rawPayload)) {
            console.log("Données structurées détectées - Bypass IA");
            finalData = { ...rawPayload };
        } else {
            console.log("Données non structurées - Appel IA Normalisation");
            // Étape A: Transformation en Texte Brut
            const rawText = payloadToRawText(rawPayload);
            // Étape B: Appel à l'IA
            const normalizedData = await normalizeMedicalData(rawText);
            finalData = { ...normalizedData };
        }

        // Étape C: Complétion & Sécurisation (Garantir les IDs et métadonnées)
        const enrichedData = {
            ...finalData,
            consultationId: rawPayload.consultationId || finalData.consultationId || `CONS-${uuidv4().split('-')[0].toUpperCase()}`,
            patientId: rawPayload.patientId || finalData.patientId || `PAT_anon_${uuidv4().split('-')[0]}`,
            sourceType: rawPayload.sourceType || 'api',
            robotId: rawPayload.robotId || null,
            dataQualityStatus: 'valide'
        };

        // Étape D: Stockage avec validation Mongoose
        const consultation = new Consultation(enrichedData);
        await consultation.save();

        res.status(201).json({
            success: true,
            message: isStructured(rawPayload) 
                ? "Données structurées enregistrées avec succès" 
                : "Données collectées et normalisées par l'IA avec succès",
            data: consultation
        });

    } catch (error) {
        console.error("ETL Pipeline Error:", error);
        res.status(500).json({
            success: false,
            message: error.name === 'ValidationError' 
                ? "Données non conformes au schéma : " + error.message 
                : (error.message || "Erreur interne du serveur lors de la collecte")
        });
    }
});

module.exports = router;
