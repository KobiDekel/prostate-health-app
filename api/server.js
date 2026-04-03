const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Create a 7-day meal plan for Gleason 3+4. 
        On Saturday, eat only purple broccoli.
        Return ONLY a JSON object with this exact key name:
        {"weekly_plan": [{"day": "יום א'", "breakfast": "...", "lunch": "...", "dinner": "..."}]}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // ניקוי תגיות קוד אם ה-AI הוסיף אותן
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const data = JSON.parse(cleanJson);

        // וידוא שהמפתח הנכון נשלח לאתר
        res.status(200).json(data.weekly_plan ? data : { weekly_plan: data });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Failed to parse data", details: error.message });
    }
};