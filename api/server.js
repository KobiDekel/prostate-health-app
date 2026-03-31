const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 2000);

        // הנחיה שמחזירה בדיוק את המבנה שהאתר שלך מצפה לו
        const prompt = `Based on these sources: "${rawData}", create a 7-day meal plan for Gleason 3+4. 
        Return ONLY a JSON object with this exact structure:
        {"weekly_plan": [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};