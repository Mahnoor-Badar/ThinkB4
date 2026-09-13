# Child Phishing Awareness & Cyber Defender App

An interactive, gamified cybersecurity awareness and phishing defense platform designed specifically for children, students, and young digital citizens. Built with React 19, Tailwind CSS, Cloud Firestore, and powered by Gemini AI for personalized threat coaching.

---

## Features

- **Interactive Phishing Simulator**: Real-world simulated threats covering fake game coin giveaways, fake school attendance warnings, smishing (SMS phishing), and social media scams.
- **Instant Educational Feedback**: Explains exact red flags (urgency hooks, spoofed domains, shortened links) when a choice is made.
- **Live Progress & Scoring**: Tracks total defense score, accuracy rates, and per-category threat strengths and weaknesses.
- **AI Cybersecurity Coach**: Powered by Google Gemini (`gemini-3.8-flash`) to review performance trends and generate personalized safety advice.
- **Role-Based Access Control**:
  - **Learner/Child**: Play challenges, track badges, submit feedback.
  - **Admin/Educator**: Toggle scenario visibility, create new threats, review feedback, and seed database content.
- **Cloud Firestore Database**: Persistent storage for profiles, scenarios, responses, feedback, and AI assessment logs with secure Firestore Security Rules.

---

## Project Structure

```text
├── src/
│   ├── firebase/
│   │   ├── config.ts              # Firebase app & Firestore initialization
│   │   ├── authService.ts         # Authentication & user profile management
│   │   ├── scenarioService.ts     # Active scenario queries and admin CRUD
│   │   ├── responseService.ts     # Atomic response recording & score aggregation
│   │   ├── progressService.ts     # Category metrics and badge calculations
│   │   ├── feedbackService.ts     # Student feedback submission & review
│   │   ├── aiService.ts           # Client-side AI coaching caller
│   │   └── seedData.ts            # Ready-to-use sample scenarios & profiles
│   ├── types/
│   │   └── index.ts               # Complete TypeScript data models
│   ├── App.tsx                    # Main interactive cyber defense UI
│   ├── main.tsx                   # React root mount
│   └── index.css                  # Global Tailwind CSS entry
├── server.ts                      # Express API proxy for Gemini AI calls
├── firestore.rules                # Cloud Firestore Security Rules
├── firestore.indexes.json         # Firestore Composite Query Indexes
├── firebase-blueprint.json        # Database schema definitions
├── package.json                   # Dependencies & scripts
└── vite.config.ts                 # Vite bundler configuration
```

---

## Quick Start & Local Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v20+
- [Git](https://git-scm.com/)
- A [Firebase](https://console.firebase.google.com/) project (with Cloud Firestore and Authentication enabled)
- A [Google Gemini API Key](https://aistudio.google.com/) (optional, for AI Coach)

### 2. Clone & Install
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_REPO_NAME>
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
# Google Gemini API Key for server-side AI Threat Coach
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Config (or configure in firebase-applet-config.json)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firestore Rules & Indexes
Install the Firebase CLI and deploy the rules:
```bash
npm install -g firebase-tools
firebase login
firebase use <your-firebase-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

- `npm run dev`: Starts the local development server at port 3000.
- `npm run build`: Compiles the React SPA and bundles production assets.
- `npm run start`: Runs the Node/Express server for API routes and production serving.
- `npm run lint`: Checks TypeScript types with `tsc --noEmit`.

---

## Pushing to GitHub

To push this project to a new GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit: Child Phishing Awareness Platform"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```
