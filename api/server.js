const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // הגדרת כותרות כדי למנוע בעיות דפדפן
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("מפתח ה-API חסר בהגדרות Vercel");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });

        // קריאה בטוחה של הקובץ
        const sourcePath = path.join(process.cwd(), 'sources.txt');
        let rawData = "Healthy diet guidelines";
        if (fs.existsSync(sourcePath)) {
            rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 1500);
        }

        const prompt = `Based on: "${rawData}", generate a 7-day meal plan for Gleason 3+4. 
        Note: On Saturday, eat only purple broccoli.
        Return ONLY a JSON object: {"weekly_plan": [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // ניקוי טקסט מיותר שה-AI עלול להוסיף
        const cleanJson = text.replace(/```json|```/g, "").trim();
        
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        console.error("קריסה בשרת:", error.message);
        res.status(500).json({ 
            error: "Connection Failed", 
            message: error.message 
        });
    }
};