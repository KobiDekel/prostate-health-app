const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Missing API Key" });

    try {
        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 2000);

        // הנחיה ברורה ל-AI
        const prompt = {
            contents: [{ parts: [{ text: `Based on: "${rawData}", generate a 7-day meal plan for Gleason 3+4. Return ONLY JSON.` }] }]
        };

        // הכתובת המדויקת לגרסת 1.5 Flash - המודל הכי נפוץ כיום
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompt)
        });

        const data = await response.json();

        // אם יש שגיאה, נחזיר אותה בצורה גלויה כדי שנדע מה לתקן
        if (data.error) {
            return res.status(data.error.code || 500).json({ 
                error: "Google API Error", 
                message: data.error.message,
                hint: "Check if Gemini API is enabled in your Google Cloud Console"
            });
        }

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.replace(/```json|```/g, "").trim();
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: "Server Error", details: error.message });
    }
};