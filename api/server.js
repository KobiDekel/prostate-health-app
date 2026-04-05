module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // פנייה ישירה ל-API של גוגל ללא הספרייה של Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Generate a 7-day meal plan for Gleason 3+4. Saturday: only purple broccoli. Return JSON: {\"weekly_plan\": [...]}" }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // אם גוגל עדיין חוסמת, נראה כאן את הסיבה המדויקת (כמו Location not supported)
            return res.status(200).json({ error: data.error.message, code: data.error.status });
        }

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Connection failed", details: err.message });
    }
};