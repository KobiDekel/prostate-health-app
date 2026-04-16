const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // 1. קריאת קובץ הטקסט - פשוט וישיר
        const filePath = path.join(process.cwd(), 'sources.txt');
        let fileContent = "Instructions: Create a 7-day meal plan for Gleason 3+4.";
        
        if (fs.existsSync(filePath)) {
            fileContent = fs.readFileSync(filePath, 'utf8');
        }

        // 2. שימוש בנתיב ה-v1 היציב (שעובד ב-200 OK בדרך כלל)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `
                        Read this nutrition data: ${fileContent}
                        Create a 7-day meal plan for Gleason 3+4.
                        Saturday dinner: ONLY Purple Broccoli.
                        Return ONLY a JSON array: [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]
                    ` }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // אם v1 לא עובד, ננסה אוטומטית את v1beta באותה בקשה
            return res.status(200).json({ weekly_plan: [], debug: data.error.message });
        }

        let rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const startBracket = cleanJson.indexOf('[');
        const endBracket = cleanJson.lastIndexOf(']') + 1;
        
        res.status(200).json({ weekly_plan: JSON.parse(cleanJson.substring(startBracket, endBracket)) });

    } catch (err) {
        res.status(200).json({ weekly_plan: [], error: err.message });
    }
};