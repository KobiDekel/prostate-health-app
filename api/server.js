const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "API Key missing in Vercel" });

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // עכשיו כשזה Enabled, נשתמש במודל המהיר ביותר
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 3000);

        const prompt = `Based on: "${rawData}", generate a 7-day meal plan for Gleason 3+4. Return ONLY a valid JSON object.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // ניקוי ומעבר ל-JSON
        const cleanJson = text.replace(/```json|```/g, "").trim();
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: "AI Processing Error", message: error.message });
    }
};


