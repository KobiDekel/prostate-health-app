const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `צור אובייקט JSON בעברית עבור תפריט יומי בריאותי. 
  אל תוסיף טקסט לפני או אחרי ה-JSON.
  המבנה חייב להיות בדיוק כזה:
  {
    "daily_tip": "טיפ קצר",
    "meals": [
      {"title": "ארוחת בוקר", "cancer_inhibition": "הסבר", "systemic_benefit": "יתרון"},
      {"title": "ארוחת צהריים", "cancer_inhibition": "הסבר", "systemic_benefit": "יתרון"},
      {"title": "ארוחת ערב", "cancer_inhibition": "הסבר", "systemic_benefit": "יתרון"}
    ]
  }`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // ביטול חסימות בטיחות כדי לאפשר דיון בנושאים רפואיים
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);
    if (!data.candidates || !data.candidates[0].content) {
      console.error("Full Data:", JSON.stringify(data));
      throw new Error("גוגל חסמה את התשובה מטעמי בטיחות או שגיאת מודל.");
    }

    let text = data.candidates[0].content.parts[0].text;
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};