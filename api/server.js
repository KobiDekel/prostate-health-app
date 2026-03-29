module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `אתה מומחה לתזונה פונקציונלית עבור חולי Gleason 3+4. 
  צור תפריט יומי הכולל 3 ארוחות (בוקר, צהריים, ערב).
  
  דגשים קריטיים לתפריט:
  1. שילוב רכיבים להגברת ספיגה (למשל: פלפל שחור גרוס טרי וג'ינג'ר עם תה/כורכום, שומן בריא עם ליקופן).
  2. רכיבים מעכבי סרטן (סולפוראפן מירקות מצליבים, ליקופן מבושל, EGCG).
  3. הגנה על כלי דם ולב (ניטראטים מעלים ירוקים, אומגה 3).

  עבור כל ארוחה, החזר JSON במבנה הבא בלבד (בעברית):
  {
    "daily_tip": "טיפ קצר על שילוב חומרים מהמחקרים האחרונים",
    "meals": [
      {
        "title": "שם הארוחה",
        "ingredients_logic": "הסבר מפורט על הרכב החומרים (למה השילוב הזה? מה תורמים הפלפל/ג'ינג'ר/שומן?)",
        "cancer_inhibition": "איך הארוחה מסייעת ספציפית לעיכוב סרטן הערמונית",
        "cardio_benefit": "איך הארוחה שומרת על הלב וכלי הדם"
      }
    ]
  }
  אל תוסיף טקסט לפני או אחרי ה-JSON.`;

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
    if (!data.candidates || !data.candidates[0].content) throw new Error("No AI response");

    let text = data.candidates[0].content.parts[0].text;
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const cleanJson = text.substring(jsonStart, jsonEnd);
    
    res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    // תפריט גיבוי מקצועי למקרה של תקלה
    res.status(200).json({
      daily_tip: "שילוב פלפל שחור גרוס טרי מעלה את ספיגת הרכיבים הפעילים בתה ובתזונה פי 20.",
      meals: [
        {
          title: "תה ירוק עוצמתי עם ג'ינג'ר ופלפל",
          ingredients_logic: "הפלפל השחור (פיפרין) והג'ינג'ר מגבירים את הזמינות הביולוגית של ה-EGCG בתה.",
          cancer_inhibition: "נוגדי חמצון חזקים המעכבים התחלקות תאים סרטניים.",
          cardio_benefit: "שיפור גמישות כלי הדם והורדת דלקתיות."
        },
        {
          title: "סלמון בציפוי ברוקולי ושום",
          ingredients_logic: "השום מפעיל את הסולפוראפן בברוקולי, והשומן בסלמון עוזר לספיגת ויטמינים.",
          cancer_inhibition: "ניקוי רעלים אגרסיבי והגנה על ה-DNA.",
          cardio_benefit: "אומגה 3 לשמירה על קצב לב תקין וניקוי עורקים."
        },
        {
          title: "מרק עגבניות מבושלות עם שמן זית",
          ingredients_logic: "בישול העגבניות עם שמן זית משחרר את הליקופן והופך אותו לזמין לגוף.",
          cancer_inhibition: "ליקופן ידוע כמעכב משמעותי של גידולי ערמונית.",
          cardio_benefit: "מניעת חמצון הכולסטרול בדם."
        }
      ]
    });
  }
};