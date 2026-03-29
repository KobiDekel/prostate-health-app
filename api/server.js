module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `Return ONLY a pure JSON object in Hebrew. No markdown, no backticks, no text. 
  Example: {"daily_tip": "...", "meals": [{"title": "...", "cancer_inhibition": "...", "systemic_benefit": "..."}]}`;

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

    if (!data.candidates || !data.candidates[0].content) {
      throw new Error("גוגל לא החזירה תשובה - בדוק API Key או חסימת בטיחות");
    }

    let text = data.candidates[0].content.parts[0].text;
    // ניקוי יסודי של כל מה שאינו JSON
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const cleanJson = text.substring(jsonStart, jsonEnd);
    
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};