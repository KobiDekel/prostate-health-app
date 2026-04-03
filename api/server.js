const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        // שימוש במודל היציב ביותר
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8').substring(0, 2000) : "Healthy diet";

        const prompt = `Based on these sources: "${rawData}", create a 7-day meal plan for Gleason 3+4. 
        Special rule: On Saturday, eat ONLY purple broccoli.
        Return ONLY JSON: {"weekly_plan": [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();

        res.status(200).json(JSON.parse(text));
    } catch (error) {
        // זה ידפיס לנו ב-Logs בדיוק למה גוגל חוסמת אותך
        console.error("API ERROR:", error.message);
        res.status(500).json({ error: "Google Connection Failed", details: error.message });
    }
};