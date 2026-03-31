const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Missing API Key" });

    try {
        // אתחול ה-AI עם הגדרות ספציפיות ליציבות
        const genAI = new GoogleGenerativeAI(API_KEY);
        
        // שימוש במודל ללא תוספות, הגרסה הכי נפוצה
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
        });

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 2000);

        const prompt = `Based on: "${rawData}", generate a 7-day meal plan for Gleason 3+4. Return ONLY JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanJson = text.replace(/```json|```/g, "").trim();
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        // אם זה נכשל, ננסה להבין בדיוק למה גוגל חוסמת
        res.status(500).json({ 
            error: "Google AI Error", 
            message: error.message,
            tip: "Verify your API Key is from the project 'adept-portal-461208-c7'"
        });
    }
};
