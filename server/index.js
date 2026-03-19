import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// ─── DEMO DATA ────────────────────────────────────────────────────
const DEMO_CLAIMS = [
  { id:"CLM-9871", name:"Joseph Maina",   amount:420000, type:"Total Loss",   status:"Flagged",    daysOld:45,  claimsHistory:3, time:"02:14", workshop:"Speedy Auto"   },
  { id:"CLM-9842", name:"Fatuma Said",    amount:52000,  type:"Windscreen",   status:"Approved",   daysOld:220, claimsHistory:0, time:"14:32", workshop:"SafeGlass"     },
  { id:"CLM-9819", name:"Eric Langat",    amount:185000, type:"Rear-End",     status:"Processing", daysOld:55,  claimsHistory:1, time:"11:20", workshop:"Toyota Kenya"  },
  { id:"CLM-9801", name:"Mary Wambui",    amount:95000,  type:"Theft",        status:"Approved",   daysOld:180, claimsHistory:0, time:"00:45", workshop:"N/A"           },
  { id:"CLM-9788", name:"Kipsang Rotich", amount:310000, type:"Flood Damage", status:"Pending",    daysOld:10,  claimsHistory:2, time:"09:00", workshop:"Nairobi Auto"  },
];

const DEMO_POLICIES = {
  "AU-449821":{ id:"AU-449821", holder:"Amina Wanjiru",   vehicle:"2019 Toyota Vitz",     value:1200000, premium:4200,  status:"Active",  expiry:"2027-01-15" },
  "AU-449822":{ id:"AU-449822", holder:"John Kamau",       vehicle:"2021 Nissan X-Trail",  value:3800000, premium:11200, status:"Active",  expiry:"2026-08-22" },
  "AU-449845":{ id:"AU-449845", holder:"Peter Muthoni",    vehicle:"2022 Toyota RAV4",     value:4200000, premium:13100, status:"Active",  expiry:"2027-03-30" },
};

const DEMO_DASHBOARD = {
  claimsToday: 247, claimsDelta: "+18%",
  fraudBlocked: "KES 4.1M", fraudDelta: "+23% this month",
  avgQuoteTime: "22s", quoteDelta: "↓ 94% vs manual",
  combinedRatio: "87.4%", ratioDelta: "Target <95%",
  recentClaims: [
    { id:"CLM-9981", name:"Alice Njeri",    type:"Rear-end collision", status:"Processing",   amount:145000 },
    { id:"CLM-9980", name:"Brian Otieno",   type:"Windscreen damage",  status:"Approved",     amount:28000  },
    { id:"CLM-9979", name:"Carol Mwende",   type:"Total loss",         status:"Under Review", amount:480000 },
    { id:"CLM-9978", name:"David Korir",    type:"Third party",        status:"Approved",     amount:62000  },
  ],
  agentHealth: [
    { name:"FNOL Agent",     uptime:99.9, calls:1247 },
    { name:"Fraud Agent",    uptime:99.7, calls:847  },
    { name:"Underwriting",   uptime:100,  calls:562  },
    { name:"Broker Copilot", uptime:99.5, calls:284  },
  ],
};

// In-memory claim store
const submittedClaims = [];

// ─── DATA ROUTES ─────────────────────────────────────────────────
app.get('/api/dashboard', (_req, res) => {
  res.json(DEMO_DASHBOARD);
});

app.get('/api/claims', (_req, res) => {
  res.json(DEMO_CLAIMS);
});

app.get('/api/policies/:id', (req, res) => {
  const policy = DEMO_POLICIES[req.params.id];
  if (!policy) return res.status(404).json({ error: 'Policy not found' });
  res.json(policy);
});

app.post('/api/claims', (req, res) => {
  const claimId = 'CLM-2026-' + Math.floor(8000 + Math.random() * 1999);
  submittedClaims.push({ ...req.body, id: claimId, createdAt: new Date() });
  res.json({ success: true, claimId });
});

// ─── OLLAMA AI ROUTE ──────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  const { system, user } = req.body;
  if (!system || !user) return res.status(400).json({ error: 'Missing system or user' });

  try {
    const prompt = system
      ? `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${system}<|eot_id|><|start_header_id|>user<|end_header_id|>\n${user}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`
      : user;

    const ollamaRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 1024 }
      })
    });

    if (!ollamaRes.ok) {
      const txt = await ollamaRes.text();
      return res.status(502).json({ error: 'Ollama error: ' + txt });
    }

    const data = await ollamaRes.json();
    res.json({ text: data.response || 'No response from model.' });
  } catch (err) {
    console.error('Ollama error:', err.message);
    res.status(502).json({ error: 'Cannot reach Ollama. Make sure it is running on port 11434.' });
  }
});

// ─── HEALTH ──────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  let ollamaOk = false;
  try {
    const r = await fetch('http://localhost:11434/api/tags');
    ollamaOk = r.ok;
  } catch {}
  res.json({ status: 'ok', ollama: ollamaOk });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`InsureAI server running on http://localhost:${PORT}`));
