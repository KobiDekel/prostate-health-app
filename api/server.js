const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Missing API Key" });

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        
        // מנסים את המודל הכי יציב שיש למפתחים
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 2000);

        const prompt = `Generate a 7-day meal plan based on: ${rawData}. Return ONLY JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanJson = text.replace(/```json|```/g, "").trim();
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        // אם gemini-pro נכשל, נחזיר שגיאה מפורטת שתעזור לנו להבין אם המפתח עצמו חסום
        res.status(500).json({ 
            error: "Google AI Connection Failed", 
            message: error.message,
            tip: "Please check if 'Generative Language API' is enabled in your Google Cloud Console."
        });
    }
};