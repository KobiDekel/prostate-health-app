module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Return ONLY a JSON array for a 7-day meal plan. Format: [{\"day\": \"יום א'\", \"breakfast\": \"...\", \"lunch\": \"...\", \"dinner\": \"...\"}]. Make sure Saturday dinner is only purple broccoli." }]
                }]
            })
        });

        const data = await response.json();
        
        // בדיקה אם גוגל החזירה שגיאה במבנה הנתונים
        if (!data.candidates || !data.candidates[0]) {
            console.error("Google structure error:", JSON.stringify(data));
            return res.status(200).json({ weekly_plan: [] });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        
        // חילוץ ה-JSON בצורה בטוחה יותר
        const startBracket = rawText.indexOf('[');
        const endBracket = rawText.lastIndexOf(']') + 1;
        
        if (startBracket === -1 || endBracket === 0) {
            throw new Error("No JSON array found in response");
        }

        const cleanJson = rawText.substring(startBracket, endBracket);
        const weeklyPlan = JSON.parse(cleanJson);

        res.status(200).json({ weekly_plan: weeklyPlan });

    } catch (err) {
        console.error("Final Fix Error:", err.message);
        res.status(200).json({ weekly_plan: [], error: err.message });
    }
};