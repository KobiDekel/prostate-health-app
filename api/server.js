module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Generate a 7-day meal plan for Gleason 3+4 in JSON format." }] }]
            })
        });

        const data = await response.json();
        // אם גוגל מחזירה שגיאה, אנחנו נראה אותה כאן בבירור
        if (data.error) {
            return res.status(500).json({ error: "Google Error", details: data.error.message });
        }

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Fetch Failed", message: err.message });
    }
};