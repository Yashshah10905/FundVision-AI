import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plaid Configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "FundVision API is running" });
  });

  // Plaid: Create Link Token
  app.post('/api/create_link_token', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
        return res.status(500).json({ error: 'Plaid API credentials are not configured in environment variables.' });
      }

      const products = (process.env.PLAID_PRODUCTS || 'transactions')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean) as Products[];
        
      const countryCodes = (process.env.PLAID_COUNTRY_CODES || 'US')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean) as CountryCode[];

      const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: userId || 'anonymous_user' },
        client_name: 'FundVision AI',
        products,
        country_codes: countryCodes,
        language: 'en',
      });
      res.json(response.data);
    } catch (error: any) {
      const plaidError = error.response?.data;
      console.error('Plaid Link Token Error:', plaidError || error.message);
      res.status(500).json({ 
        error: plaidError?.error_message || error.message,
        code: plaidError?.error_code
      });
    }
  });

  // Plaid: Exchange Public Token and Sync Initial Data
  app.post('/api/set_access_token', async (req, res) => {
    try {
      const { public_token } = req.body;
      const exchangeResponse = await plaidClient.itemPublicTokenExchange({
        public_token,
      });
      
      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Fetch Item/Institution info
      const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
      const institutionId = itemResponse.data.item.institution_id;
      
      let institutionName = 'Connected Bank';
      if (institutionId) {
        const instResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: (process.env.PLAID_COUNTRY_CODES || 'US').split(',') as CountryCode[],
        });
        institutionName = instResponse.data.institution.name;
      }

      // Fetch initial transactions (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const transactionsResponse = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: thirtyDaysAgo.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
      });

      res.json({
        access_token: accessToken,
        item_id: itemId,
        institution_name: institutionName,
        accounts: transactionsResponse.data.accounts,
        transactions: transactionsResponse.data.transactions
      });
    } catch (error: any) {
      console.error('Plaid Exchange/Sync Error:', error.response?.data || error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Plaid: Fetch Transactions
  app.post('/api/plaid/transactions', async (req, res) => {
    try {
      const { access_token, start_date, end_date } = req.body;
      const response = await plaidClient.transactionsGet({
        access_token,
        start_date: start_date || '2023-01-01',
        end_date: end_date || new Date().toISOString().split('T')[0],
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Plaid Transactions Error:', error.response?.data || error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Placeholder for Transaction Auto-Categorization (Gemini)
  app.post("/api/transactions/categorize", async (req, res) => {
    // Logic will be implemented in later phases
    res.json({ category: "Uncategorized" });
  });

  // Placeholder for AI Chatbot
  app.post("/api/ai-chat", async (req, res) => {
    // Logic will be implemented in later phases
    res.json({ reply: "I am your FundVision assistant. How can I help you today?" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
