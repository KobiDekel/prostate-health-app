const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        const filePath = path.join(process.cwd(), 'sources.txt');
        let fileContent = "Instructions: Create a 7-day meal plan for Gleason 3+4.";
        if (fs.existsSync(filePath)) {
            fileContent = fs.readFileSync(filePath, 'utf8');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
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
        if (data.error) throw new Error(data.error.message);

        // חילוץ הטקסט וניקוי יסודי
        let rawText = data.candidates[0].content.parts[0].text;
        
        // מוצא את המקום שבו המערך [ מתחיל ונגמר ]
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']') + 1;
        
        if (start === -1 || end === 0) throw new Error("Invalid JSON structure");
        
        const cleanJson = JSON.parse(rawText.substring(start, end));

        // שליחה בפורמט שהאתר שלך מצפה לו (weekly_plan)
        res.status(200).json({ weekly_plan: cleanJson });

    } catch (err) {
        console.error("Processing Error:", err.message);
        res.status(200).json({ weekly_plan: [] }); 
    }
};