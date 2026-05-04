# The Rack

An AI-assisted clothing store built with React, Node.js, MongoDB, Stripe, and Google Gemini.

## Project structure

```
the-rack/
├── server/    Express API + MongoDB + Stripe + Gemini
└── frontend/        React app (CRA)
```

## Local development

### Server

```bash
cd "server"
npm install
cp .env.example .env       # fill in your keys
node seed.js               # one-time: populates the products collection
npm run start-dev
```

Server runs on http://localhost:5001

### UI

```bash
cd "frontend"
npm install
cp .env.example .env       # fill in your Stripe publishable key
npm start
```

UI runs on http://localhost:3000

## Tech stack

- **Frontend:** React, React Router, Tailwind CSS, Stripe Elements, Lucide icons
- **Backend:** Node.js, Express, MongoDB (Atlas), bcrypt, JWT
- **Payments:** Stripe (test mode)
- **AI:** Google Gemini 2.5 Flash (the in-store stylist, "Iba")

## Deployment

This repo deploys as a monorepo to Vercel (frontend) + Render (backend). Both
platforms support specifying a root directory at deploy time so they can build
from `frontend` and `server` respectively. See deployment notes
in the project documentation.

## Environment variables

See `.env.example` in each folder for the complete list and descriptions.

**Server requires:**
- `MONGODB_URI` (full Atlas connection string)
- `JWT_SECRET` (long random string)
- `STRIPE_SECRET_KEY` (sk_test_... from Stripe dashboard)
- `GEMINI_API_KEY` (from Google AI Studio)
- `CLIENT_URL` (production frontend URL, comma-separated for multiple)

**UI requires:**
- `REACT_APP_API_BASE` (production backend URL)
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` (pk_test_... from Stripe dashboard)

## Test Walkthrough
 
1. Visit https://the-rack-rosy.vercel.app/
2. Wait ~30 seconds for the backend to wake up on first load
3. Browse categories or open Iba (chat button, bottom right) and try prompts like *"warm jacket"*, *"running shoes in black"*, or *"help me build an outfit"*
4. Add items to your cart as a guest
5. Sign up — your guest cart will merge into your account
6. Check out using Stripe test card `4242 4242 4242 4242`, any future date, any CVC, any postal code
7. View your order under "My Orders"
No real money is processed — Stripe is in test mode.
