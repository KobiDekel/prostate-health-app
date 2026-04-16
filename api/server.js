const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        const filePath = path.join(process.cwd(), 'sources.txt');
        let fileContent = "Create a meal plan for Gleason 3+4.";
        if (fs.existsSync(filePath)) {
            fileContent = fs.readFileSync(filePath, 'utf8');
        }

        // שינוי ל-v1beta/models/gemini-1.5-flash-8b - גרסה יציבה ומהירה יותר
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Based on: ${fileContent}, create a 7-day meal plan. Return ONLY a JSON array: [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]` }]
                }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        let rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']') + 1;
        
        res.status(200).json({ weekly_plan: JSON.parse(rawText.substring(start, end)) });

    } catch (err) {
        console.error("Final Attempt Error:", err.message);
        res.status(200).json({ weekly_plan: [], error: err.message });
    }
};