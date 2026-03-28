const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const prompt = "צור תפריט יומי בריאותי לסרטן הערמונית (ליקופן, סולפוראפן). החזר JSON עם מפתח menu.";
  
  // רשימת הכתובות המדויקות שגוגל דורשת - ננסה את כולן
  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`
  ];

  for (let url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();

      if (!data.error && data.candidates) {
        const text = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ menu: text });
      }
      console.error(`Attempt failed for ${url}:`, data.error?.message);
    } catch (e) {
      console.error(`Network error for ${url}:`, e.message);
    }
  }

  res.status(500).json({ error: "Connection to Gemini failed. Please check your API Key in Vercel." });
};