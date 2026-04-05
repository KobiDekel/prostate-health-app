module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // זהו הנתיב המדויק שגוגל דורשת עבור מפתחות AI Studio ב-2026
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Return a 7-day meal plan for Gleason 3+4 as a JSON array. Saturday dinner: purple broccoli. Format: [{\"day\": \"יום א'\", \"breakfast\": \"...\", \"lunch\": \"...\", \"dinner\": \"...\"}]" }]
                }]
            })
        });

        const data = await response.json();

        // בדיקה אם גוגל החזירה שגיאה
        if (data.error) {
            console.error("Google Error:", data.error.message);
            return res.status(200).json({ weekly_plan: [], error: data.error.message });
        }

        // חילוץ הנתונים וניקוי סימני Markdown
        let rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const startBracket = cleanJson.indexOf('[');
        const endBracket = cleanJson.lastIndexOf(']') + 1;
        const finalData = JSON.parse(cleanJson.substring(startBracket, endBracket));

        res.status(200).json({ weekly_plan: finalData });

    } catch (err) {
        console.error("Critical System Error:", err.message);
        res.status(200).json({ weekly_plan: [] });
    }
};