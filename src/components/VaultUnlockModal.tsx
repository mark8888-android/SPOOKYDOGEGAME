import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Printer, QrCode, X, Sparkles, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player, SpecialVaultAddress } from '../types/game';
import { generateQrDataUrl, printPaperWallet } from '../utils/dogeHelper';
import { sounds } from '../utils/audio';

interface VaultUnlockModalProps {
  vault: SpecialVaultAddress | null;
  winner: Player | null;
  onClose: () => void;
}

export const VaultUnlockModal: React.FC<VaultUnlockModalProps> = ({ vault, winner, onClose }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [showKeyText, setShowKeyText] = useState(true);

  useEffect(() => {
    if (vault) {
      sounds.playVaultUnlock();

      // Trigger Halloween celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#a855f7', '#10b981'],
      });

      generateQrDataUrl(vault.privateKeyWif).then((url) => setQrUrl(url));
    }
  }, [vault]);

  if (!vault || !winner) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(vault.privateKeyWif);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(vault.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handlePrint = () => {
    printPaperWallet(winner, vault);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border-2 border-amber-500/80 rounded-2xl p-6 md:p-8 shadow-2xl shadow-amber-500/20 text-neutral-100 overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-100 bg-neutral-800/80 hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-3xl shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
            🎃
          </div>
          <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HAUNTED DOGECOIN VAULT UNLOCKED!</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-display text-white">
            {vault.title}
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Claimed by <span className="font-semibold text-amber-300">{winner.avatar} {winner.name}</span> with a lightning shot!
          </p>
        </div>

        {/* Bounty Announcement */}
        <div className="bg-neutral-950/70 border border-amber-900/40 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-neutral-400">Vault Target Address</div>
            <div className="font-mono text-sm text-neutral-200 break-all select-all flex items-center gap-2 mt-0.5">
              <span>{vault.address}</span>
              <button
                onClick={handleCopyAddress}
                className="text-neutral-400 hover:text-amber-400 transition-colors p-1"
                title="Copy Address"
              >
                {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-neutral-800 sm:pl-4 shrink-0">
            <div className="text-xs text-neutral-400">Prize Bounty</div>
            <div className="font-mono text-xl font-bold text-amber-400">
              +{vault.bountyDogeWon} DOGE
            </div>
          </div>
        </div>

        {/* Private Key Reveal */}
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Key className="w-4 h-4" />
              <span>DOGECOIN PRIVATE KEY (WIF FORMAT)</span>
            </span>
            <button
              onClick={() => setShowKeyText(!showKeyText)}
              className="text-xs text-neutral-400 hover:text-neutral-200 underline"
            >
              {showKeyText ? 'Mask Key' : 'Reveal Key'}
            </button>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-sm text-amber-300 break-all select-all flex items-center justify-between gap-2">
            <span>
              {showKeyText
                ? vault.privateKeyWif
                : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
            </span>
            <button
              onClick={handleCopyKey}
              className="shrink-0 px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied!' : 'Copy WIF'}</span>
            </button>
          </div>

          <div className="mt-3 text-xs text-neutral-400 flex items-start gap-2">
            <span className="text-amber-400 font-bold">ℹ️ How to cash out:</span>
            <span>
              Save this private key! In Dogecoin Core 1.5.0.0, open the console and type:
              <br />
              <code className="text-amber-300 font-mono text-[11px] bg-neutral-900 px-1 py-0.5 rounded mt-1 inline-block">
                importprivkey &quot;{vault.privateKeyWif}&quot; &quot;{winner.name}&quot; true
              </code>
            </span>
          </div>
        </div>

        {/* QR Code and Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-3">
            {qrUrl && (
              <img
                src={qrUrl}
                alt="Vault Private Key QR"
                className="w-16 h-16 rounded-lg bg-white p-1 shadow-md border border-neutral-700"
              />
            )}
            <div className="text-xs text-neutral-400">
              <div className="font-semibold text-neutral-200">Mobile Wallet QR</div>
              <div>Scan with MyDoge or Dogechain</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Halloween Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-xs transition-colors"
            >
              Keep Playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
