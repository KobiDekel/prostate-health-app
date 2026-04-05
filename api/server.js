module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // שימוש בגרסה היציבה ביותר של ה-URL
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Return a 7-day meal plan for Gleason 3+4 in JSON format. Sunday dinner: purple broccoli. Output format: [{\"day\": \"יום א'\", \"breakfast\": \"...\", \"lunch\": \"...\", \"dinner\": \"...\"}]" }]
                }]
            })
        });

        const data = await response.json();

        // בדיקה אם גוגל החזירה שגיאה
        if (data.error) {
            console.error("Google API Error:", data.error.message);
            return res.status(200).json({ weekly_plan: [], error: data.error.message });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const startBracket = rawText.indexOf('[');
        const endBracket = rawText.lastIndexOf(']') + 1;
        const cleanJson = rawText.substring(startBracket, endBracket);
        
        res.status(200).json({ weekly_plan: JSON.parse(cleanJson) });

    } catch (err) {
        console.error("Final System Error:", err.message);
        res.status(200).json({ weekly_plan: [] });
    }
};