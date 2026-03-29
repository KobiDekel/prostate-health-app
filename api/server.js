// שימוש ב-fetch המובנה של Node.js (גרסה 18+) כדי למנוע תקלות התקנה ב-Vercel
module.exports = async (req, res) => {
  // הגדרות CORS כדי שהאפליקציה תוכל לתקשר עם השרת
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  // פרומפט ממוקד מאוד כדי למנוע חסימות בטיחות
  const prompt = `Return ONLY a valid JSON object in Hebrew for a daily health menu. 
  No markdown, no backticks.
  Structure:
  {
    "daily_tip": "טיפ בריאותי קצר",
    "meals": [
      {"title": "ארוחת בוקר", "cancer_inhibition": "הסבר קצר", "systemic_benefit": "יתרון"},
      {"title": "ארוחת צהריים", "cancer_inhibition": "הסבר קצר", "systemic_benefit": "יתרון"},
      {"title": "ארוחת ערב", "cancer_inhibition": "הסבר קצר", "systemic_benefit": "יתרון"}
    ]
  }`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
    if (!data.candidates || !data.candidates[0].content) throw new Error("No response from AI");

    let text = data.candidates[0].content.parts[0].text;
    
    // חילוץ ה-JSON בצורה בטוחה (למקרה שה-AI הוסיף טקסט מיותר)
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const cleanJson = text.substring(jsonStart, jsonEnd);
    
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: "Server Error", details: error.message });
  }
};