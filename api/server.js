const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // 1. קריאת תוכן הקובץ DesignRef.docx
        const filePath = path.join(process.cwd(), 'DesignRef.docx');
        const fileBuffer = fs.readFileSync(filePath);
        const { value: fileContent } = await mammoth.extractRawText({ buffer: fileBuffer });

        // 2. פנייה לגוגל עם תוכן הקובץ כהנחיה
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Based on the following nutritional guidelines: ${fileContent}, create a 7-day meal plan for Gleason 3+4. Saturday dinner MUST be only purple broccoli. Return ONLY a JSON array: [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]` }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({ weekly_plan: [], error: data.error.message });
        }

        let rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const startBracket = cleanJson.indexOf('[');
        const endBracket = cleanJson.lastIndexOf(']') + 1;
        const finalData = JSON.parse(cleanJson.substring(startBracket, endBracket));

        res.status(200).json({ weekly_plan: finalData });

    } catch (err) {
        console.error("File or API Error:", err.message);
        res.status(200).json({ weekly_plan: [], error: "Ensure DesignRef.docx exists in root folder" });
    }
};
