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

        // חזרה לנתיב הרשמי והנכון עבור v1beta
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

        // בדיקה אם השרת בכלל ענה
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Google API connection failed");
        }

        const data = await response.json();
        
        // וידוא שיש תוכן בתשובה לפני שמנסים לעבד אותו
        if (!data.candidates || !data.candidates[0]) {
            throw new Error("AI returned empty results");
        }

        let rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('[');
        const end = rawText.lastIndexOf(']') + 1;
        
        if (start === -1) throw new Error("Could not find JSON array in AI response");
        
        const finalData = JSON.parse(rawText.substring(start, end));
        res.status(200).json({ weekly_plan: finalData });

    } catch (err) {
        console.error("Final Table Fix:", err.message);
        res.status(200).json({ weekly_plan: [], error: err.message });
    }
};