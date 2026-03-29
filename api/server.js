const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // הגדרות CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // הדרך הבטוחה ביותר למצוא את הקובץ ב-Vercel
    const filePath = path.join(process.cwd(), 'data.json');
    
    if (!fs.existsSync(filePath)) {
      throw new Error("קובץ data.json לא נמצא בתיקייה הראשית");
    }

    const jsonData = fs.readFileSync(filePath, 'utf8');
    res.status(200).json(JSON.parse(jsonData));
    
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ 
      error: "שגיאת שרת", 
      details: error.message 
    });
  }
};