const { GoogleGenerativeAI } = require("@google/generative-ai");

// אתחול ה-API עם המפתח המאובטח מהגדרות השרת
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * פונקציה לבניית התפריט היומי המותאם אישית
 */
async function generateProstateHealthMenu(gleasonScore = "3+4") {
  try {
    // שימוש במודל Gemini 1.5 Flash - מהיר ומדויק למשימות טקסט
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      אתה מומחה תזונה אונקולוגית המתבסס על ה-Notebook של המשתמש. 
      תפקידך לבנות תפריט יומי לגבר עם גליסון ${gleasonScore}. 
      
      עבור כל מנה (בוקר, צהריים, ערב), עליך לספק בפורמט JSON:
      1. title: כותרת המנה.
      2. cancer_inhibition: נימוק מדעי על המנגנון שמעכב את התפתחות הסרטן.
      3. systemic_benefit: נימוק איך המנה תורמת לשימור מערכות (לב, כבד, כליה, מוח) ושיפור הזיקפה (זרימת דם).
      
      בנוסף, צור שדה בשם "daily_tip" הכולל 'טיפ התראה' קצר לאמצע היום (למשל על תה ירוק או אגוזים).
      
      השב בעברית בלבד. 
      החזר אך ורק אובייקט JSON תקין ללא טקסט נוסף לפניו או אחריו.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // ניקוי תגיות Markdown אם ה-AI הוסיף אותן בטעות
    const jsonString = text.replace(/```json|```/g, "").trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating menu:", error);
    return { error: "נכשלה בניית התפריט. אנא נסה שוב." };
  }
}

// הגדרת ה-Endpoint עבור האפליקציה (Vercel Serverless Function)
module.exports = async (req, res) => {
  // הגדרת Headers כדי לאפשר לאפליקציה לגשת לשרת (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { gleason } = req.query;
  const menu = await generateProstateHealthMenu(gleason || "3+4");
  
  res.status(200).json(menu);
};