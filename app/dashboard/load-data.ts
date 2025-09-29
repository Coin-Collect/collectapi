import BigNumber from 'bignumber.js';
import {
  etherscanRequest,
  formatUnits,
  isSameAddress,
  isZeroAddress,
  toBigNumberUnits,
  ZERO_ADDRESS,
} from '../../lib/etherscan';
import { nftContracts, tokenContracts, type DashboardContract } from './contracts';

interface TokenTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenDecimal: string;
}

interface NftTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  tokenID: string;
}

export interface TokenCounterparty {
  address: string;
  netFlow: number;
}

export interface TokenTransferSummary {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
}

export interface TokenMetrics {
  contract: DashboardContract;
  totalSupply: number;
  minted24h: number;
  mintedCount24h: number;
  burned24h: number;
  burnedCount24h: number;
  volume24h: number;
  transferCount24h: number;
  uniqueWallets24h: number;
  netSupplyChange24h: number;
  topCounterparties: TokenCounterparty[];
  latestTransfers: TokenTransferSummary[];
}

export interface NftTransferSummary {
  hash: string;
  from: string;
  to: string;
  tokenId: string;
  timestamp: number;
}

export interface NftMetrics {
  contract: DashboardContract;
  transfers24h: number;
  uniqueWallets24h: number;
  minted24h: number;
  burned24h: number;
  sales24h: number;
  totalMintedApprox: number;
  currentSupplyApprox: number;
  recentTransfers: NftTransferSummary[];
  recentSales: NftTransferSummary[];
}

export interface ComparativeMetric {
  metric: string;
  description: string;
  items: Array<{ symbol: string; value: number; unit?: string }>;
}

export interface OnChainEvent {
  id: string;
  label: string;
  timestamp: number;
  category: 'token' | 'nft' | 'liquidity' | 'governance';
  delta: string;
  description: string;
  hash?: string;
}

export interface HealthAlert {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendedAction: string;
}

export interface DashboardSummary {
  totalTokenSupply: number;
  tokenVolume24h: number;
  totalTokenTransactions24h: number;
  uniqueTokenWallets24h: number;
  nftTransfers24h: number;
  nftUniqueWallets24h: number;
}

export interface WorkspaceSnapshot {
  savedViews: Array<{ id: string; label: string; watchers: number; lastUpdated: number }>;
  contractTags: Array<{ tag: string; description: string }>;
}

export interface DashboardData {
  summary: DashboardSummary;
  tokens: TokenMetrics[];
  nfts: NftMetrics[];
  events: OnChainEvent[];
  comparativeMetrics: ComparativeMetric[];
  healthAlerts: HealthAlert[];
  workspace: WorkspaceSnapshot;
}

const DAY_SECONDS = 24 * 60 * 60;
const TX_OFFSET = 200;

const parseTimestamp = (value: string): number => Number.parseInt(value, 10) * 1000;

const sumBigNumber = (values: BigNumber[]): BigNumber => values.reduce((acc, value) => acc.plus(value), new BigNumber(0));

async function fetchTokenSupply(contract: DashboardContract): Promise<number> {
  const result = await etherscanRequest<string>(
    {
      module: 'stats',
      action: 'tokensupply',
      contractaddress: contract.address,
    },
    { fallbackValue: '0' },
  );

  return formatUnits(result, contract.decimals ?? 18);
}

async function fetchTokenTransactions(contract: DashboardContract): Promise<TokenTransaction[]> {
  const result = await etherscanRequest<TokenTransaction[]>(
    {
      module: 'account',
      action: 'tokentx',
      contractaddress: contract.address,
      sort: 'desc',
      offset: TX_OFFSET,
      page: 1,
    },
    { allowEmptyResult: true, fallbackValue: [] },
  );

  return result;
}

async function fetchNftTransactions(contract: DashboardContract): Promise<NftTransaction[]> {
  const result = await etherscanRequest<NftTransaction[]>(
    {
      module: 'account',
      action: 'tokennfttx',
      contractaddress: contract.address,
      sort: 'desc',
      offset: TX_OFFSET,
      page: 1,
    },
    { allowEmptyResult: true, fallbackValue: [] },
  );

  return result;
}

function computeTokenMetrics(contract: DashboardContract, transactions: TokenTransaction[], supply: number): TokenMetrics {
  const decimals = contract.decimals ?? 18;
  const dayAgo = Date.now() - DAY_SECONDS * 1000;
  const contractAddress = contract.address.toLowerCase();

  const recent = transactions.filter((tx) => parseTimestamp(tx.timeStamp) >= dayAgo);

  const minted = recent.filter((tx) => isZeroAddress(tx.from));
  const burned = recent.filter((tx) => isZeroAddress(tx.to));

  const mintedAmounts = minted.map((tx) => toBigNumberUnits(tx.value, decimals));
  const burnedAmounts = burned.map((tx) => toBigNumberUnits(tx.value, decimals));
  const transferAmounts = recent.map((tx) => toBigNumberUnits(tx.value, decimals));

  const mintedTotal = sumBigNumber(mintedAmounts);
  const burnedTotal = sumBigNumber(burnedAmounts);
  const volumeTotal = sumBigNumber(transferAmounts);

  const participants = new Set<string>();

  recent.forEach((tx) => {
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();

    if (!isZeroAddress(from) && !isSameAddress(from, contractAddress)) {
      participants.add(from);
    }

    if (!isZeroAddress(to) && !isSameAddress(to, contractAddress)) {
      participants.add(to);
    }
  });

  const netFlows = new Map<string, BigNumber>();

  recent.forEach((tx) => {
    const amount = toBigNumberUnits(tx.value, decimals);
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();

    if (!isZeroAddress(from) && !isSameAddress(from, contractAddress)) {
      const current = netFlows.get(from) ?? new BigNumber(0);
      netFlows.set(from, current.minus(amount));
    }

    if (!isZeroAddress(to) && !isSameAddress(to, contractAddress)) {
      const current = netFlows.get(to) ?? new BigNumber(0);
      netFlows.set(to, current.plus(amount));
    }
  });

  const topCounterparties = Array.from(netFlows.entries())
    .map(([address, net]) => ({ address, netFlow: net.toNumber() }))
    .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow))
    .slice(0, 3);

  const latestTransfers = recent
    .slice(0, 5)
    .map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      amount: toBigNumberUnits(tx.value, decimals).toNumber(),
      timestamp: parseTimestamp(tx.timeStamp),
    }));

  return {
    contract,
    totalSupply: supply,
    minted24h: mintedTotal.toNumber(),
    mintedCount24h: minted.length,
    burned24h: burnedTotal.toNumber(),
    burnedCount24h: burned.length,
    volume24h: volumeTotal.toNumber(),
    transferCount24h: recent.length,
    uniqueWallets24h: participants.size,
    netSupplyChange24h: mintedTotal.minus(burnedTotal).toNumber(),
    topCounterparties,
    latestTransfers,
  };
}

function computeNftMetrics(contract: DashboardContract, transactions: NftTransaction[]): NftMetrics {
  const dayAgo = Date.now() - DAY_SECONDS * 1000;
  const recent = transactions.filter((tx) => parseTimestamp(tx.timeStamp) >= dayAgo);
  const minted = recent.filter((tx) => isZeroAddress(tx.from));
  const burned = recent.filter((tx) => isZeroAddress(tx.to));
  const sales = recent.filter((tx) => !isZeroAddress(tx.from) && !isZeroAddress(tx.to));

  const participants = new Set<string>();
  recent.forEach((tx) => {
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();
    if (!isZeroAddress(from)) {
      participants.add(from);
    }
    if (!isZeroAddress(to)) {
      participants.add(to);
    }
  });

  const recentTransfers = recent.slice(0, 6).map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    tokenId: tx.tokenID,
    timestamp: parseTimestamp(tx.timeStamp),
  }));

  const recentSales = sales.slice(0, 6).map((tx) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    tokenId: tx.tokenID,
    timestamp: parseTimestamp(tx.timeStamp),
  }));

  const mintedIds = new Set<string>();
  const burnedIds = new Set<string>();

  transactions.forEach((tx) => {
    if (isZeroAddress(tx.from)) {
      mintedIds.add(tx.tokenID);
    }
    if (isZeroAddress(tx.to)) {
      burnedIds.add(tx.tokenID);
    }
  });

  const totalMintedApprox = mintedIds.size;
  const currentSupplyApprox = Math.max(totalMintedApprox - burnedIds.size, 0);

  return {
    contract,
    transfers24h: recent.length,
    uniqueWallets24h: participants.size,
    minted24h: minted.length,
    burned24h: burned.length,
    sales24h: sales.length,
    totalMintedApprox,
    currentSupplyApprox,
    recentTransfers,
    recentSales,
  };
}

function buildTokenEvents(tokens: TokenMetrics[]): OnChainEvent[] {
  const events: OnChainEvent[] = [];

  tokens.forEach((token) => {
    const latest = token.latestTransfers[0];
    if (latest) {
      events.push({
        id: `${token.contract.address}-transfer`,
        label: `${token.contract.symbol} large transfer`,
        timestamp: latest.timestamp,
        category: 'token',
        delta: `${latest.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.contract.symbol}`,
        description: `Transfer from ${latest.from.slice(0, 6)}... to ${latest.to.slice(0, 6)}...`,
        hash: latest.hash,
      });
    }

    if (token.mintedCount24h > 0) {
      events.push({
        id: `${token.contract.address}-mint`,
        label: `${token.contract.symbol} mint activity`,
        timestamp: Date.now(),
        category: 'token',
        delta: `+${token.minted24h.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.contract.symbol}`,
        description: `${token.mintedCount24h} mint transactions in the last 24h.`,
      });
    }

    if (token.burnedCount24h > 0) {
      events.push({
        id: `${token.contract.address}-burn`,
        label: `${token.contract.symbol} burn activity`,
        timestamp: Date.now(),
        category: 'token',
        delta: `-${token.burned24h.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.contract.symbol}`,
        description: `${token.burnedCount24h} burn transactions in the last 24h.`,
      });
    }
  });

  return events.slice(0, 6);
}

function buildNftEvents(nfts: NftMetrics[]): OnChainEvent[] {
  const events: OnChainEvent[] = [];

  nfts.forEach((collection) => {
    const latest = collection.recentTransfers[0];
    if (latest) {
      events.push({
        id: `${collection.contract.address}-transfer`,
        label: `${collection.contract.symbol} transfer`,
        timestamp: latest.timestamp,
        category: 'nft',
        delta: `Token #${latest.tokenId}`,
        description: `Transfer from ${latest.from.slice(0, 6)}... to ${latest.to.slice(0, 6)}...`,
        hash: latest.hash,
      });
    }

    const latestSale = collection.recentSales[0];
    if (latestSale) {
      events.push({
        id: `${collection.contract.address}-sale`,
        label: `${collection.contract.symbol} secondary sale`,
        timestamp: latestSale.timestamp,
        category: 'nft',
        delta: `Token #${latestSale.tokenId}`,
        description: `Secondary trade ${latestSale.from.slice(0, 6)}... → ${latestSale.to.slice(0, 6)}...`,
        hash: latestSale.hash,
      });
    }
  });

  return events;
}

function createComparativeMetrics(tokens: TokenMetrics[], nfts: NftMetrics[]): ComparativeMetric[] {
  return [
    {
      metric: 'Token volume (24h)',
      description: 'Total value transferred in the last 24 hours.',
      items: tokens.map((token) => ({ symbol: token.contract.symbol, value: token.volume24h })),
    },
    {
      metric: 'Net supply change (24h)',
      description: 'Minted supply minus burned supply over the last 24 hours.',
      items: tokens.map((token) => ({ symbol: token.contract.symbol, value: token.netSupplyChange24h })),
    },
    {
      metric: 'NFT transfer count (24h)',
      description: 'Number of NFT transfers recorded in the last 24 hours.',
      items: nfts.map((collection) => ({ symbol: collection.contract.symbol, value: collection.transfers24h })),
    },
    {
      metric: 'NFT sales (24h)',
      description: 'Secondary transfers where both parties were non-mint wallets in the last 24 hours.',
      items: nfts.map((collection) => ({ symbol: collection.contract.symbol, value: collection.sales24h })),
    },
  ];
}

function createHealthAlerts(tokens: TokenMetrics[], nfts: NftMetrics[]): HealthAlert[] {
  const alerts: HealthAlert[] = [];

  tokens.forEach((token) => {
    if (token.volume24h === 0) {
      alerts.push({
        id: `${token.contract.address}-volume`,
        severity: 'medium',
        title: `${token.contract.symbol} shows no 24h volume`,
        description: 'No token transfers recorded in the last 24 hours. Liquidity providers may need nudging.',
        recommendedAction: 'Review incentive programs or check for RPC/indexing outages.',
      });
    }

    if (token.netSupplyChange24h > 0 && token.netSupplyChange24h > token.totalSupply * 0.01) {
      alerts.push({
        id: `${token.contract.address}-mint-spike`,
        severity: 'high',
        title: `${token.contract.symbol} minted supply increased sharply`,
        description: 'Minted supply exceeded 1% of total supply in the last 24 hours.',
        recommendedAction: 'Confirm intended emissions schedules and monitor downstream pools.',
      });
    }
  });

  nfts.forEach((collection) => {
    if (collection.transfers24h === 0) {
      alerts.push({
        id: `${collection.contract.address}-nft-inactive`,
        severity: 'info',
        title: `${collection.contract.symbol} had no transfers in the past 24h`,
        description: 'Collection activity paused. Consider community engagement to spark trading.',
        recommendedAction: 'Highlight collection stories or run a community spotlight.',
      });
    }

    if (collection.sales24h === 0 && collection.transfers24h > 0) {
      alerts.push({
        id: `${collection.contract.address}-nft-sales-drought`,
        severity: 'low',
        title: `${collection.contract.symbol} saw transfers but no sales`,
        description: 'Only mints or internal movements registered with no secondary sales in the last 24 hours.',
        recommendedAction: 'Review marketplace incentives or highlight recent listings to spur trading.',
      });
    }
  });

  return alerts.slice(0, 6);
}

function createWorkspaceSnapshot(summary: DashboardSummary): WorkspaceSnapshot {
  const now = Date.now();

  return {
    savedViews: [
      {
        id: 'core-insights',
        label: 'Core Insights',
        watchers: Math.max(4, Math.round(summary.uniqueTokenWallets24h / 10)),
        lastUpdated: now,
      },
      {
        id: 'nft-ops',
        label: 'NFT Ops',
        watchers: Math.max(3, Math.round(summary.nftUniqueWallets24h / 12)),
        lastUpdated: now - 2 * 60 * 60 * 1000,
      },
    ],
    contractTags: [
      {
        tag: 'liquidity-watch',
        description: 'Tokens with notable changes in transfer volume or supply.',
      },
      {
        tag: 'collector-focus',
        description: 'NFT collections with active holder participation in the last 24h.',
      },
    ],
  };
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [tokenSupplies, tokenTxs] = await Promise.all([
    Promise.all(tokenContracts.map((contract) => fetchTokenSupply(contract))),
    Promise.all(tokenContracts.map((contract) => fetchTokenTransactions(contract))),
  ]);

  const tokens = tokenContracts.map((contract, index) =>
    computeTokenMetrics(contract, tokenTxs[index] ?? [], tokenSupplies[index] ?? 0),
  );

  const nftTxs = await Promise.all(nftContracts.map((contract) => fetchNftTransactions(contract)));

  const nfts = nftContracts.map((contract, index) => computeNftMetrics(contract, nftTxs[index] ?? []));

  const summary: DashboardSummary = {
    totalTokenSupply: tokens.reduce((acc, token) => acc + token.totalSupply, 0),
    tokenVolume24h: tokens.reduce((acc, token) => acc + token.volume24h, 0),
    totalTokenTransactions24h: tokens.reduce((acc, token) => acc + token.transferCount24h, 0),
    uniqueTokenWallets24h: tokens.reduce((acc, token) => acc + token.uniqueWallets24h, 0),
    nftTransfers24h: nfts.reduce((acc, collection) => acc + collection.transfers24h, 0),
    nftUniqueWallets24h: nfts.reduce((acc, collection) => acc + collection.uniqueWallets24h, 0),
  };

  const events = [...buildTokenEvents(tokens), ...buildNftEvents(nfts)].slice(0, 8);
  const comparativeMetrics = createComparativeMetrics(tokens, nfts);
  const healthAlerts = createHealthAlerts(tokens, nfts);
  const workspace = createWorkspaceSnapshot(summary);

  return {
    summary,
    tokens,
    nfts,
    events,
    comparativeMetrics,
    healthAlerts,
    workspace,
  };
}
