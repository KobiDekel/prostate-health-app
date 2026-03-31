const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // שימוש במודל gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8').substring(0, 2000) : "Healthy diet";

        const prompt = `Based on: "${rawData}", generate a 7-day meal plan for Gleason 3+4. Return ONLY a JSON object with this structure: {"weekly_plan": [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();

        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ error: "Google AI Connection Failed", message: error.message });
    }
};