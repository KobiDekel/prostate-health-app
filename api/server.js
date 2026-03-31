const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    // 1. קריאת המאגר הגולמי שלך
    const sourcePath = path.join(process.cwd(), 'sources.txt');
    const rawData = fs.readFileSync(sourcePath, 'utf8');

    // 2. שליחת המאגר ל-AI לעיבוד בזמן אמת
    const prompt = `"Base your response strictly on the provided data: ${rawData}. Generate a 7-day meal plan for Gleason 3+4 prostate cancer focusing on DNA repair and heart health. Return ONLY a valid JSON object following this structure: {"version":"1.1.0","weekly_plan":[{"day":1,"tip":"...","meals":[{"t":"...","l":"...","ci":"...","cb":"..."}]}]}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const aiResult = await response.json();
    const cleanJson = JSON.parse(aiResult.candidates[0].content.parts[0].text);

    res.status(200).json(cleanJson);

  } catch (error) {
    res.status(500).json({ error: "טעינת המאגר נכשלה", details: error.message });
  }
};