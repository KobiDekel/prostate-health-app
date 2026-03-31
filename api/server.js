const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Missing API Key in Vercel" });

    try {
        // 1. קריאת המאגר שלך
        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 2000);

        // 2. הכתובת הסטנדרטית והיציבה ביותר של גוגל
        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: `Based on this: ${rawData}, create a 7-day meal plan. Return ONLY JSON.` }] 
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: "Google API Error", details: data.error.message });
        }

        // 3. חילוץ הטקסט וניקוי
        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.replace(/```json|```/g, "").trim();
        
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: "Server Crash", details: error.message });
    }
};