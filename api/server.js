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
                    parts: [{ text: "Return ONLY a JSON array of 7 objects for a meal plan. Format: [{\"day\": \"יום א'\", \"breakfast\": \"...\", \"lunch\": \"...\", \"dinner\": \"...\"}]. Important: Saturday dinner is only purple broccoli." }]
                }]
            })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        
        // ניקוי התשובה מכל מה שהוא לא JSON
        const cleanJson = rawText.substring(rawText.indexOf('['), rawText.lastIndexOf(']') + 1);
        const weeklyPlan = JSON.parse(cleanJson);

        // שליחת התוצאה במבנה שהאתר מחפש
        res.status(200).json({ weekly_plan: weeklyPlan });

    } catch (err) {
        console.error("Final point error:", err.message);
        res.status(200).json({ weekly_plan: [] }); // מחזיר מערך ריק במקום שגיאה כדי למנוע קריסה
    }
};