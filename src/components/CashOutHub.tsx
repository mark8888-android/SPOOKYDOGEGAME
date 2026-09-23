import React, { useState } from 'react';
import { Globe, Send, CheckCircle2, Copy, Check, ExternalLink, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Player, SpecialVaultAddress, CoreNodeConfig } from '../types/game';
import { formatDoge, generateCoreSendManyCli } from '../utils/dogeHelper';
import { sounds } from '../utils/audio';

interface CashOutHubProps {
  players: Player[];
  vaults: SpecialVaultAddress[];
  config: CoreNodeConfig;
  onPayoutSuccess: (playerId: number, txid: string) => void;
}

export const CashOutHub: React.FC<CashOutHubProps> = ({
  players,
  vaults,
  config,
  onPayoutSuccess,
}) => {
  const [copiedCli, setCopiedCli] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState<Array<{ playerId: number; name: string; amount: number; txid?: string; success: boolean; error?: string }>>([]);

  // Generate batch payout object
  const payoutMap: Record<string, number> = {};
  players.forEach((p) => {
    if (p.balanceDoge > 0) {
      payoutMap[p.address] = p.balanceDoge;
    }
  });

  const sendManyCliCommand = generateCoreSendManyCli(payoutMap);
  const totalPayoutDue = Object.values(payoutMap).reduce((acc, curr) => acc + curr, 0);

  const handleCopyCli = () => {
    navigator.clipboard.writeText(sendManyCliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleBroadcastOnline = async () => {
    if (totalPayoutDue === 0) return;
    setBroadcasting(true);
    setBroadcastResults([]);
    sounds.playCoinChime();

    const results = [];

    for (const player of players) {
      if (player.balanceDoge <= 0) continue;

      try {
        const res = await fetch('/api/doge-rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: config.host,
            port: config.port,
            rpcuser: config.rpcuser,
            rpcpassword: config.rpcpassword,
            method: 'sendtoaddress',
            params: [player.address, player.balanceDoge],
            forceMock: !config.useLiveCore,
          }),
        });

        const data = await res.json();
        if (data.result) {
          const txid = String(data.result);
          results.push({
            playerId: player.id,
            name: player.name,
            amount: player.balanceDoge,
            txid,
            success: true,
          });
          onPayoutSuccess(player.id, txid);
        } else {
          results.push({
            playerId: player.id,
            name: player.name,
            amount: player.balanceDoge,
            success: false,
            error: data.error?.message || 'Payout failed',
          });
        }
      } catch (err: unknown) {
        results.push({
          playerId: player.id,
          name: player.name,
          amount: player.balanceDoge,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    setBroadcastResults(results);
    setBroadcasting(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-amber-900/30 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <Globe className="w-4 h-4" />
              <span>ONLINE CASH-OUT & BATCH PAYOUT DISPATCHER</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-white">
              Cash Out Intranet Winnings to Live Dogecoin Network
            </h2>
            <p className="text-sm text-neutral-400 mt-2 max-w-3xl leading-relaxed">
              When you bring this intranet computer or website online, you can fire off the accumulated Doge payouts directly to the players&apos; wallets! You can either trigger the payouts through the Dogecoin Core 1.5.0.0 JSON-RPC or copy the single-line batch command directly into your terminal.
            </p>
          </div>
          <div className="text-3xl hidden sm:block">🌐</div>
        </div>
      </div>

      {/* Summary of Payouts Due */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-100">Party Winnings Ledger</h3>
            <p className="text-xs text-neutral-400">Total accumulated Dogecoin ready for distribution</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-400 uppercase font-semibold">Total Payouts Due</div>
            <div className="font-mono text-2xl font-black text-amber-400 tabular-nums">
              {formatDoge(totalPayoutDue)} DOGE
            </div>
          </div>
        </div>

        {/* Players Breakdown */}
        <div className="space-y-3">
          {players.map((p) => (
            <div
              key={p.id}
              className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{p.avatar}</span>
                <div>
                  <div className="font-bold text-neutral-200">{p.name}</div>
                  <div className="font-mono text-neutral-500 text-[11px] truncate max-w-xs sm:max-w-md">
                    {p.address}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:text-right">
                <div className="font-mono text-sm font-bold text-amber-300 tabular-nums">
                  {formatDoge(p.balanceDoge)} DOGE
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Broadcast Action Buttons */}
        <div className="mt-5 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Node Core 1.5.0.0 will sign & broadcast standard transactions</span>
          </div>

          <button
            onClick={handleBroadcastOnline}
            disabled={broadcasting || totalPayoutDue === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{broadcasting ? 'Broadcasting Batch Payouts...' : 'Fire Off Online Payouts'}</span>
          </button>
        </div>

        {/* Broadcast Results */}
        {broadcastResults.length > 0 && (
          <div className="mt-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
            <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Broadcast Receipts
            </h4>
            {broadcastResults.map((res) => (
              <div
                key={res.playerId}
                className="text-xs flex flex-wrap items-center justify-between gap-2 p-2 bg-neutral-900 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {res.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="font-semibold text-neutral-200">{res.name}</span>
                  <span className="text-amber-400 font-mono">+{res.amount} DOGE</span>
                </div>
                {res.txid && (
                  <div className="font-mono text-[11px] text-neutral-400 truncate max-w-xs">
                    TXID: {res.txid}
                  </div>
                )}
                {res.error && <div className="text-red-400 text-[11px]">{res.error}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CLI Batch Command for Host Terminal */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            Dogecoin Core 1.5.0.0 CLI Command (<code className="text-amber-300">sendmany</code>)
          </div>
          <button
            onClick={handleCopyCli}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700"
          >
            {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCli ? 'Copied CLI!' : 'Copy Command'}</span>
          </button>
        </div>

        <div className="bg-neutral-950 p-3 rounded-xl font-mono text-xs text-amber-300 select-all border border-neutral-800 overflow-x-auto">
          <code>{sendManyCliCommand}</code>
        </div>
        <p className="text-[11px] text-neutral-400">
          Run this in your Dogecoin Core terminal or bash shell when your intranet node connects to the network to instantly payout all 4 players in a single atomic transaction.
        </p>
      </div>

      {/* Instructions for Special Vault Private Keys */}
      <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>How Players Can Cash Out Their 5 Special Vault Private Keys</span>
        </div>
        <div className="space-y-2 text-xs text-neutral-300">
          <p>
            Players who won any of the 5 Special Vaults hold the exclusive <strong>WIF Private Key</strong>. They can cash out in any of the following ways:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-2">
            <li>
              <strong>Dogecoin Core 1.5.0.0:</strong> Open Help → Debug window → Console, then run <code className="text-amber-300 font-mono">importprivkey &quot;&lt;WIF_KEY&gt;&quot; &quot;Halloween Winner&quot; true</code>.
            </li>
            <li>
              <strong>Mobile / Web Wallets (MyDoge, Dogechain):</strong> Tap &quot;Import / Sweep Wallet&quot;, scan the QR code from their printed Halloween voucher or paste the WIF key.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
