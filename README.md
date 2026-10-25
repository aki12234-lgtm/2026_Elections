# קלפי פורחת

מיצג אינטראקטיבי לבחירות לכנסת ה־26. כל פתק שנכנס לקלפי הופך לפרח. 30 הפתקים הראשונים ממלאים את הקלפי, ואחר כך כל פתק הוא פרח בגינה שמתפשטת בפאטצ'ים. ב־1,000 פתקים (`goal` ב־`site/config.js`) כל הקרקע ירוקה. המונה חי ומשותף לכל המבקרים. כל מבקר יכול להכניס פתק אחד, עד שהוא מרענן את הדף.

## מבנה

| קובץ | מה יש בו |
|---|---|
| `site/index.html` | הדף כולו: הקומפוזיציה מה־Figma, הגינה, הרוח, לוח הבדיקה |
| `site/config.js` | הגדרות: יעד הפתקים והחיבור ל־Firebase |
| `site/live.js` | המונה החי (Firebase Realtime Database) |
| `site/paper.jpg` | טקסטורת הנייר מה־Figma |
| `firebase/database.rules.json` | כללי מסד הנתונים: כל אחד קורא, וכתיבה מותרת רק בתור "הערך הנוכחי + 1" |
| `.github/workflows/pages.yml` | העלאה אוטומטית ל־GitHub Pages בכל push ל־`main` |
| `tools/make-preview.py` | בונה קובץ HTML אחד לתצוגה מקדימה, בלי שרת |

## הפעלה

### 1. Firebase (המונה החי)
1. ב־[console.firebase.google.com](https://console.firebase.google.com) יוצרים פרויקט חדש. Google Analytics לא נחוץ.
2. **Build → Realtime Database → Create database**. מיקום: `europe-west1`. מתחילים ב־locked mode.
3. בלשונית **Rules** מדביקים את התוכן של `firebase/database.rules.json` ולוחצים Publish.
4. **Project settings → Your apps → Web (`</>`)**. רושמים אפליקציה (בלי Hosting) ומעתיקים את `firebaseConfig`.
5. מדביקים את הערכים ב־`site/config.js`, במקום `firebase: null`. חובה שיהיה גם `databaseURL`.

הערכים האלה ציבוריים מטבעם, וזה בסדר. מה ששומר על המונה הם הכללים.

### 2. GitHub Pages
1. מעלים את התיקייה ל־repo ציבורי ב־GitHub, לענף `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. כל push ל־`main` מעלה את התיקייה `site/`. הכתובת מופיעה בלשונית Actions, ובדרך כלל היא `https://<user>.github.io/<repo>/`.

### 3. פונטים
הפונטים נטענים מהקיט של Adobe Fonts (`nsr0kgo`). לפי Adobe, קיטים כבר לא מוגבלים לדומיין, אז הם יעבדו גם ב־GitHub Pages.

## לוח הבדיקה
מוסיפים `?review` לכתובת (למשל `https://…/kalpi/?review`). בלוח יש מצבים מוכנים, סליידר, "כל התהליך", רוח ופונטים. כל מה שעושים בלוח הוא סימולציה מקומית ולא נוגע במונה האמיתי. הכפתור "חזרה לחי" מחזיר למונה האמיתי.

## איפוס המונה
ב־Firebase Console → Realtime Database, מוחקים את `votes/count`. כללי מסד הנתונים חוסמים איפוס מהדף עצמו.

## מגבלות ידועות
- ההגבלה של פתק אחד היא לטעינת דף. רענון מאפשר עוד פתק, כמו שהוגדר.
- אין הגנה מבוט שקורא ל־API ישירות. אם זה יהפוך לבעיה, אפשר להוסיף Firebase App Check.
