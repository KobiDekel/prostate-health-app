const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // הגדרת כותרות CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  // שימוש בנתיב היציב v1 ובמודל 1.5-flash
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const prompt = "צור תפריט יומי בריאותי המבוסס על מחקרי סרטן הערמונית. כלול ארוחת בוקר, צהריים וערב עם הסבר קצר על היתרון המחקרי של כל מרכיב. החזר את התשובה בפורמט JSON נקי.";

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ menu: aiText });

  } catch (error) {
    console.error("Direct API Error:", error.message);
    res.status(500).json({ error: "שגיאה ביצירת התפריט", details: error.message });
  }
};