# 🤖 Super-ABG

**Super-ABG** هو بوت Discord ذكي قابل للتطوير، مصمم للمحادثة العربية والتفاعل مع المستخدمين، مع نظام ذاكرة وشخصية قابلة للتخصيص ودعم مزودي AI متعددين.

> 🚧 **المشروع قيد التطوير**
>
> توجد تحديثات وتحسينات أخرى قادمة إلى Super-ABG. بعض المزايا الحالية قد تتغير أو تتوسع مع استمرار التطوير.

---

## ✨ المميزات

- 🤖 Discord AI Assistant
- 🇪🇬 دعم المحادثة العربية
- 🧠 نظام ذاكرة للمحادثات
- 🎭 شخصية قابلة للتخصيص
- ⚡ دعم Groq كمزود AI أساسي
- 🔄 إمكانية استخدام مزودي AI بدلاء
- 🎙️ دعم Whisper لمعالجة الصوت
- 🔎 Web Search
- 🧩 نظام إعدادات مركزي
- 🔐 فصل الأسرار عن إعدادات المشروع
- 📦 مناسب للتشغيل على Termux
- 🚀 قابل للنشر على خدمات الاستضافة التي تدعم Node.js والبوتات طويلة التشغيل

---

# 📋 المتطلبات

قبل التثبيت تحتاج إلى:

- Android
- Termux
- Node.js
- npm
- Git
- حساب Discord Developer
- Discord Bot Token
- Groq API Key

---

# 📱 تثبيت Termux

يفضل استخدام نسخة Termux الحديثة من المصدر الرسمي للمشروع.

بعد فتح Termux:

```bash
pkg update && pkg upgrade

ثم:

pkg install git nodejs

تأكد من التثبيت:

node --version
npm --version
git --version


---

📥 تحميل Super-ABG

استنسخ المشروع:

git clone https://github.com/asdasder456123/Super-ABG.git

ثم:

cd Super-ABG


---

📦 تثبيت Dependencies

داخل مجلد المشروع:

npm install

بعد انتهاء التثبيت، تأكد من وجود:

node_modules


---

🔐 إعداد الأسرار

مهم جدًا:

لا تضع أي Token أو API Key داخل:

config.yaml

ملف:

.env

مخصص للأسرار فقط.

أنشئه:

cp .env.example .env

ثم افتحه:

nano .env

ضع بياناتك:

DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
GROQ_API_KEY=YOUR_GROQ_API_KEY

استبدل القيم ببياناتك الحقيقية.

⚠️ لا تشارك ملف .env

لا تنشر:

.env

ولا ترسل محتواه لأي شخص.


---

⚙️ إعدادات Super-ABG

كل إعدادات التشغيل موجودة في:

config.yaml

مثل:

Discord

الردود

Whisper

Web Search

Embedding

AI Models

Timeout

Retry

Fallback Providers

وغيرها من إعدادات التشغيل


أما الأسرار والتوكنات فهي في:

.env


---

🧠 مزود الذكاء الاصطناعي

المزود الأساسي حاليًا:

Groq

ويمكن تغيير الموديل من:

config.yaml

مثال:

ai:
  primary: my_groq

ولا يتم وضع مفتاح Groq داخل YAML.

المفتاح يكون في:

GROQ_API_KEY=YOUR_GROQ_API_KEY


---

▶️ تشغيل البوت

بعد إعداد .env:

npm start

أو:

node index.js

إذا بدأ البوت بنجاح، سيظهر في Discord بعد تسجيل الدخول بواسطة الـBot Token.


---

🛑 إيقاف البوت

اضغط:

Ctrl + C


---

🔄 تشغيل البوت مرة أخرى

cd ~/Super-ABG
npm start

إذا كان المشروع داخل مسار مختلف، ادخل إلى مساره أولًا.


---

📁 بنية المشروع

بشكل عام يحتوي المشروع على مكونات مثل:

Super-ABG/
├── data/
├── src/
├── config.yaml
├── config-loader.js
├── index.js
├── commands.js
├── security.js
├── start.js
├── start.sh
├── package.json
├── package-lock.json
├── .env
└── .env.example


---

🔒 الأمان

Super-ABG يفصل بين:

Settings

config.yaml

و:

Secrets

.env

لا تضع:

Discord Tokens

API Keys

Passwords

Secrets

Authorization credentials


داخل config.yaml.


---

🧪 التطوير والاختبار

قبل إرسال تحديثات للمشروع، يفضل التأكد من:

npm install

ثم تشغيل:

npm start

ومراجعة الـlogs للتأكد من عدم وجود أخطاء.


---

🚧 التحديثات القادمة

المشروع ما زال تحت التطوير، وهناك تحديثات قادمة تشمل تحسينات محتملة في:

🧠 الذكاء الاصطناعي

💾 الذاكرة

🎭 الشخصية

💬 المحادثات العربية

⚡ الأداء

🔐 الأمان

🎙️ معالجة الصوت

🔎 البحث

🔄 نظام Fallback

🧩 نظام الإعدادات

📦 تحسين تجربة التثبيت

🚀 تحسينات النشر والاستضافة

🛠️ إصلاحات وتحسينات عامة


سيتم إضافة المزيد من المميزات مع تقدم المشروع.


---

🌐 المشروع

GitHub:

https://github.com/asdasder456123/Super-ABG


---

📜 License

Super-ABG is released under the MIT License.


---

👨‍💻 Developer

محمد عادل


---

⭐ Support

إذا أعجبك المشروع، يمكنك عمل Star على GitHub ومتابعة التحديثات القادمة.

Super-ABG — Arabic AI Discord Assistant 🤖🇪🇬 


# 📜 License

## Super-ABG Custom Attribution License v1.0

**Copyright © 2026 asdasder456123**

**Original Project:** Super-ABG  
**Original Project Owner:** `asdasder456123`  
**Effective Date:** September 3, 2026

Super-ABG is an original project created and developed by
**asdasder456123**.

The copyright and original authorship of the Super-ABG project remain
with **asdasder456123**.

### Copyright & Permissions

The license permits users to:

- Copy the project.
- Use the project.
- Study the project.
- Modify the project.
- Create forks.
- Create derivative works.
- Redistribute original or modified versions.
- Use the project for personal or commercial purposes.

These permissions are granted only subject to the complete terms of
the `LICENSE` file.

### Original Ownership

Copying, modifying, forking, or redistributing Super-ABG does not
transfer ownership of the original project.

The original project must continue to be attributed to:

**Super-ABG — Original Project by asdasder456123**

No person or organization may claim to be the original creator of
Super-ABG.

### Attribution

When redistributing, publishing, displaying, documenting, reviewing,
demonstrating, or substantially presenting Super-ABG, the original
project attribution must be preserved where reasonably practical.

Official repository:

https://github.com/asdasder456123/Super-ABG

### Modified Versions

Modified versions are allowed.

However, modified versions must clearly distinguish themselves from
the original Super-ABG project and must not falsely claim to be the
original or official version.

### Copyright Notice

**Copyright © 2026 asdasder456123**  
**Super-ABG — Original Project**

See the [`LICENSE`](LICENSE) file for the complete license terms.

---

# 👨‍💻 Original Project Owner

**GitHub:** `asdasder456123`

**Project:** `Super-ABG`

**Original Project Date:** September 3, 2026

**Original Author:** `asdasder456123`

---

# ⭐ Support

إذا أعجبك المشروع، يمكنك عمل Star على GitHub ومتابعة التحديثات القادمة.

**Super-ABG — Arabic AI Discord Assistant 🤖🇪🇬**
