import React, { useState } from 'react';
import { Key, Lock, Unlock, Copy, Check, Printer, QrCode, Sparkles, Edit3, ShieldAlert } from 'lucide-react';
import { Player, SpecialVaultAddress } from '../types/game';
import { printPaperWallet } from '../utils/dogeHelper';

interface VaultManagerProps {
  vaults: SpecialVaultAddress[];
  setVaults: React.Dispatch<React.SetStateAction<SpecialVaultAddress[]>>;
  players: Player[];
  onOpenVaultModal: (vault: SpecialVaultAddress) => void;
}

export const VaultManager: React.FC<VaultManagerProps> = ({
  vaults,
  setVaults,
  players,
  onOpenVaultModal,
}) => {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedAddrId, setCopiedAddrId] = useState<string | null>(null);
  const [editingVaultId, setEditingVaultId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [editPrivKey, setEditPrivKey] = useState('');
  const [revealKeyIds, setRevealKeyIds] = useState<Record<string, boolean>>({});

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopyAddress = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddrId(id);
    setTimeout(() => setCopiedAddrId(null), 2000);
  };

  const toggleRevealKey = (id: string) => {
    setRevealKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (vault: SpecialVaultAddress) => {
    setEditingVaultId(vault.id);
    setEditAddress(vault.address);
    setEditPrivKey(vault.privateKeyWif);
  };

  const saveEdit = (id: string) => {
    setVaults((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              address: editAddress.trim(),
              privateKeyWif: editPrivKey.trim(),
              isCustom: true,
            }
          : v
      )
    );
    setEditingVaultId(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header Info Banner */}
      <div className="bg-neutral-900 border border-amber-900/40 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>THE 5 HAUNTED DOGECOIN VAULT ADDRESSES</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-white">
              Special Address Pool & Private Key Rewards
            </h2>
            <p className="text-sm text-neutral-400 mt-2 max-w-3xl leading-relaxed">
              These 5 pre-configured Dogecoin addresses are randomly selected during rounds so you don&apos;t overload your Dogecoin Core 1.5.0.0 daemon. Whomever shoots and wins a round with one of these targets is awarded the <strong className="text-amber-300">WIF Private Key</strong> to cash out both offline and when your intranet is brought online!
            </p>
          </div>
          <div className="text-3xl hidden sm:block">🗝️</div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Core 1.5.0.0 Compatible WIF Format</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Ready for <code>importprivkey</code> Console Command</span>
          </div>
        </div>
      </div>

      {/* Vault Cards */}
      <div className="space-y-4">
        {vaults.map((vault, index) => {
          const isWon = vault.wonByPlayerId !== null;
          const winner = isWon ? players.find((p) => p.id === vault.wonByPlayerId) : null;
          const isEditing = editingVaultId === vault.id;
          const isRevealed = revealKeyIds[vault.id] || false;

          return (
            <div
              key={vault.id}
              className={`bg-neutral-900/90 border rounded-2xl p-5 transition-all ${
                isWon
                  ? 'border-amber-500/70 shadow-lg shadow-amber-500/10'
                  : 'border-neutral-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Title & Status */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      isWon
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-neutral-800 border border-neutral-700 text-neutral-400'
                    }`}
                  >
                    {isWon ? <Unlock className="w-6 h-6 text-amber-400" /> : <Lock className="w-6 h-6 text-neutral-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-500">#{index + 1}</span>
                      <h3 className="text-base font-bold text-neutral-100">{vault.title}</h3>
                      {vault.isCustom && (
                        <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700">
                          Custom
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-neutral-400 mt-0.5">
                      {isWon ? (
                        <span className="text-amber-300 font-semibold flex items-center gap-1">
                          <span>Won by {winner?.avatar} {winner?.name}</span>
                          <span>· Round #{vault.wonAtRound} (+{vault.bountyDogeWon} DOGE)</span>
                        </span>
                      ) : (
                        <span className="text-neutral-500">Unclaimed · Up for grabs in Shootout</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isWon && (
                    <>
                      <button
                        onClick={() => onOpenVaultModal(vault)}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>View Award</span>
                      </button>

                      {winner && (
                        <button
                          onClick={() => printPaperWallet(winner, vault)}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                          title="Print Halloween Paper Voucher"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Print Voucher</span>
                        </button>
                      )}
                    </>
                  )}

                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(vault)}
                      className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                      title="Edit Address / Private Key"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Edit Mode */}
              {isEditing ? (
                <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3 bg-neutral-950/60 p-4 rounded-xl">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase">Dogecoin Address</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 uppercase">WIF Private Key</label>
                    <input
                      type="text"
                      value={editPrivKey}
                      onChange={(e) => setEditPrivKey(e.target.value)}
                      className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingVaultId(null)}
                      className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(vault.id)}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              ) : (
                /* Address and Private Key Box */
                <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Address */}
                  <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800">
                    <div className="text-[10px] text-neutral-400 uppercase font-semibold mb-1">Target Address</div>
                    <div className="font-mono text-amber-300 break-all select-all flex items-center justify-between gap-2">
                      <span>{vault.address}</span>
                      <button
                        onClick={() => handleCopyAddress(vault.id, vault.address)}
                        className="text-neutral-400 hover:text-amber-400 transition-colors shrink-0 p-1"
                        title="Copy Address"
                      >
                        {copiedAddrId === vault.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Private Key WIF */}
                  <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                      <span>Private Key (WIF)</span>
                      <button
                        onClick={() => toggleRevealKey(vault.id)}
                        className="text-[10px] text-neutral-400 hover:text-amber-400 underline"
                      >
                        {isRevealed ? 'Mask' : 'Reveal'}
                      </button>
                    </div>
                    <div className="font-mono text-neutral-200 break-all select-all flex items-center justify-between gap-2">
                      <span className={isRevealed ? 'text-amber-400' : 'text-neutral-600'}>
                        {isRevealed
                          ? vault.privateKeyWif
                          : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => handleCopyKey(vault.id, vault.privateKeyWif)}
                        className="text-neutral-400 hover:text-amber-400 transition-colors shrink-0 p-1"
                        title="Copy Private Key"
                      >
                        {copiedKeyId === vault.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
