module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // נתונים קבועים לבדיקה - בלי פנייה לגוגל
  const testData = {
    "daily_tip": "בדיקת מערכת: השרת של ורסל עובד!",
    "meals": [
      {
        "title": "ארוחת בוקר בדיקה",
        "cancer_inhibition": "השרת מצליח לשלוח נתונים",
        "systemic_benefit": "הבעיה היא כנראה מול גוגל"
      }
    ]
  };

  res.status(200).json(testData);
};