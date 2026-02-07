const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");

class PredictionService {
  /**
   * Run XGBoost Prediction via Python script
   */
  static async getXGPrediction(data) {
    return new Promise((resolve, reject) => {
      const pythonPath = process.platform === "win32" ? "venv\\Scripts\\python.exe" : "venv/bin/python";
      const scriptPath = path.join(__dirname, "../ai-engine/predict.py");
      
      const py = spawn(pythonPath, [scriptPath], {
        cwd: path.join(__dirname, "../ai-engine")
      });

      let output = "";
      let errorOutput = "";

      py.stdin.write(JSON.stringify(data));
      py.stdin.end();

      py.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });

      py.stderr.on("data", (chunk) => {
        errorOutput += chunk.toString();
      });

      py.on("close", (code) => {
        if (code !== 0) {
          console.error("Python Error:", errorOutput);
          return reject(new Error(`Python process exited with code ${code}`));
        }
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error("Failed to parse Python output"));
        }
      });
    });
  }

  /**
   * Challenge the prediction with Perplexity AI
   */
  static async challengeWithPerplexity(data, xgbResult) {
    try {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) return { explanation: "Perplexity API key missing." };

      const prompt = `
        En tant qu'expert en diagnostic du paludisme en Côte d'Ivoire, analyse les données suivantes du patient :
        - Âge : ${data.age}
        - Température : ${data.temperature}°C
        - SpO2 : ${data.spo2}%
        - Fièvre : ${data.fever ? 'Oui' : 'Non'} (depuis ${data.fever_duration} jours)
        - District : ${data.district} (Risque zone: ${data.risk_zone_level}/5)
        
        Le modèle XGBoost prédit un risque : ${xgbResult.risk_level} (Confiance: ${(xgbResult.confidence * 100).toFixed(1)}%).
        
        Donne une brève explication médicale (2-3 phrases) validant ou nuançant ce risque selon les protocoles OMS/PNLP.
      `;

      const response = await axios.post("https://api.perplexity.ai/chat/completions", {
        model: "sonar",
        messages: [{ role: "system", content: "Tu es un assistant médical spécialisé en paludisme." }, { role: "user", content: prompt }],
        temperature: 0.2
      }, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
      });

      return {
        explanation: response.data.choices[0].message.content,
        model: response.data.model
      };
    } catch (error) {
      console.error("Perplexity Error:", error.response?.data || error.message);
      return { explanation: "Erreur lors de la validation LLM." };
    }
  }
}

module.exports = PredictionService;
