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
    const prompt = `להלן מאגר מידע רפואי ותזונתי:
    "${rawData}"
    
    בהתבסס על המאגר בלבד, צור תפריט שבועי ל-7 ימים עבור חולה גליסון 3+4. 
    עבור כל יום צור טיפ ו-3 ארוחות. הדגש שילובים כימיים (כמו פלפל שחור/ג'ינג'ר) ובריאות הלב.
    החזר אך ורק JSON במבנה הבא (גרסה 1.1.0):
    {"version": "1.1.0", "last_updated": "2026-03-29", "weekly_plan": [{"day": 1, "tip": "..", "meals": [{"t": "..", "l": "..", "ci": "..", "cb": ".."}]}]}`;

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