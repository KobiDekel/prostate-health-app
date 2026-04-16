const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // 1. קריאת תוכן הקובץ sources.txt (קריאה ישירה ופשוטה)
        const filePath = path.join(process.cwd(), 'sources.txt');
        
        if (!fs.existsSync(filePath)) {
            throw new Error("הקובץ sources.txt לא נמצא בתיקיית השורש של הפרויקט");
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');

        // 2. בניית ה-Prompt עם התוכן מהקובץ
        const promptText = `
            Analyze the nutritional information in this text: ${fileContent}
            Based on these sources, create a 7-day meal plan for Gleason 3+4.
            Strict requirement: Saturday dinner must be ONLY "Purple Broccoli" (ברוקולי סגול).
            Return ONLY a JSON array in this format:
            [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]
        `;

        // 3. פנייה ל-API (השתמשתי בנתיב היציב ביותר)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        // 4. חילוץ ה-JSON
        let rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const startBracket = cleanJson.indexOf('[');
        const endBracket = cleanJson.lastIndexOf(']') + 1;
        
        const finalData = JSON.parse(cleanJson.substring(startBracket, endBracket));
        res.status(200).json({ weekly_plan: finalData });

    } catch (err) {
        console.error("Error:", err.message);
        res.status(200).json({ weekly_plan: [], error: err.message });
    }
};