module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // שימוש בנתיב v1beta - זה הנתיב היחיד שתומך כרגע ב-gemini-1.5-flash עם מפתחות AI Studio
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Create a 7-day meal plan for Gleason 3+4. Return ONLY a JSON array: [{\"day\": \"יום א'\", \"breakfast\": \"...\", \"lunch\": \"...\", \"dinner\": \"...\"}]" }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Google API Error:", data.error.message);
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