const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // הגדרות אבטחה וגישה
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Missing API Key in Vercel" });

    try {
        // כאן הקסם: אנחנו מכריחים את גוגל להשתמש בגרסה v1 היציבה
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel(
            { model: "gemini-1.5-flash" },
            { apiVersion: 'v1' } // זה השורה שפותרת את ה-404!
        );

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        let rawData = "General healthy diet";
        if (fs.existsSync(sourcePath)) {
            rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 2500);
        }

        const prompt = `Based on: "${rawData}", generate a 7-day meal plan for Gleason 3+4. 
        Return ONLY a JSON object with this structure:
        {"weekly_plan": [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // ניקוי סימני Markdown אם ה-AI הוסיף אותם
        const cleanJson = text.replace(/```json|```/g, "").trim();
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ 
            error: "Google API connection failed", 
            details: error.message 
        });
    }
};