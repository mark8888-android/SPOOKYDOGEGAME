import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { Arena } from './components/Arena';
import { VaultManager } from './components/VaultManager';
import { PlayerWallets } from './components/PlayerWallets';
import { CoreRpcPanel } from './components/CoreRpcPanel';
import { CashOutHub } from './components/CashOutHub';
import { VaultUnlockModal } from './components/VaultUnlockModal';
import { Player, SpecialVaultAddress, TargetRound, CoreNodeConfig, GameTransaction } from './types/game';
import { INITIAL_PLAYERS, INITIAL_VAULT_ADDRESSES, generateRandomDogeAddress } from './utils/dogeHelper';
import { sounds } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<'arena' | 'wallets' | 'vaults' | 'rpc' | 'cashout'>('arena');
  const [isMuted, setIsMuted] = useState(false);

  // Core Node 1.5.0.0 Configuration
  const [coreConfig, setCoreConfig] = useState<CoreNodeConfig>({
    host: '127.0.0.1',
    port: 22555,
    rpcuser: 'dogerpc',
    rpcpassword: 'partyPassword1500',
    useLiveCore: false, // Default to intranet simulator with 9,000 DOGE, toggleable to live
    totalMinedStash: 9000,
    currentBalance: 9000,
    connected: true,
    version: '1.5.0.0',
    blocks: 154238,
    lastSyncTime: Date.now(),
  });

  // 4 Fair Party Players
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);

  // 5 Special Vault Addresses
  const [vaultAddresses, setVaultAddresses] = useState<SpecialVaultAddress[]>(INITIAL_VAULT_ADDRESSES);

  // Active Shootout Round
  const [currentRound, setCurrentRound] = useState<TargetRound | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [recentWinner, setRecentWinner] = useState<{
    player: Player;
    amount: number;
    isVault: boolean;
    reactionMs: number;
  } | null>(null);

  // Modal for Vault Unlock
  const [unlockedVaultModal, setUnlockedVaultModal] = useState<SpecialVaultAddress | null>(null);
  const [modalWinnerPlayer, setModalWinnerPlayer] = useState<Player | null>(null);

  // Transaction Ledger
  const [transactions, setTransactions] = useState<GameTransaction[]>([]);

  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoRoundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial RPC Sync to check Core daemon balance
  const syncNodeStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/doge-rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: coreConfig.host,
          port: coreConfig.port,
          rpcuser: coreConfig.rpcuser,
          rpcpassword: coreConfig.rpcpassword,
          method: 'getinfo',
          params: [],
          forceMock: !coreConfig.useLiveCore,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setCoreConfig((prev) => ({
          ...prev,
          connected: true,
          currentBalance: typeof data.result.balance === 'number' ? data.result.balance : prev.currentBalance,
          blocks: data.result.blocks || prev.blocks,
          lastSyncTime: Date.now(),
        }));
      }
    } catch {
      // Intranet offline fallback
    }
  }, [coreConfig.host, coreConfig.port, coreConfig.rpcuser, coreConfig.rpcpassword, coreConfig.useLiveCore]);

  useEffect(() => {
    syncNodeStatus();
  }, [syncNodeStatus]);

  // Start / Spawn a New Target Round
  const startNewRound = useCallback(async () => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    if (autoRoundTimerRef.current) clearTimeout(autoRoundTimerRef.current);

    sounds.playBeep(false);

    // Random amount from 50 to 1000 DOGE (rounded to nearest 10 DOGE)
    const randomAmount = Math.floor(Math.random() * (1000 - 50 + 1) / 10) * 10 + 50;

    // Check if we should pick from the 5 Special Vault Addresses
    // 40% chance, or if all other addresses are worked, so we don't always burden the Core
    const useSpecialVault = Math.random() < 0.45;
    let targetAddr = '';
    let selectedVaultId: string | null = null;

    if (useSpecialVault) {
      // Pick a random vault address from the 5
      const randomVault = vaultAddresses[Math.floor(Math.random() * vaultAddresses.length)];
      targetAddr = randomVault.address;
      selectedVaultId = randomVault.id;
    } else {
      // Request new address from Dogecoin Core 1.5.0.0 or generate compliant address
      try {
        const res = await fetch('/api/doge-rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: coreConfig.host,
            port: coreConfig.port,
            rpcuser: coreConfig.rpcuser,
            rpcpassword: coreConfig.rpcpassword,
            method: 'getnewaddress',
            params: [],
            forceMock: !coreConfig.useLiveCore,
          }),
        });
        const data = await res.json();
        targetAddr = typeof data.result === 'string' ? data.result : generateRandomDogeAddress();
      } catch {
        targetAddr = generateRandomDogeAddress();
      }
    }

    const roundNum = (currentRound?.roundNumber || 0) + 1;
    const now = Date.now();

    const newRound: TargetRound = {
      roundNumber: roundNum,
      targetAddress: targetAddr,
      isSpecialVault: useSpecialVault,
      specialVaultId: selectedVaultId,
      targetAmountDoge: randomAmount,
      status: 'ACTIVE',
      startedAt: now,
      expiresAt: now + 30000,
      winnerPlayerId: null,
      winningTimeMs: null,
      txid: null,
    };

    setCurrentRound(newRound);
  }, [currentRound?.roundNumber, coreConfig, vaultAddresses]);

  // Handle Player Firing at the Target
  const handleFireShot = useCallback(
    (playerId: number, amountFired: number) => {
      if (!currentRound || currentRound.status !== 'ACTIVE') {
        return;
      }

      // Check if amount matches the required number
      const isAccurate = amountFired === currentRound.targetAmountDoge;

      const reactionMs = currentRound.startedAt ? Date.now() - currentRound.startedAt : 250;

      // Update player shot stats
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? {
                ...p,
                shotsFired: p.shotsFired + 1,
                lastReactionMs: reactionMs,
              }
            : p
        )
      );

      if (!isAccurate) {
        // Player shot incorrect amount: buzz sound
        sounds.playBeep(true);
        return;
      }

      // WINNER REGISTERED!
      sounds.playHit();

      const winningPlayer = players.find((p) => p.id === playerId);
      if (!winningPlayer) return;

      const wonBounty = currentRound.targetAmountDoge;
      const txid = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      // Mark round finished
      setCurrentRound((prev) =>
        prev
          ? {
              ...prev,
              status: 'HIT',
              winnerPlayerId: playerId,
              winningTimeMs: reactionMs,
              txid,
            }
          : null
      );

      // Award Doge to player wallet & decrement Core stash
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? {
                ...p,
                balanceDoge: p.balanceDoge + wonBounty,
                roundsWon: p.roundsWon + 1,
              }
            : p
        )
      );

      setCoreConfig((prev) => ({
        ...prev,
        currentBalance: Math.max(0, prev.currentBalance - wonBounty),
      }));

      // Check if this was one of the 5 Special Vault Addresses
      if (currentRound.isSpecialVault && currentRound.specialVaultId) {
        const vaultId = currentRound.specialVaultId;

        setVaultAddresses((prev) =>
          prev.map((v) =>
            v.id === vaultId
              ? {
                  ...v,
                  wonByPlayerId: playerId,
                  wonAtRound: currentRound.roundNumber,
                  wonTimestamp: Date.now(),
                  bountyDogeWon: wonBounty,
                }
              : v
          )
        );

        const unlockedVault = vaultAddresses.find((v) => v.id === vaultId);
        if (unlockedVault) {
          const updatedVault = {
            ...unlockedVault,
            wonByPlayerId: playerId,
            wonAtRound: currentRound.roundNumber,
            wonTimestamp: Date.now(),
            bountyDogeWon: wonBounty,
          };
          setUnlockedVaultModal(updatedVault);
          setModalWinnerPlayer(winningPlayer);
        }
      }

      // Record transaction
      const newTx: GameTransaction = {
        id: `tx-${Date.now()}`,
        txid,
        timestamp: Date.now(),
        roundNumber: currentRound.roundNumber,
        type: currentRound.isSpecialVault ? 'VAULT_UNLOCKED' : 'CORE_GIVEAWAY',
        from: 'Dogecoin Core 1.5.0.0 (Mined Stash)',
        to: winningPlayer.address,
        amountDoge: wonBounty,
        winnerName: winningPlayer.name,
        specialVaultAddress: currentRound.isSpecialVault ? currentRound.targetAddress : undefined,
        status: 'CONFIRMED',
      };
      setTransactions((prev) => [newTx, ...prev]);

      setRecentWinner({
        player: winningPlayer,
        amount: wonBounty,
        isVault: currentRound.isSpecialVault,
        reactionMs,
      });

      // If Auto-Round mode is enabled, spawn next round after celebration delay
      if (isAutoMode) {
        autoRoundTimerRef.current = setTimeout(() => {
          startNewRound();
        }, 4500);
      }
    },
    [currentRound, isAutoMode, players, startNewRound, vaultAddresses]
  );

  // Handle payout success from Cash-Out Hub
  const handlePayoutSuccess = (playerId: number, txid: string) => {
    setTransactions((prev) => [
      {
        id: `payout-${Date.now()}`,
        txid,
        timestamp: Date.now(),
        roundNumber: 0,
        type: 'MANUAL_PAYOUT',
        from: 'Dogecoin Core 1.5.0.0 Payout',
        to: players.find((p) => p.id === playerId)?.address || '',
        amountDoge: players.find((p) => p.id === playerId)?.balanceDoge || 0,
        status: 'CONFIRMED',
      },
      ...prev,
    ]);
  };

  const unlockedVaultsCount = vaultAddresses.filter((v) => v.wonByPlayerId !== null).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* 3-Zone Navigation Header */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        coreBalance={coreConfig.currentBalance}
        isLiveRpc={coreConfig.useLiveCore && coreConfig.connected}
        unlockedVaultsCount={unlockedVaultsCount}
        totalVaultsCount={vaultAddresses.length}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
        {activeTab === 'arena' && (
          <Arena
            players={players}
            currentRound={currentRound}
            coreBalance={coreConfig.currentBalance}
            vaultAddresses={vaultAddresses}
            onStartRound={startNewRound}
            onFireShot={handleFireShot}
            isAutoMode={isAutoMode}
            setIsAutoMode={setIsAutoMode}
            recentWinner={recentWinner}
          />
        )}

        {activeTab === 'wallets' && (
          <PlayerWallets
            players={players}
            setPlayers={setPlayers}
            vaults={vaultAddresses}
          />
        )}

        {activeTab === 'vaults' && (
          <VaultManager
            vaults={vaultAddresses}
            setVaults={setVaultAddresses}
            players={players}
            onOpenVaultModal={(vault) => {
              const winner = players.find((p) => p.id === vault.wonByPlayerId) || null;
              setUnlockedVaultModal(vault);
              setModalWinnerPlayer(winner);
            }}
          />
        )}

        {activeTab === 'rpc' && (
          <CoreRpcPanel
            config={coreConfig}
            setConfig={setCoreConfig}
            onSyncNode={syncNodeStatus}
          />
        )}

        {activeTab === 'cashout' && (
          <CashOutHub
            players={players}
            vaults={vaultAddresses}
            config={coreConfig}
            onPayoutSuccess={handlePayoutSuccess}
          />
        )}
      </main>

      {/* Special Vault Unlocked Celebratory Modal */}
      {unlockedVaultModal && (
        <VaultUnlockModal
          vault={unlockedVaultModal}
          winner={modalWinnerPlayer}
          onClose={() => setUnlockedVaultModal(null)}
        />
      )}

      {/* Quiet, clean footer */}
      <footer className="border-t border-neutral-900 px-6 py-4 text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>🎃 Office Halloween Party Edition</span>
          <span>·</span>
          <span>Dogecoin Core 1.5.0.0</span>
          <span>·</span>
          <span>100% Intranet Offline Ready</span>
        </div>
        <div>
          <span>Total Mined Pool: 9,000 DOGE</span>
        </div>
      </footer>
    </div>
  );
}
