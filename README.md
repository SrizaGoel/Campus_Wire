#  CampusWire v2.0

CampusWire is a campus social platform where students can post updates, react, follow users, and track activity — built with **Node.js, Express, PostgreSQL, and vanilla JS frontend**.

This is **Version 2.0** with authentication, email verification, reactions, follow system, admin tools, and activity tracking.

---
## Live Demo
https://campus-wire.onrender.com
## Features

### Authentication

* User registration & login
* Password hashing (bcrypt)
* JWT authentication
* Email verification via Nodemailer
* Protected routes

### Posts

* Create posts with emotion tags
* Upload images
* Profanity detection with automatic warnings
* User warnings → auto deactivate after threshold

### Reactions & Comments

* Like 
* Comment system
* Reaction counts per post
* Who reacted modal

### Social

* Follow / Unfollow users
* Followers & Following list
* Profile pages

### UI

* Responsive layout
* Toast notifications
* Profile activity cards

---

## Tech Stack

**Frontend**

* HTML
* CSS
* Vanilla JavaScript

**Backend**

* Node.js
* Express.js
* PostgreSQL
* JWT
* Multer (image uploads)
* Nodemailer (email verification)

**Deployment**

* Render 

---

##  Project Structure

```
CampusWire/
│
├── middleware/
│   └── auth.js
│
├── routes/
│   ├── authRoutes.js
│   ├── postRoutes.js
│   ├── reactionRoutes.js
│   ├── followRoutes.js
│   ├── adminRoutes.js
│   ├── activityRoutes.js
│   ├── themeRoutes.js
│   └── userRoutes.js
│
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── profile.html
│   ├── script.js
│   ├── styles.css
│
├── uploads/
├── utils/
├── db.js
├── .env
└── server.js
```

---

## Environment Variables

Create `.env` in root:

```
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret_key

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

APP_URL=http://localhost:4000
WARN_THRESHOLD=3
PORT=4000
```

Use **Gmail App Password**, NOT your Gmail password.

---

## Run Locally

### 1. Install dependencies

```
npm install
```

### 2️. Start server

```
node server.js
```

or

```
npm start
```

### 3️. Open browser

```
http://localhost:4000
```

---

## Deployment (Render)

### Backend

1. Push repo to GitHub
2. Go to Render → New Web Service
3. Connect GitHub repo
4. Build command:

```
npm install
```

5. Start command:

```
node server.js
```

6. Add environment variables in Render dashboard

---



## Versioning Strategy

* `main` → stable production version
* `version2` → new features / development
* 

##  Author

Built by **Sriza Goel** : Campus social platform project 
---

## Future Improvements

* Real-time notifications
* Chat system
* Dark/light theme toggle
* Image compression
* Email password reset

