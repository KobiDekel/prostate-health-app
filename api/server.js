const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // 1. קריאת קובץ המקורות (וודא שזה sources.txt ולא docx)
        const filePath = path.join(process.cwd(), 'sources.txt');
        let fileContent = "";
        
        if (fs.existsSync(filePath)) {
            fileContent = fs.readFileSync(filePath, 'utf8');
        }

        // 2. שימוש בנתיב המדויק שגוגל דורשת (v1/models)
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Based on this data: ${fileContent}, create a 7-day meal plan for Gleason 3+4. Saturday dinner: ONLY Purple Broccoli. Return ONLY a JSON array: [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]` }]
                }]
            })
        });

        const data = await response.json();

        // בדיקה אם גוגל החזירה שגיאת מודל
        if (data.error) {
            console.error("API Error:", data.error.message);
            return res.status(200).json({ weekly_plan: [], error: data.error.message });
        }

        // 3. חילוץ הנתונים וניקוי סימני Markdown
        let rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']') + 1;
        
        if (start === -1) throw new Error("No JSON array found");
        
        const cleanJson = JSON.parse(rawText.substring(start, end));

        // 4. שליחה בפורמט שהאתר מצפה לו
        res.status(200).json({ weekly_plan: cleanJson });

    } catch (err) {
        console.error("Processing Error:", err.message);
        res.status(200).json({ weekly_plan: [] });
    }
};