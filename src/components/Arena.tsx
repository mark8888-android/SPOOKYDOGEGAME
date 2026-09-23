import React, { useState, useEffect, useRef } from 'react';
import { Target, Zap, Trophy, Flame, Play, Pause, RotateCcw, Copy, Check, Sparkles, Volume2 } from 'lucide-react';
import { Player, TargetRound, SpecialVaultAddress } from '../types/game';
import { formatDoge } from '../utils/dogeHelper';
import { sounds } from '../utils/audio';

interface ArenaProps {
  players: Player[];
  currentRound: TargetRound | null;
  coreBalance: number;
  vaultAddresses: SpecialVaultAddress[];
  onStartRound: () => void;
  onFireShot: (playerId: number, amountFired: number) => void;
  isAutoMode: boolean;
  setIsAutoMode: (val: boolean) => void;
  recentWinner: { player: Player; amount: number; isVault: boolean; reactionMs: number } | null;
}

interface ShotAnimation {
  playerId: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  progress: number;
}

export const Arena: React.FC<ArenaProps> = ({
  players,
  currentRound,
  coreBalance,
  vaultAddresses,
  onStartRound,
  onFireShot,
  isAutoMode,
  setIsAutoMode,
  recentWinner,
}) => {
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [playerInputs, setPlayerInputs] = useState<Record<number, number>>({
    1: 50,
    2: 50,
    3: 50,
    4: 50,
  });

  const [activeAnimations, setActiveAnimations] = useState<ShotAnimation[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync inputs whenever new round spawns
  useEffect(() => {
    if (currentRound && currentRound.targetAmountDoge) {
      setPlayerInputs({
        1: currentRound.targetAmountDoge,
        2: currentRound.targetAmountDoge,
        3: currentRound.targetAmountDoge,
        4: currentRound.targetAmountDoge,
      });
    }
  }, [currentRound?.targetAmountDoge, currentRound?.roundNumber]);

  // Global keyboard shortcuts for all 4 players
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === '1' || key === 'Q') {
        triggerPlayerFire(1);
      } else if (key === '2' || key === 'C') {
        triggerPlayerFire(2);
      } else if (key === '3' || key === 'I') {
        triggerPlayerFire(3);
      } else if (key === '4' || key === 'P') {
        triggerPlayerFire(4);
      } else if (key === ' ' && currentRound?.status === 'IDLE') {
        e.preventDefault();
        onStartRound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRound, playerInputs]);

  const triggerPlayerFire = (playerId: number) => {
    const p = players.find((x) => x.id === playerId);
    if (!p) return;

    const amount = playerInputs[playerId] || (currentRound?.targetAmountDoge ?? 100);
    sounds.playShoot(playerId - 1);

    // Trigger visual laser animation on canvas
    createShotVisual(playerId);

    onFireShot(playerId, amount);
  };

  const createShotVisual = (playerId: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const p = players.find((x) => x.id === playerId);
    const color = p?.color || '#f59e0b';

    // Corner positions for the 4 players
    const positions = [
      { x: 40, y: rect.height - 40 }, // P1 bottom-left
      { x: rect.width - 40, y: rect.height - 40 }, // P2 bottom-right
      { x: 40, y: 40 }, // P3 top-left
      { x: rect.width - 40, y: 40 }, // P4 top-right
    ];

    const pos = positions[(playerId - 1) % positions.length];

    const newAnim: ShotAnimation = {
      playerId,
      startX: pos.x,
      startY: pos.y,
      targetX: centerX,
      targetY: centerY,
      color,
      progress: 0,
    };

    setActiveAnimations((prev) => [...prev, newAnim]);
  };

  // Canvas render loop for plasma laser shots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle spooky radar lines
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.save();
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.arc(cx, cy, 130, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Render active shots
      setActiveAnimations((prev) => {
        const next: ShotAnimation[] = [];

        for (const shot of prev) {
          const newProgress = shot.progress + 0.12;

          const currentX = shot.startX + (shot.targetX - shot.startX) * newProgress;
          const currentY = shot.startY + (shot.targetY - shot.startY) * newProgress;

          // Draw glowing beam trail
          ctx.save();
          ctx.strokeStyle = shot.color;
          ctx.lineWidth = 4;
          ctx.shadowColor = shot.color;
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.moveTo(shot.startX, shot.startY);
          ctx.lineTo(currentX, currentY);
          ctx.stroke();

          // Draw plasma pumpkin/bolt tip
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (newProgress < 1.0) {
            next.push({ ...shot, progress: newProgress });
          }
        }

        return next;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  const handleCopyTargetAddress = () => {
    if (!currentRound) return;
    navigator.clipboard.writeText(currentRound.targetAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const isVaultTarget = currentRound?.isSpecialVault;
  const vaultDetails = isVaultTarget
    ? vaultAddresses.find((v) => v.id === currentRound?.specialVaultId)
    : null;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner: Arena Status & Host Controls */}
      <div className="bg-neutral-900/80 border border-amber-900/30 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
            🐕
          </div>
          <div>
            <div className="text-xs text-neutral-400">
              Round #{currentRound?.roundNumber || 1} · Dogecoin Core 1.5.0.0
            </div>
            <div className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <span>Core Giveaway Vault:</span>
              <span className="font-mono text-amber-400 font-bold tabular-nums">
                {formatDoge(coreBalance)} DOGE Available
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => sounds.playHowl()}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700"
            title="Eerie Doge Wolf Howl"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Spooky Howl!</span>
          </button>

          <button
            onClick={() => setIsAutoMode(!isAutoMode)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isAutoMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {isAutoMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>Auto-Rounds: {isAutoMode ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onStartRound}
            disabled={currentRound?.status === 'ACTIVE'}
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{currentRound?.status === 'ACTIVE' ? 'Round In Progress...' : 'Spawn Target (Space)'}</span>
          </button>
        </div>
      </div>

      {/* Main Radar Arena Display */}
      <div className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 border border-amber-900/40 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl">
        {/* Background Canvas for laser trajectories */}
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Floating Spooky Background Elements */}
        <div className="absolute top-4 left-6 text-neutral-800 text-4xl select-none opacity-40">🦇</div>
        <div className="absolute top-8 right-12 text-neutral-800 text-3xl select-none opacity-40">🦇</div>
        <div className="absolute bottom-6 left-12 text-neutral-800 text-4xl select-none opacity-40">🎃</div>
        <div className="absolute bottom-6 right-10 text-neutral-800 text-4xl select-none opacity-40">👻</div>

        {/* Central Target Display Board */}
        <div className="relative z-20 flex flex-col items-center text-center max-w-2xl mx-auto py-4">
          {/* Vault Badge if Target is one of the 5 Special Addresses */}
          {isVaultTarget ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{vaultDetails?.title || 'HAUNTED VAULT SPECIAL ADDRESS'}</span>
              <span className="bg-amber-500 text-neutral-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold">
                PRIVATE KEY REWARD
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-3">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              <span>DOGECOIN CORE TARGET</span>
            </div>
          )}

          {/* Current Target Address Box */}
          <div className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-amber-600/50 rounded-2xl p-4 transition-colors mb-4 backdrop-blur-sm shadow-inner">
            <div className="text-[11px] text-neutral-400 mb-1">
              Target Dogecoin Address (Core 1.5.0.0 Compatible)
            </div>
            <div className="font-mono text-sm sm:text-base md:text-lg text-amber-400 font-bold break-all flex items-center justify-center gap-2">
              <span>{currentRound?.targetAddress || 'Waiting for round to begin...'}</span>
              {currentRound && (
                <button
                  onClick={handleCopyTargetAddress}
                  className="p-1.5 text-neutral-400 hover:text-amber-400 bg-neutral-900 rounded-lg transition-colors shrink-0"
                  title="Copy Target Address"
                >
                  {copiedAddr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Big Target Amount Dial */}
          <div className="flex flex-col items-center my-2">
            <div className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-1">
              REQUIRED SHOOTOUT AMOUNT (50 - 1000 DOGE)
            </div>
            <div className="text-5xl md:text-6xl font-black font-mono text-white tracking-tight flex items-baseline gap-2 tabular-nums">
              <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                {currentRound ? formatDoge(currentRound.targetAmountDoge) : '---'}
              </span>
              <span className="text-xl md:text-2xl font-bold text-neutral-400">DOGE</span>
            </div>
          </div>

          {/* Round Status or Recent Winner Ticker */}
          {recentWinner && (
            <div className="mt-4 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-neutral-200 flex items-center gap-2 animate-in fade-in">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Last Round Won By <strong className="text-amber-300">{recentWinner.player.avatar} {recentWinner.player.name}</strong>!
                {' '}(Reaction: <span className="font-mono text-amber-400 font-semibold">{recentWinner.reactionMs}ms</span> · +{recentWinner.amount} DOGE)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Players Shootout Cockpit Stations */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold font-display text-neutral-200 flex items-center gap-2">
            <span>🎯 4-Player Hotseat & Cannon Stations</span>
          </h2>
          <span className="text-xs text-neutral-400">
            Press Key on Keyboard or Tap Station to Fire
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {players.map((p) => {
            const currentInput = playerInputs[p.id] ?? currentRound?.targetAmountDoge ?? 100;
            const isTargetMatched = currentRound && currentInput === currentRound.targetAmountDoge;

            return (
              <div
                key={p.id}
                className="relative bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-lg overflow-hidden group"
                style={{ borderTop: `4px solid ${p.color}` }}
              >
                {/* Station Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.avatar}</span>
                      <div>
                        <div className="text-xs font-bold text-neutral-100">{p.name}</div>
                        <div className="text-[10px] text-neutral-400">
                          {p.roundsWon} wins · {p.shotsFired} shots
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[11px] font-mono font-bold text-amber-400">
                        [{p.keybind}] / [{p.keybindAlt}]
                      </span>
                    </div>
                  </div>

                  {/* Player Balance */}
                  <div className="bg-neutral-950/80 rounded-xl p-2.5 mb-3 border border-neutral-800/80">
                    <div className="text-[10px] text-neutral-400">Wallet Balance</div>
                    <div className="font-mono text-base font-bold text-white tabular-nums flex items-baseline gap-1">
                      <span className="text-amber-400">{formatDoge(p.balanceDoge)}</span>
                      <span className="text-xs text-neutral-400 font-normal">DOGE</span>
                    </div>
                  </div>

                  {/* Amount Setter */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Doge Ammo:</span>
                      <button
                        onClick={() => {
                          if (currentRound) {
                            setPlayerInputs((prev) => ({
                              ...prev,
                              [p.id]: currentRound.targetAmountDoge,
                            }));
                          }
                        }}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                          isTargetMatched
                            ? 'text-emerald-400 bg-emerald-950/40'
                            : 'text-amber-400 hover:text-amber-300 underline'
                        }`}
                      >
                        {isTargetMatched ? '✓ Matched Target' : 'Match Target'}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="50"
                        max="1000"
                        step="10"
                        value={currentInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPlayerInputs((prev) => ({ ...prev, [p.id]: val }));
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm font-mono text-white text-center focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                        DOGE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Fire Trigger */}
                <button
                  onClick={() => triggerPlayerFire(p.id)}
                  disabled={currentRound?.status !== 'ACTIVE'}
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: p.color,
                    boxShadow: `0 4px 14px ${p.color}40`,
                  }}
                >
                  <Flame className="w-4 h-4 fill-white" />
                  <span>FIRE CANNON [{p.keybind}]</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
