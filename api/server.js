module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `Return ONLY a valid JSON object in Hebrew for a daily health-conscious menu. 
  No markdown, no text before or after.
  Structure:
  {
    "daily_tip": "Short health insight",
    "meals": [
      {"title": "Breakfast", "cancer_inhibition": "Lycopene/Sulforaphane benefit", "systemic_benefit": "Organ health"},
      {"title": "Lunch", "cancer_inhibition": "Benefit", "systemic_benefit": "Benefit"},
      {"title": "Dinner", "cancer_inhibition": "Benefit", "systemic_benefit": "Benefit"}
    ]
  }`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    
    // ניקוי JSON
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const cleanJson = text.substring(jsonStart, jsonEnd);
    
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    // אם ה-AI נכשל, נחזיר תפריט גיבוי כדי שהאפליקציה לא תיתקע
    res.status(200).json({
      daily_tip: "מומלץ לשלב ירקות מצליבים וליקופן בתזונה היומית.",
      meals: [
        {title: "סלט עגבניות ושמן זית", cancer_inhibition: "ליקופן זמין לספיגה", systemic_benefit: "הגנה על כלי הדם"},
        {title: "ברוקולי מאודה עם שום", cancer_inhibition: "סולפוראפן פעיל", systemic_benefit: "ניקוי רעלים בכבד"},
        {title: "דג סלמון ועלי תרד", cancer_inhibition: "נוגדי חמצון", systemic_benefit: "הפחתת דלקתיות"}
      ]
    });
  }
};