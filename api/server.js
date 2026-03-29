const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `Return ONLY a valid JSON object in Hebrew for a Gleason 3+4 patient. 
  No markdown, no backticks, no text before or after.
  Structure:
  {
    "daily_tip": "טיפ בריאותי קצר",
    "meals": [
      {"title": "ארוחת בוקר", "cancer_inhibition": "הסבר קצר", "systemic_benefit": "יתרון למערכות הגוף"},
      {"title": "ארוחת צהריים", "cancer_inhibition": "הסבר קצר", "systemic_benefit": "יתרון למערכות הגוף"},
      {"title": "ארוחת ערב", "cancer_inhibition": "הסבר קצר", "systemic_benefit": "יתרון למערכות הגוף"}
    ]
  }`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (!data.candidates) throw new Error("No candidates from AI");

    let text = data.candidates[0].content.parts[0].text;
    
    // מנקה סימני Markdown אם ה-AI בכל זאת הוסיף אותם
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to load menu", details: error.message });
  }
};