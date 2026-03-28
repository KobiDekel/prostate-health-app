const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // הגדרת כותרות CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  // שימוש בנתיב היציב v1 ובמודל gemini-1.5-flash-latest
  const const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
  try {
    // הנחיה מפורטת המבוססת על המקורות ב-NotebookLM (נושאים כלליים)
    const prompt = `
      אתה מומחה תזונה קלינית המתמחה בסרטן הערמונית. 
      צור תפריט יומי המבוסס על העקרונות המחקריים הבאים שנמצאו במקורות שלי (NotebookLM - נושאים כלליים):
      1. דגש על צריכת ליקופן (עגבניות מבושלות).
      2. שילוב סולפוראפן (ירקות מצליבים כמו ברוקולי וכרובית).
      3. העדפת דגנים מלאים וקטניות על פני פחמימות ריקות.
      4. צמצום מוצרי חלב ובשר אדום.
      5. שימוש בשומנים בריאים (שמן זית, אגוזי מלך).

      התפריט צריך לכלול: ארוחת בוקר, צהריים, ערב ו-2 ארוחות ביניים.
      לכל מנה, הוסף משפט אחד שמסביר את היתרון המחקרי שלה לבריאות הערמונית.
      החזר את התשובה בפורמט JSON נקי שבו המפתח הוא "menu".
    `;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // שליפת הטקסט מה-AI
    let aiText = data.candidates[0].content.parts[0].text;
    
    // ניקוי תגיות markdown אם ה-AI הוסיף אותן
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

    res.status(200).json(JSON.parse(aiText));

  } catch (error) {
    console.error("Direct API Error:", error.message);
    res.status(500).json({ error: "שגיאה ביצירת התפריט", details: error.message });
  }
};