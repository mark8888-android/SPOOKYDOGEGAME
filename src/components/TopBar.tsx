import React from 'react';
import { Volume2, VolumeX, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TopBarProps {
  activeTab: 'arena' | 'wallets' | 'vaults' | 'rpc' | 'cashout';
  setActiveTab: (tab: 'arena' | 'wallets' | 'vaults' | 'rpc' | 'cashout') => void;
  coreBalance: number;
  isLiveRpc: boolean;
  unlockedVaultsCount: number;
  totalVaultsCount: number;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  coreBalance,
  isLiveRpc,
  unlockedVaultsCount,
  totalVaultsCount,
  isMuted,
  setIsMuted,
}) => {
  const toggleMute = () => {
    const nextMuted = !isMuted;
    sounds.isMuted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sounds.playCoinChime();
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-neutral-950/90 backdrop-blur-md border-b border-amber-900/30">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold tracking-tight text-amber-500 font-display flex items-center gap-2">
          <span>🎃</span>
          <span>Spooky Doge Core 1.5</span>
        </span>
      </div>

      {/* Zone 2: Navigation Links / Tabs */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl">
        <button
          onClick={() => setActiveTab('arena')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'arena'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Shootout Arena
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'wallets'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          4-Player Wallets
        </button>
        <button
          onClick={() => setActiveTab('vaults')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'vaults'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>5 Vault Keys</span>
          <span className="text-[10px] bg-neutral-800 text-amber-400 px-1.5 py-0.5 rounded-full border border-neutral-700">
            {unlockedVaultsCount}/{totalVaultsCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('rpc')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'rpc'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>Core 1.5.0 RPC</span>
          <span className={`w-2 h-2 rounded-full ${isLiveRpc ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
        </button>
        <button
          onClick={() => setActiveTab('cashout')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'cashout'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Online Cash-Out
        </button>
      </nav>

      {/* Zone 3: Primary Actions & Telemetry indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
          {isLiveRpc ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-neutral-400">Core Stash:</span>
          <span className="font-mono font-bold text-amber-400 tabular-nums">
            {coreBalance.toLocaleString()} DOGE
          </span>
        </div>

        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute Halloween SFX' : 'Mute Sound'}
          className="p-2 text-neutral-400 hover:text-neutral-100 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
      </div>
    </header>
  );
};
