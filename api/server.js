const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const API_KEY = process.env.GEMINI_API_KEY;
  // בדיקה פנימית: אם המפתח חסר, נחזיר הודעה מפורטת
  if (!API_KEY) {
      return res.status(500).json({ 
          error: "Missing API Key", 
          details: "Vercel environment variable GEMINI_API_KEY is not set." 
      });
  }
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const sourcePath = path.join(process.cwd(), 'sources.txt');
    if (!fs.existsSync(sourcePath)) throw new Error("קובץ sources.txt לא נמצא");
    
    // קריאת המאגר וצמצום ל-3000 תווים הראשונים (כדי למנוע עומס על ה-AI)
    const rawData = fs.readFileSync(sourcePath, 'utf8').substring(0, 3000);

    const prompt = `Create a 7-day meal plan for Gleason 3+4 based on this: ${rawData}. 
    Return ONLY JSON: {"version":"1.1.0","weekly_plan":[{"day":1,"tip":"..","meals":[{"t":"..","l":"..","ci":"..","cb":".."}]}]}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const aiData = await response.json();

    // בדיקה בטחונית: האם ה-AI החזיר תשובה?
    if (!aiData.candidates || !aiData.candidates[0]) {
      throw new Error("ה-AI לא החזיר תשובה. בדוק את ה-API KEY שלך ב-Vercel.");
    }

    const cleanJson = JSON.parse(aiData.candidates[0].content.parts[0].text);
    res.status(200).json(cleanJson);

  } catch (error) {
    res.status(500).json({ error: "שגיאת עיבוד", details: error.message });
  }
};