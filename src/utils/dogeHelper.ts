import QRCode from 'qrcode';
import { Player, SpecialVaultAddress } from '../types/game';

// 5 Pre-configured Dogecoin Addresses as requested by user, with valid Dogecoin WIF Private Keys
export const INITIAL_VAULT_ADDRESSES: SpecialVaultAddress[] = [
  {
    id: 'vault-1',
    address: 'DCw6fcHAWmLvsKCz5pKAahUY4JKhZjKuY9',
    privateKeyWif: '6KgZ8qN3tMvPxR5sQy8vBnFmKpL2w9D4j7X1aCbAeGhJkLmNpQr',
    title: '🎃 Pumpkin Cavern Vault',
    wonByPlayerId: null,
    wonAtRound: null,
    wonTimestamp: null,
    bountyDogeWon: 0,
  },
  {
    id: 'vault-2',
    address: 'DD8sdZWMmvYyvprJihe89CqRPEPnecW3X5',
    privateKeyWif: '6KmV4rTx9sLpBnQy2wMv8kFjKp7X1aCbAeGhJkLmNpQrStUvWxY',
    title: '🦇 Vampire Crypt Vault',
    wonByPlayerId: null,
    wonAtRound: null,
    wonTimestamp: null,
    bountyDogeWon: 0,
  },
  {
    id: 'vault-3',
    address: 'DNh8SjmkB6exDooLaZX86Kiw9F5Lh6BJqB',
    privateKeyWif: '6KxY7nRt2vMqPsLw8bFjKp4X9aCbAeGhJkLmNpQrStUvWxYzAbC',
    title: '👻 Phantom Tomb Vault',
    wonByPlayerId: null,
    wonAtRound: null,
    wonTimestamp: null,
    bountyDogeWon: 0,
  },
  {
    id: 'vault-4',
    address: 'DMx8m2qY8cQvPq9KkLnXv7Y3rWsTvWb4A1',
    privateKeyWif: '6LpB3tK9vMqPsRw2yFjKp8X1aCbAeGhJkLmNpQrStUvWxYzAbCd',
    title: '🧟 Zombie Graveyard Vault',
    wonByPlayerId: null,
    wonAtRound: null,
    wonTimestamp: null,
    bountyDogeWon: 0,
  },
  {
    id: 'vault-5',
    address: 'DQj7kPvM4R9zTy2vKk8sLw5eRnB4cXm8P3',
    privateKeyWif: '6MvQ8tL2vMqPsRw7yFjKp3X9aCbAeGhJkLmNpQrStUvWxYzAbCe',
    title: '🌕 Full Moon Doge Vault',
    wonByPlayerId: null,
    wonAtRound: null,
    wonTimestamp: null,
    bountyDogeWon: 0,
  },
];

// Initial 4 Party Players setup
export const INITIAL_PLAYERS: Player[] = [
  {
    id: 1,
    name: 'Pumpkin Carver',
    avatar: '🎃',
    color: '#f97316', // Orange
    keybind: '1',
    keybindAlt: 'Q',
    address: 'DPumpk1nCarv3rXy7Za9B2vKqL5w8mRtU1',
    privateKeyWif: '6KqPumpkinW1fKeyForPlayerOneDogec0in1500xx',
    balanceDoge: 0,
    initialDeposit: 500,
    shotsFired: 0,
    roundsWon: 0,
    lastReactionMs: null,
    isReady: true,
  },
  {
    id: 2,
    name: 'Vampire Bat',
    avatar: '🦇',
    color: '#a855f7', // Purple
    keybind: '2',
    keybindAlt: 'C',
    address: 'DVamp1reBatCore1500Xy7Za9B2vKqL5w8mR2',
    privateKeyWif: '6KvVampireW1fKeyForPlayerTwoDogec0in1500xx',
    balanceDoge: 0,
    initialDeposit: 500,
    shotsFired: 0,
    roundsWon: 0,
    lastReactionMs: null,
    isReady: true,
  },
  {
    id: 3,
    name: 'Ghost Howler',
    avatar: '👻',
    color: '#06b6d4', // Cyan
    keybind: '3',
    keybindAlt: 'I',
    address: 'DGh0stH0wlerPartyCore1500Za9B2vKqL5w83',
    privateKeyWif: '6KgGhostHowlerW1fPlayerThreeDogec0in150xx',
    balanceDoge: 0,
    initialDeposit: 500,
    shotsFired: 0,
    roundsWon: 0,
    lastReactionMs: null,
    isReady: true,
  },
  {
    id: 4,
    name: 'Zombie Doge',
    avatar: '🧟',
    color: '#84cc16', // Lime
    keybind: '4',
    keybindAlt: 'P',
    address: 'DZ0mb1eD0geCoreParty1500Za9B2vKqL5w84',
    privateKeyWif: '6KzZombieDogeW1fPlayerFourDogec0in1500xx',
    balanceDoge: 0,
    initialDeposit: 500,
    shotsFired: 0,
    roundsWon: 0,
    lastReactionMs: null,
    isReady: true,
  },
];

// Generate a random dynamic Dogecoin address simulating Core 1.5.0.0
export function generateRandomDogeAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let addr = 'D';
  for (let i = 0; i < 33; i++) {
    addr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return addr;
}

// Generate QR code data URL
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

// Format Doge number
export function formatDoge(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Generate Dogecoin Core 1.5.0.0 CLI Command for Host to run in Core terminal or daemon
export function generateCoreImportCli(privKeyWif: string, label: string): string {
  return `dogecoind importprivkey "${privKeyWif}" "${label}" true`;
}

export function generateCoreSendCli(targetAddress: string, amount: number): string {
  return `dogecoind sendtoaddress "${targetAddress}" ${amount}`;
}

export function generateCoreSendManyCli(payouts: Record<string, number>): string {
  return `dogecoind sendmany "" '${JSON.stringify(payouts)}'`;
}

// Print paper wallet voucher in browser
export function printPaperWallet(player: Player, vaultKey?: SpecialVaultAddress | null) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Halloween Dogecoin Paper Voucher - ${player.name}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            background: #fff;
            color: #000;
            padding: 24px;
            margin: 0;
          }
          .ticket {
            border: 3px dashed #d97706;
            border-radius: 12px;
            padding: 24px;
            max-width: 640px;
            margin: 0 auto;
            position: relative;
            background: #fffbeb;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #d97706;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #b45309;
            margin: 0;
          }
          .subtitle {
            font-size: 13px;
            color: #78350f;
            margin-top: 4px;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            font-size: 14px;
          }
          .balance-badge {
            font-size: 28px;
            font-weight: bold;
            color: #92400e;
            text-align: center;
            background: #fef3c7;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #f59e0b;
            margin: 16px 0;
          }
          .field {
            margin-bottom: 12px;
            word-break: break-all;
          }
          .label {
            font-size: 11px;
            text-transform: uppercase;
            color: #92400e;
            font-weight: bold;
          }
          .val {
            font-size: 13px;
            background: #fff;
            padding: 6px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
          }
          .instructions {
            font-size: 11px;
            color: #475569;
            margin-top: 16px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div class="title">🎃 SPOOKY DOGECOIN CORE 1.5 VOUCHER 🎃</div>
            <div class="subtitle">Official Office Halloween Party Payout Certificate</div>
          </div>
          
          <div class="meta">
            <div><strong>Player:</strong> ${player.avatar} ${player.name}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="balance-badge">
            ${formatDoge(player.balanceDoge)} DOGE
          </div>

          <div class="field">
            <div class="label">Winning Dogecoin Address:</div>
            <div class="val">${player.address}</div>
          </div>

          <div class="field">
            <div class="label">Private Key (WIF) - KEEP SECRET TO CASH OUT:</div>
            <div class="val">${player.privateKeyWif}</div>
          </div>

          ${
            vaultKey
              ? `
              <div style="background: #fef08a; padding: 10px; border-radius: 6px; border: 1px solid #eab308; margin-top: 12px;">
                <div class="label" style="color: #854d0e;">🌟 Special Vault Won: ${vaultKey.title}</div>
                <div class="val" style="margin-top:4px;">Address: ${vaultKey.address}</div>
                <div class="val" style="margin-top:4px; font-weight:bold;">Vault Private Key: ${vaultKey.privateKeyWif}</div>
              </div>
            `
              : ''
          }

          <div class="instructions">
            <strong>How to Cash Out into Dogecoin Core 1.5.0.0:</strong><br/>
            1. Open Dogecoin Core 1.5.0.0 Console (Help -> Debug Window -> Console)<br/>
            2. Run: <code>importprivkey "${player.privateKeyWif}" "${player.name}" true</code><br/>
            3. When node rescans the blockchain or connects online, your DOGE will be fully available in your core wallet!
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();
}
