import React, { useState } from 'react';
import { Terminal, Server, RefreshCw, CheckCircle2, AlertCircle, Wifi, Shield, ArrowRight } from 'lucide-react';
import { CoreNodeConfig } from '../types/game';
import { formatDoge } from '../utils/dogeHelper';

interface CoreRpcPanelProps {
  config: CoreNodeConfig;
  setConfig: React.Dispatch<React.SetStateAction<CoreNodeConfig>>;
  onSyncNode: () => Promise<void>;
}

export const CoreRpcPanel: React.FC<CoreRpcPanelProps> = ({ config, setConfig, onSyncNode }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; raw?: unknown } | null>(null);
  const [selectedCommand, setSelectedCommand] = useState('getinfo');
  const [commandParam1, setCommandParam1] = useState('');
  const [commandParam2, setCommandParam2] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string>('Ready to query Dogecoin Core 1.5.0.0 node.');

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/doge-rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          rpcuser: config.rpcuser,
          rpcpassword: config.rpcpassword,
          method: 'getinfo',
          params: [],
          forceMock: !config.useLiveCore,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setTestResult({
          success: true,
          message: data.liveCore
            ? 'Connected to LIVE Dogecoin Core 1.5.0.0 daemon over intranet!'
            : 'Active on Dogecoin Core 1.5.0.0 Intranet Simulator (9,000 DOGE Mined Stash)',
          raw: data.result,
        });
        setConfig((prev) => ({
          ...prev,
          connected: true,
          currentBalance: data.result.balance ?? prev.currentBalance,
          blocks: data.result.blocks ?? prev.blocks,
          lastSyncTime: Date.now(),
        }));
      } else {
        setTestResult({
          success: false,
          message: data.error?.message || 'RPC Call returned an error',
          raw: data.error,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to reach node bridge',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExecuteCommand = async () => {
    setTerminalOutput(`> Executing ${selectedCommand}...`);
    try {
      const params: unknown[] = [];
      if (commandParam1) params.push(commandParam1);
      if (commandParam2) {
        const num = Number(commandParam2);
        params.push(isNaN(num) ? commandParam2 : num);
      }

      const res = await fetch('/api/doge-rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          rpcuser: config.rpcuser,
          rpcpassword: config.rpcpassword,
          method: selectedCommand,
          params,
          forceMock: !config.useLiveCore,
        }),
      });

      const data = await res.json();
      setTerminalOutput(JSON.stringify(data, null, 2));

      if (selectedCommand === 'getbalance' && typeof data.result === 'number') {
        setConfig((prev) => ({ ...prev, currentBalance: data.result }));
      }
    } catch (err: unknown) {
      setTerminalOutput(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-amber-900/40 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <Server className="w-4 h-4" />
              <span>DOGECOIN CORE 1.5.0.0 INTRANET RPC DAEMON</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-white">
              Core Node Interface & 9,000 DOGE Mined Stash
            </h2>
            <p className="text-sm text-neutral-400 mt-2 max-w-3xl leading-relaxed">
              Connect your intranet Dogecoin Core 1.5.0.0 client (default port <code className="text-amber-300 font-mono">22555</code>). You can also run in 100% Offline Simulator mode, where the built-in daemon preserves the exact 9,000 DOGE balance, generates Dogecoin addresses, and simulates Core block confirmations!
            </p>
          </div>
          <div className="text-3xl hidden sm:block">⚡</div>
        </div>
      </div>

      {/* Grid: Config Form & Live Node Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Configuration Form (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>RPC Node Credentials</span>
          </h3>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase">Core Host / IP</label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig((prev) => ({ ...prev, host: e.target.value }))}
              placeholder="127.0.0.1 or 192.168.1.x"
              className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase">RPC Port</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig((prev) => ({ ...prev, port: Number(e.target.value) }))}
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase">RPC User</label>
              <input
                type="text"
                value={config.rpcuser}
                onChange={(e) => setConfig((prev) => ({ ...prev, rpcuser: e.target.value }))}
                placeholder="dogerpc"
                className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase">RPC Password</label>
            <input
              type="password"
              value={config.rpcpassword}
              onChange={(e) => setConfig((prev) => ({ ...prev, rpcpassword: e.target.value }))}
              placeholder="••••••••••••"
              className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-neutral-200">Mode Selection</div>
              <div className="text-[10px] text-neutral-400">
                {config.useLiveCore ? 'Connecting to live daemon' : 'Running Offline Simulator'}
              </div>
            </div>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, useLiveCore: !prev.useLiveCore }))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                config.useLiveCore
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
              }`}
            >
              {config.useLiveCore ? 'Live Core RPC' : 'Intranet Simulator'}
            </button>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing RPC Connection...' : 'Test Core Connection'}</span>
          </button>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/30 border-red-500/40 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">{testResult.message}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Core Status & CLI Terminal (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Node Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Total Stash</div>
              <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">
                {formatDoge(config.currentBalance)} DOGE
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Initial 9,000 Mined</div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Core Version</div>
              <div className="font-mono text-lg font-bold text-white tabular-nums">
                1.5.0.0
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Protocol 70002</div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Block Height</div>
              <div className="font-mono text-lg font-bold text-white tabular-nums">
                #{config.blocks.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Intranet Synchronized</div>
            </div>
          </div>

          {/* Interactive Core 1.5.0.0 Terminal Tester */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>JSON-RPC Terminal Tester</span>
              </div>
            </div>

            {/* Command selector & inputs */}
            <div className="space-y-2 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={selectedCommand}
                  onChange={(e) => setSelectedCommand(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="getinfo">getinfo</option>
                  <option value="getbalance">getbalance</option>
                  <option value="getnewaddress">getnewaddress</option>
                  <option value="listtransactions">listtransactions</option>
                  <option value="validateaddress">validateaddress</option>
                  <option value="sendtoaddress">sendtoaddress</option>
                  <option value="resetmockcore">resetmockcore (9000)</option>
                </select>

                {selectedCommand === 'validateaddress' || selectedCommand === 'sendtoaddress' ? (
                  <input
                    type="text"
                    placeholder="Address (D...)"
                    value={commandParam1}
                    onChange={(e) => setCommandParam1(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                ) : null}

                {selectedCommand === 'sendtoaddress' ? (
                  <input
                    type="number"
                    placeholder="Amount DOGE"
                    value={commandParam2}
                    onChange={(e) => setCommandParam2(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                ) : null}

                <button
                  onClick={handleExecuteCommand}
                  className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-neutral-700"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Execute</span>
                </button>
              </div>
            </div>

            {/* Terminal Console Output */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-xs text-neutral-300 max-h-48 overflow-y-auto select-all">
              <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Intranet Setup Guide */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 text-xs text-neutral-400 space-y-2">
        <h4 className="font-bold text-neutral-200">How to run Dogecoin Core 1.5.0.0 on your Intranet Machine:</h4>
        <p>
          1. Edit your <code className="text-amber-300">dogecoin.conf</code> file in your Dogecoin data directory:
        </p>
        <div className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[11px] text-neutral-300 select-all border border-neutral-800">
          server=1<br />
          rpcuser=dogerpc<br />
          rpcpassword=yourSecretPassword123<br />
          rpcport=22555<br />
          rpcallowip=127.0.0.1<br />
          rpcallowip=192.168.*.*
        </div>
        <p>
          2. Launch the node: <code className="text-amber-300 font-mono">dogecoind -daemon</code> or open Dogecoin-Qt.
        </p>
      </div>
    </div>
  );
};
