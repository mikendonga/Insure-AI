# 🛡 InsureAI Platform

AI-powered auto insurance platform for Kenya. Built with React + Node.js + Ollama (Llama 3.2).

## Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **Ollama** — https://ollama.com

## Quick Start

### 1. Install Ollama & pull the model
```bash
# Install Ollama from https://ollama.com, then:
ollama pull llama3.2
ollama serve   # keep this running
```

### 2. Start the backend
```bash
cd server
npm install
npm start
# Runs on http://localhost:3001
```

### 3. Start the frontend (new terminal)
```bash
cd client
npm install
npm start
# Opens http://localhost:3000
```

### Or use the start script
```bash
chmod +x start.sh
./start.sh
```

## Demo Accounts

| Role        | Email                       | Password   |
|-------------|-----------------------------|------------|
| Admin       | admin@insureai.co.ke        | admin123   |
| Adjuster    | adjuster@insureai.co.ke     | adj123     |
| Underwriter | uw@insureai.co.ke           | uw123      |
| Broker      | broker@insureai.co.ke       | broker123  |
| Customer    | customer@insureai.co.ke     | cust123    |

## Architecture

```
insureai/
├── server/          # Node.js + Express backend
│   └── index.js     # API routes + Ollama proxy
└── client/          # React frontend
    └── src/App.jsx  # Full single-file React app
```

## Features

- **Dashboard** — Live KPIs, recent claims, agent health
- **FNOL Agent** — Policy lookup, incident filing, AI analysis
- **Fraud Detection** — AI risk scoring per claim
- **Underwriting** — AI-driven risk assessment & premium calculation
- **Broker Copilot** — Multi-insurer quote comparison
- **Customer Chat** — Conversational AI assistant
- **Role-based access** — Admin / Adjuster / Underwriter / Broker / Customer

All AI features use your local **Llama 3.2** model via Ollama — no external API keys needed.
"# Insure-AI" 
