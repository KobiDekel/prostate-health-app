const fs = require('fs');
const path = require('path');
// שים לב: אם לא הצלחת להתקין mammoth, הקוד הזה כולל הגנה שלא תקריס את השרת
let mammoth;
try { mammoth = require('mammoth'); } catch (e) { mammoth = null; }

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        let fileContent = "Instructions: Create a 7-day meal plan for Gleason 3+4.";
        
        // ניסיון לקרוא את הקובץ רק אם הספרייה מותקנת והקובץ קיים
        const filePath = path.join(process.cwd(), 'sources.txt');
        if (mammoth && fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            fileContent = result.value;
        }

        // שימוש במודל gemini-1.5-flash ללא תוספות - זה הנתיב הכי אמין ב-v1beta
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `
                        תיאור המשימה (Prompt):
                        1. נתח את ההנחיות התזונתיות הבאות: ${fileContent}
                        2. בנה תפריט שבועי (7 ימים) למטופל עם Gleason 3+4.
                        3. דגש קריטי: ארוחת ערב ביום שבת חייבת להיות "ברוקולי סגול" בלבד.
                        4. החזר אך ורק מערך JSON בפורמט הבא:
                        [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]
                    ` }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        let rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const startBracket = cleanJson.indexOf('[');
        const endBracket = cleanJson.lastIndexOf(']') + 1;
        
        res.status(200).json({ weekly_plan: JSON.parse(cleanJson.substring(startBracket, endBracket)) });

    } catch (err) {
        console.error("Final Error:", err.message);
        // החזרת מבנה ריק כדי שהאתר לא יציג שגיאת התחברות אלא טבלה ריקה לכל הפחות
        res.status(200).json({ weekly_plan: [], error: err.message });
    }
};