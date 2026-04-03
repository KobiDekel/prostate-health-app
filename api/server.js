const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // הכרחה מוחלטת של המודל לעבוד בגרסה היציבה
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });

        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8').substring(0, 2000) : "Healthy diet";

        // השורה המעודכנת שתבטיח שה-AI יקרא את הסרטונים וההנחיות שלך
        const prompt = `Based on the specific health videos and guidelines in: "${rawData}", 
generate a 7-day meal plan for Gleason 3+4. 
IMPORTANT: For Saturday (Shabbat), the only meal allowed is Purple Broccoli as per the sources.
                        Return ONLY a JSON object: {"weekly_plan": [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();

        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ error: "Connection Failed", message: error.message });
    }

};