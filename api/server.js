module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `אתה מומחה לתזונה פונקציונלית עבור חולי Gleason 3+4. 
  צור תוכנית שבועית מלאה (7 ימים נפרדים). לכל יום צור 3 ארוחות שונות.
  
  דגשים:
  - גיוון מקסימלי: אל תחזור על אותן ארוחות.
  - שילובים כימיים: הסבר על פלפל שחור, ג'ינג'ר, שומן זית וספיגה.
  - בריאות הלב ועיכוב סרטן.

  החזר אך ורק JSON במבנה הבא:
  {
    "weekly_plan": [
      {
        "day_number": 1,
        "daily_tip": "טיפ ליום זה",
        "meals": [
          {
            "title": "שם הארוחה",
            "ingredients_logic": "הסבר על שילוב החומרים",
            "cancer_inhibition": "הסבר עיכוב סרטן",
            "cardio_benefit": "הסבר לב וכלי דם"
          }
        ]
      }
    ]
  } (סה"כ 7 אובייקטים בתוך weekly_plan)`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      })
    });

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    res.status(200).json(JSON.parse(text.substring(jsonStart, jsonEnd)));

  } catch (error) {
    res.status(500).json({ error: "Failed to generate weekly plan" });
  }
};