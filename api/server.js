const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key is missing in Vercel settings");

        const genAI = new GoogleGenerativeAI(apiKey);
        // שימוש במודל latest שעוקף בעיות גרסה
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8').substring(0, 1800) : "Healthy diet";

        // הנחיה מפורטת שכוללת את המקורות שלך
        const prompt = `Based on these sources: "${rawData}", create a 7-day meal plan for Gleason 3+4. 
        Special rule: On Saturday (Shabbat), eat ONLY purple broccoli.
        Return ONLY this JSON structure: {"weekly_plan": [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();

        res.status(200).json(JSON.parse(text));
    } catch (error) {
        // לוג מפורט שיעזור לנו להבין אם המפתח לא תקין
        console.error("Critical Error:", error.message);
        res.status(500).json({ error: "AI Engine Error", detail: error.message });
    }
};