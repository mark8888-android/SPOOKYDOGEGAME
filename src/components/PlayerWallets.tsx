import React, { useState } from 'react';
import { Wallet, Copy, Check, Printer, QrCode, Download, Eye, EyeOff, Trophy, Sparkles } from 'lucide-react';
import { Player, SpecialVaultAddress } from '../types/game';
import { formatDoge, generateQrDataUrl, printPaperWallet } from '../utils/dogeHelper';

interface PlayerWalletsProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  vaults: SpecialVaultAddress[];
}

export const PlayerWallets: React.FC<PlayerWalletsProps> = ({ players, setPlayers, vaults }) => {
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [copiedAddrId, setCopiedAddrId] = useState<number | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<number, boolean>>({});
  const [selectedQrPlayer, setSelectedQrPlayer] = useState<Player | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string>('');

  const handleCopyKey = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopyAddress = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddrId(id);
    setTimeout(() => setCopiedAddrId(null), 2000);
  };

  const toggleRevealKey = (id: number) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openQrModal = async (player: Player) => {
    setSelectedQrPlayer(player);
    const url = await generateQrDataUrl(player.address);
    setQrModalUrl(url);
  };

  const exportPartyCsv = () => {
    const headers = ['Player ID', 'Name', 'Avatar', 'Dogecoin Address', 'Private Key (WIF)', 'Balance (DOGE)', 'Rounds Won', 'Shots Fired'];
    const rows = players.map((p) => [
      p.id,
      `"${p.name}"`,
      p.avatar,
      `"${p.address}"`,
      `"${p.privateKeyWif}"`,
      p.balanceDoge,
      p.roundsWon,
      p.shotsFired,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `doge-core-1.5-halloween-party-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-amber-900/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Wallet className="w-4 h-4" />
            <span>FAIR 4-PLAYER WALLETS</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white">
            Party Contestant Dogecoin Wallets
          </h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Each player maintains their own address and private key. Winnings from the Dogecoin Core 1.5.0.0 daemon and opponent pots are stored here and ready to cash out!
          </p>
        </div>

        <button
          onClick={exportPartyCsv}
          className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Party CSV</span>
        </button>
      </div>

      {/* 4 Player Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {players.map((p) => {
          const isRevealed = revealedKeys[p.id] || false;
          const playerVaults = vaults.filter((v) => v.wonByPlayerId === p.id);

          return (
            <div
              key={p.id}
              className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all"
              style={{ borderLeft: `5px solid ${p.color}` }}
            >
              <div>
                {/* Player Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{p.avatar}</span>
                    <div>
                      <h3 className="text-base font-bold text-neutral-100">{p.name}</h3>
                      <div className="text-xs text-neutral-400">
                        Player #{p.id} · Key: [{p.keybind}] / [{p.keybindAlt}]
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-neutral-400">Current Balance</div>
                    <div className="font-mono text-xl font-black text-amber-400 tabular-nums">
                      {formatDoge(p.balanceDoge)}{' '}
                      <span className="text-xs text-neutral-400 font-normal">DOGE</span>
                    </div>
                  </div>
                </div>

                {/* Vault Bounties won */}
                {playerVaults.length > 0 && (
                  <div className="mb-3 p-2.5 bg-amber-950/30 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Unlocked <strong>{playerVaults.length} Special Vault(s)</strong>!
                    </span>
                  </div>
                )}

                {/* Address Box */}
                <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 mb-2.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                    <span>Dogecoin Address</span>
                    <button
                      onClick={() => openQrModal(p)}
                      className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>QR Code</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-neutral-300 break-all select-all flex items-center justify-between gap-2">
                    <span>{p.address}</span>
                    <button
                      onClick={() => handleCopyAddress(p.id, p.address)}
                      className="text-neutral-400 hover:text-amber-400 transition-colors p-1 shrink-0"
                      title="Copy Address"
                    >
                      {copiedAddrId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Private Key WIF Box */}
                <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                    <span>WIF Private Key (Keep Secret)</span>
                    <button
                      onClick={() => toggleRevealKey(p.id)}
                      className="text-neutral-400 hover:text-amber-400 underline flex items-center gap-1"
                    >
                      {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-amber-400" />}
                      <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-neutral-300 break-all select-all flex items-center justify-between gap-2">
                    <span className={isRevealed ? 'text-amber-300' : 'text-neutral-600'}>
                      {isRevealed ? p.privateKeyWif : '••••••••••••••••••••••••••••••••••••••••'}
                    </span>
                    <button
                      onClick={() => handleCopyKey(p.id, p.privateKeyWif)}
                      className="text-neutral-400 hover:text-amber-400 transition-colors p-1 shrink-0"
                      title="Copy Private Key"
                    >
                      {copiedKeyId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{p.roundsWon} Rounds Won</span>
                </div>

                <button
                  onClick={() => printPaperWallet(p, playerVaults[0] || null)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Ticket</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
      {selectedQrPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-amber-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              {selectedQrPlayer.avatar} {selectedQrPlayer.name}&apos;s Wallet
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Scan with MyDoge or Dogechain to send or inspect
            </p>

            {qrModalUrl && (
              <img
                src={qrModalUrl}
                alt="Wallet Address QR"
                className="w-52 h-52 mx-auto rounded-xl bg-white p-2 border border-neutral-700 mb-4"
              />
            )}

            <div className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[11px] text-amber-400 break-all select-all mb-4 border border-neutral-800">
              {selectedQrPlayer.address}
            </div>

            <button
              onClick={() => setSelectedQrPlayer(null)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
