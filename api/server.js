const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `Return a JSON object for a health-conscious person (prostate health context). 
  Respond ONLY with the JSON in Hebrew.
  Structure:
  {
    "daily_tip": "Short health tip",
    "meals": [
      {"title": "Breakfast name", "cancer_inhibition": "Benefit", "systemic_benefit": "Organ benefit"},
      {"title": "Lunch name", "cancer_inhibition": "Benefit", "systemic_benefit": "Organ benefit"},
      {"title": "Dinner name", "cancer_inhibition": "Benefit", "systemic_benefit": "Organ benefit"}
    ]
  }`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // הגדרות בטיחות כדי למנוע חסימה של תוכן בריאותי
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
    
    // בדיקה אם גוגל חסמה את התוכן (FinishReason: SAFETY)
    if (!data.candidates || !data.candidates[0].content) {
       return res.status(200).json({
         daily_tip: "שימו לב: ה-AI חסם את התוכן מטעמי בטיחות רפואית.",
         meals: [
           {title: "נא לנסות שוב", cancer_inhibition: "-", systemic_benefit: "-"},
           {title: "נא לנסות שוב", cancer_inhibition: "-", systemic_benefit: "-"},
           {title: "נא לנסות שוב", cancer_inhibition: "-", systemic_benefit: "-"}
         ]
       });
    }

    let text = data.candidates[0].content.parts[0].text;
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};