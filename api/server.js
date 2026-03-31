const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // הגדרת כותרות למניעת שגיאות דפדפן
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: "API Key missing in Vercel settings" });
    }

    try {
        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 2000);

        const prompt = `Based on: "${rawData}", create a 7-day Gleason 3+4 plan. 
        Return ONLY a JSON object: {"version":"1.1.0","weekly_plan":[{"day":1,"tip":"..","meals":[{"t":"..","l":"..","ci":"..","cb":".."}]}]}`;

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            return res.status(500).json({ error: "AI failed to respond", raw: data });
        }

        let aiText = data.candidates[0].content.parts[0].text;
        
        // "מנקה" JSON - מסיר סימנים מיותרים שה-AI לפעמים מוסיף
        const cleanJsonText = aiText.replace(/```json|```/g, "").trim();
        const finalData = JSON.parse(cleanJsonStatus);

        res.status(200).json(finalData);

    } catch (error) {
        res.status(500).json({ error: "Server Crash", details: error.message });
    }
};