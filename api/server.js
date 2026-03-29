module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `אתה מומחה לתזונה עבור חולי Gleason 3+4. צור תוכנית שבועית ל-7 ימים.
  בכל יום 3 ארוחות שונות. הסבר על שילובי חומרים (כמו פלפל שחור וג'ינג'ר), עיכוב סרטן ובריאות הלב.
  החזר אך ורק JSON במבנה:
  {"weekly_plan": [{"day_number": 1, "daily_tip": "...", "meals": [{"title": "...", "ingredients_logic": "...", "cancer_inhibition": "...", "cardio_benefit": "..."}]}]}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4000, // מבטיח מספיק מקום לכל 7 הימים
          temperature: 0.7
        },
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      })
    });

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    res.status(200).json(JSON.parse(text.substring(jsonStart, jsonEnd)));

  } catch (error) {
    res.status(500).json({ error: "טעינת 7 ימים נכשלה", details: error.message });
  }
};