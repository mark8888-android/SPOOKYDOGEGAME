import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory Dogecoin Core 1.5.0.0 state simulator (for 100% offline intranet gameplay)
interface MockCoreState {
  version: number;
  protocolversion: number;
  walletversion: number;
  balance: number;
  blocks: number;
  connections: number;
  proxy: string;
  ip: string;
  difficulty: number;
  testnet: boolean;
  keypoololdest: number;
  keypoolsize: number;
  paytxfee: number;
  errors: string;
  addresses: string[];
  transactions: Array<{
    txid: string;
    address: string;
    category: 'send' | 'receive' | 'generate';
    amount: number;
    fee?: number;
    confirmations: number;
    time: number;
  }>;
}

const mockCore: MockCoreState = {
  version: 1050000, // Dogecoin Core 1.5.0.0
  protocolversion: 70002,
  walletversion: 60000,
  balance: 9000.0, // User mined 9,000 DOGE
  blocks: 154238,
  connections: 8,
  proxy: '',
  ip: '127.0.0.1',
  difficulty: 1042.85,
  testnet: false,
  keypoololdest: 1386500000,
  keypoolsize: 101,
  paytxfee: 1.0,
  errors: '',
  addresses: [
    'DCw6fcHAWmLvsKCz5pKAahUY4JKhZjKuY9',
    'DD8sdZWMmvYyvprJihe89CqRPEPnecW3X5',
    'DNh8SjmkB6exDooLaZX86Kiw9F5Lh6BJqB',
    'DMx8m2qY8cQvPq9KkLnXv7Y3rWsTvWb4A1',
    'DQj7kPvM4R9zTy2vKk8sLw5eRnB4cXm8P3',
  ],
  transactions: [
    {
      txid: '9b5a034f8e6c7104b901a1c97f48e3e4a5d8b76c5e2d1f0e9d8c7b6a5e4d3c2b',
      address: 'DCw6fcHAWmLvsKCz5pKAahUY4JKhZjKuY9',
      category: 'generate',
      amount: 9000.0,
      confirmations: 120,
      time: Math.floor(Date.now() / 1000) - 86400 * 30,
    }
  ]
};

// RPC proxy endpoint for Dogecoin Core 1.5.0.0
app.post('/api/doge-rpc', async (req: Request, res: Response) => {
  const { host = '127.0.0.1', port = 22555, rpcuser = '', rpcpassword = '', method, params = [], forceMock = false } = req.body;

  if (!forceMock && rpcuser && rpcpassword) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${rpcuser}:${rpcpassword}`).toString('base64');
      const coreUrl = `http://${host}:${port}/`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const rpcResponse = await fetch(coreUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          jsonrpc: '1.0',
          id: 'spooky-halloween-doge',
          method,
          params,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (rpcResponse.ok) {
        const data = await rpcResponse.json();
        return res.json({ success: true, liveCore: true, ...data });
      }
    } catch {
      // Fallback seamlessly to mock daemon if actual daemon isn't running or reachable
    }
  }

  // Handle Mock Dogecoin Core 1.5.0.0 JSON-RPC
  let result: unknown = null;
  let error: { code: number; message: string } | null = null;

  switch (method) {
    case 'getinfo':
      result = {
        version: mockCore.version,
        protocolversion: mockCore.protocolversion,
        walletversion: mockCore.walletversion,
        balance: mockCore.balance,
        blocks: mockCore.blocks,
        timeoffset: 0,
        connections: mockCore.connections,
        proxy: mockCore.proxy,
        difficulty: mockCore.difficulty,
        testnet: mockCore.testnet,
        keypoololdest: mockCore.keypoololdest,
        keypoolsize: mockCore.keypoolsize,
        paytxfee: mockCore.paytxfee,
        errors: mockCore.errors,
      };
      break;

    case 'getbalance':
      result = mockCore.balance;
      break;

    case 'getnewaddress': {
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let addr = 'D';
      for (let i = 0; i < 33; i++) {
        addr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      mockCore.addresses.push(addr);
      result = addr;
      break;
    }

    case 'sendtoaddress': {
      const targetAddress = params[0];
      const amount = Number(params[1]);
      if (isNaN(amount) || amount <= 0) {
        error = { code: -3, message: 'Invalid amount' };
      } else if (amount > mockCore.balance) {
        error = { code: -6, message: 'Insufficient funds in Dogecoin Core 1.5.0.0 wallet' };
      } else {
        mockCore.balance -= amount;
        const txid = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        mockCore.transactions.unshift({
          txid,
          address: targetAddress,
          category: 'send',
          amount: -amount,
          fee: -1.0,
          confirmations: 1,
          time: Math.floor(Date.now() / 1000),
        });
        mockCore.blocks += 1;
        result = txid;
      }
      break;
    }

    case 'listtransactions':
      result = mockCore.transactions.slice(0, 30);
      break;

    case 'validateaddress': {
      const addressToValidate = params[0];
      const isValid = typeof addressToValidate === 'string' && addressToValidate.startsWith('D') && addressToValidate.length === 34;
      result = {
        isvalid: isValid,
        address: addressToValidate,
        ismine: mockCore.addresses.includes(addressToValidate),
      };
      break;
    }

    case 'resetmockcore':
      mockCore.balance = 9000.0;
      mockCore.blocks = 154238;
      result = { message: 'Dogecoin Core 1.5.0.0 simulator reset to initial mined 9,000 DOGE' };
      break;

    default:
      result = { status: 'Method supported in mock mode', method, params };
      break;
  }

  return res.json({
    result,
    error,
    id: 'spooky-halloween-doge',
    liveCore: false,
    mockSimulated: true,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spooky Doge Core 1.5 server listening on port ${PORT}`);
  });
}

startServer();
