const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

module.exports = async (req, res) => {
    // הגדרות Header למניעת בעיות CORS וקביעת פורמט JSON
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // 1. קריאת תוכן הקובץ DesignRef.docx מהתיקייה הראשית
        const filePath = path.join(process.cwd(), 'DesignRef.docx');
        
        if (!fs.existsSync(filePath)) {
            throw new Error("הקובץ DesignRef.docx לא נמצא בתיקיית השורש");
        }

        const fileBuffer = fs.readFileSync(filePath);
        const { value: fileContent } = await mammoth.extractRawText({ buffer: fileBuffer });

        // 2. הגדרת ה-Prompt (התיאור ל-AI)
        const promptDescription = `
            You are a professional nutritionist. 
            Step 1: Analyze the following guidelines and links from the document: ${fileContent}.
            Step 2: Based on these guidelines, create a strict 7-day meal plan for a patient with Gleason 3+4.
            Step 3: Specifically, ensure that for Saturday (יום שבת) dinner, the ONLY item is "Purple Broccoli" (ברוקולי סגול).
            Step 4: Return the response ONLY as a valid JSON array of 7 objects. 
            Each object must have these keys in Hebrew: "day", "breakfast", "lunch", "dinner".
            Example format: [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]
        `;

        // 3. פנייה ל-API של גוגל (שימוש בנתיב v1beta עם המודל העדכני)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptDescription }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Google API Error:", data.error.message);
            return res.status(200).json({ weekly_plan: [], error: data.error.message });
        }

        // 4. חילוץ וניקוי ה-JSON מהתשובה
        let rawText = data.candidates[0].content.parts[0].text;
        
        // הסרת סימני Markdown אם קיימים
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const startBracket = cleanJson.indexOf('[');
        const endBracket = cleanJson.lastIndexOf(']') + 1;
        
        if (startBracket === -1) {
            throw new Error("AI did not return a valid JSON array");
        }

        const finalData = JSON.parse(cleanJson.substring(startBracket, endBracket));

        // שליחת התוצאה הסופית לאתר
        res.status(200).json({ weekly_plan: finalData });

    } catch (err) {
        console.error("Server Error:", err.message);
        res.status(200).json({ 
            weekly_plan: [], 
            error: "שגיאה בעיבוד הנתונים: " + err.message 
        });
    }
};
