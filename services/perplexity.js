const Perplexity = require('@perplexity-ai/perplexity_ai').default || require('@perplexity-ai/perplexity_ai');
require('dotenv').config();

const client = new Perplexity({
    apiKey: process.env.PERPLEXITY_API_KEY
});

const MODEL = "sonar";

/**
 * Normalizes raw medical text into structured JSON using Perplexity.
 */
async function normalizeMedicalData(rawText) {
    const systemPrompt = `Tu es un expert en santé publique en Côte d'Ivoire. 
Extraits les données médicales du texte brut fourni pour remplir exactement les champs JSON suivants:
{
  "ageYears": number,
  "ageMonths": number,
  "gender": "M" ou "F",
  "region": string,
  "district": string,
  "commune": string,
  "gpsLatitude": number,
  "gpsLongitude": number,
  "fievre": boolean,
  "cephalees": boolean,
  "nauseesVomissements": boolean,
  "fatigue": boolean,
  "douleursArticulaires": boolean,
  "frissons": boolean,
  "diarhee": boolean,
  "troublesConscience": boolean,
  "temperatureC": number,
  "fcBpm": number,
  "frPm": number,
  "paSystolique": number,
  "paDiastolique": number,
  "spo2Pct": number,
  "tdrPaludisme": "positif", "négatif", ou "inconcluant",
  "resultat_palu": boolean,
  "parasitemiaPct": number,
  "especePaludisme": string,
  "hemoglobineGDl": number
}

Règles:
1. Convertir les oui/non en booleans.
2. Si un champ est absent, mettre null.
3. Retourne UNIQUEMENT le JSON.`;

    try {
        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Texte brut: "${rawText}"` }
            ],
            model: MODEL,
        });

        const content = completion.choices[0].message.content;
        
        // Nettoyage au cas où le modèle ajoute des balises markdown ```json
        const jsonContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonContent);
    } catch (error) {
        console.error("Perplexity Error:", error.message);
        throw new Error("Échec de la normalisation par l'IA");
    }
}

module.exports = { normalizeMedicalData };
