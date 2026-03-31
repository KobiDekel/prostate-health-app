const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;
    
    try {
        // 1. קריאת המידע מהקובץ שלך
        const sourcePath = path.join(process.cwd(), 'sources.txt');
        const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 2000);

        // 2. ה-Prompt המדויק
        const promptText = `Based on this research data: "${rawData}", generate a 7-day meal plan for Gleason 3+4. Return ONLY a JSON object.`;

        // הכתובת היחידה שגוגל מבטיחה שתעבוד ב-2026 עבור Gemini Flash
        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ 
                  parts: [{ text: promptText }] 
              }]
            })
        });
        
        const data = await response.json();

        // בדיקה אם ה-AI החזיר תשובה
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            let aiText = data.candidates[0].content.parts[0].text;
            // ניקוי סימני Markdown אם ה-AI הוסיף אותם
            const cleanJson = aiText.replace(/```json|```/g, "").trim();
            res.status(200).json(JSON.parse(cleanJson));
        } else {
            res.status(500).json({ error: "AI response failed", details: data });
        }

    } catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
};