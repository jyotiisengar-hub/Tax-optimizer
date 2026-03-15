import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");

async function initDb() {
  try {
    await fs.access(DB_FILE);
    // Migration: Fix ICICI person names
    const db = await readDb();
    let changed = false;
    if (db.transactions) {
      db.transactions = db.transactions.map((t: any) => {
        if (t.person === 'ICICI') {
          changed = true;
          return { ...t, person: 'Unknown' };
        }
        return t;
      });
    }
    if (changed) {
      await writeDb(db);
      console.log("Migration: Fixed ICICI person names in transactions");
    }
  } catch {
    const initialData = {
      transactions: [
        {
          id: "sample-1",
          date: "2024-10-31",
          merchant: "Amazon.com Services LLC",
          person: "Household Member 1",
          amount: 19350.01,
          currency: "USD",
          type: "INCOME",
          category: "Salary",
          rawDescription: "Earnings Statement - Pay Date: 10/31/2024",
          sourceFileId: "sample-file-1"
        },
        {
          id: "sample-2",
          date: "2024-11-05",
          merchant: "Whole Foods",
          person: "Household Member 1",
          amount: 154.20,
          currency: "USD",
          type: "EXPENSE",
          category: "Groceries",
          rawDescription: "WHOLEFOODS MARKET BELLEVUE",
          sourceFileId: "sample-file-2"
        },
        {
          id: "sample-3",
          date: "2024-11-01",
          merchant: "Avalon Bellevue",
          person: "Household Member 1",
          amount: 3200.00,
          currency: "USD",
          type: "EXPENSE",
          category: "Rent",
          rawDescription: "RENT PAYMENT - NOV 2024",
          sourceFileId: "sample-file-2"
        },
        {
          id: "sample-4",
          date: "2024-11-10",
          merchant: "Starbucks",
          person: "Household Member 2",
          amount: 12.50,
          currency: "USD",
          type: "EXPENSE",
          category: "Dining",
          rawDescription: "STARBUCKS COFFEE",
          sourceFileId: "sample-file-3"
        },
        {
          id: "sample-5",
          date: "2024-10-31",
          merchant: "IRS - Federal Tax",
          person: "Household Member 1",
          amount: 4057.23,
          currency: "USD",
          type: "EXPENSE",
          category: "Tax",
          rawDescription: "Federal Income Tax Deduction",
          sourceFileId: "sample-file-1"
        },
        {
          id: "sample-6",
          date: "2024-10-31",
          merchant: "Social Security",
          person: "Household Member 1",
          amount: 280.86,
          currency: "USD",
          type: "EXPENSE",
          category: "Tax",
          rawDescription: "Medicare Tax Deduction",
          sourceFileId: "sample-file-1"
        }
      ],
      statements: [
        {
          id: "sample-file-1",
          name: "Amazon_Paystub_Oct_2024.pdf",
          person: "Household Member 1",
          uploadDate: new Date().toISOString(),
          status: "completed",
          transactionCount: 1
        },
        {
          id: "sample-file-2",
          name: "Chase_Checking_Nov_2024.pdf",
          person: "Household Member 1",
          uploadDate: new Date().toISOString(),
          status: "completed",
          transactionCount: 2
        },
        {
          id: "sample-file-3",
          name: "Amex_Gold_Nov_2024.pdf",
          person: "Household Member 2",
          uploadDate: new Date().toISOString(),
          status: "completed",
          transactionCount: 1
        }
      ],
      merchantRules: [],
      familyMembers: [],
      preferences: {}
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

async function readDb() {
  const data = await fs.readFile(DB_FILE, "utf-8");
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  await initDb();
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/data", async (req, res) => {
    try {
      const db = await readDb();
      res.json(db);
    } catch (error) {
      res.status(500).json({ error: "Failed to read database" });
    }
  });

  app.post("/api/sync", async (req, res) => {
    try {
      const { transactions, statements, merchantRules, preferences } = req.body;
      const db = await readDb();
      
      if (transactions !== undefined) db.transactions = transactions;
      if (statements !== undefined) db.statements = statements;
      if (merchantRules !== undefined) db.merchantRules = merchantRules;
      if (preferences !== undefined) db.preferences = { ...db.preferences, ...preferences };
      
      await writeDb(db);
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync database" });
    }
  });

  app.get("/api/:store", async (req, res) => {
    try {
      const { store } = req.params;
      const db = await readDb();
      res.json(db[store] || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to read store" });
    }
  });

  app.post("/api/:store", async (req, res) => {
    try {
      const { store } = req.params;
      const data = req.body;
      const db = await readDb();
      
      console.log(`Updating store: ${store}, data size: ${JSON.stringify(data).length}`);

      if (store === 'preferences') {
        db.preferences = { ...db.preferences, ...data };
      } else if (Array.isArray(data)) {
        if (store === 'transactions' || store === 'statements') {
          if (!db[store]) db[store] = [];
          // Use a Map to prevent duplicates by ID
          const existingMap = new Map(db[store].map((item: any) => [item.id, item]));
          data.forEach((item: any) => {
            if (item && item.id) {
              existingMap.set(item.id, item);
            }
          });
          db[store] = Array.from(existingMap.values());
        } else {
          db[store] = data;
        }
      } else {
        // Single item update (e.g. merchantRule)
        if (!db[store]) db[store] = [];
        const index = db[store].findIndex((item: any) => 
          (item.id && item.id === data.id) || (item.merchant && item.merchant === data.merchant)
        );
        if (index > -1) db[store][index] = data;
        else db[store].push(data);
      }
      
      await writeDb(db);
      console.log(`Successfully updated ${store}. Total transactions: ${db.transactions.length}`);
      res.json({ status: "ok" });
    } catch (error) {
      console.error(`Failed to update store ${req.params.store}:`, error);
      res.status(500).json({ error: "Failed to update store" });
    }
  });

  app.delete("/api/statements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const db = await readDb();
      db.statements = db.statements.filter((s: any) => s.id !== id);
      db.transactions = db.transactions.filter((t: any) => t.sourceFileId !== id);
      await writeDb(db);
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete statement" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
