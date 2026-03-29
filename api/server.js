module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `אתה מומחה לתזונה פונקציונלית. צור תוכנית שבועית ל-7 ימים עבור Gleason 3+4.
  לכל יום: טיפ יומי ו-3 ארוחות (בוקר, צהריים, ערב).
  דגשים: שילובי ספיגה (פלפל שחור/ג'ינג'ר), עיכוב סרטן, ובריאות הלב.
  החזר אך ורק JSON במבנה:
  {"weekly_plan": [{"day": 1, "tip": "...", "meals": [{"t": "שם", "l": "לוגיקה", "ci": "סרטן", "cb": "לב"}]}]}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
      })
    });

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    res.status(200).json(JSON.parse(text.substring(jsonStart, jsonEnd)));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};