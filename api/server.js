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

        const prompt = `Based on: "${rawData}", create a 7-day Gleason 3+4 plan. Return ONLY JSON.`;

        // הכתובת המדויקת שעובדת ב-100% עם המפתח שלך:
        // בתוך api/server.js - שנה את שורת ה-API_URL לזו:
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // אם גוגל מחזירה שגיאה, נציג אותה בצורה ברורה
        if (data.error) {
            return res.status(500).json({ 
                error: "Google API Error", 
                code: data.error.code,
                message: data.error.message 
            });
        }

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJsonText = aiText.replace(/```json|```/g, "").trim();
        res.status(200).json(JSON.parse(cleanJsonText));

    } catch (error) {
        res.status(500).json({ error: "Server Error", details: error.message });
    }
};