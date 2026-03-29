const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `Return a JSON object for a Gleason 3+4 patient with exactly this structure:
  {
    "daily_tip": "A short medical insight about lycopene or sulforaphane",
    "morning": {"title": "Dish name", "cancer_inhibition": "How it helps", "systemic_benefit": "Heart/Liver help"},
    "lunch": {"title": "Dish name", "cancer_inhibition": "How it helps", "systemic_benefit": "Heart/Liver help"},
    "dinner": {"title": "Dish name", "cancer_inhibition": "How it helps", "systemic_benefit": "Heart/Liver help"}
  }
  Respond ONLY with the JSON code in Hebrew. No backticks, no markdown.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);

    let text = data.candidates[0].content.parts[0].text;
    
    // ניקוי אגרסיבי של סימני Markdown למקרה שה-AI מתעקש להוסיף אותם
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // שליחת הנתונים כ-JSON תקין
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: "נתונים לא תקינים מה-AI", details: error.message });
  }
};