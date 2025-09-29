import Link from 'next/link';
import { dashboardContracts } from './contracts';
import { loadDashboardData } from './load-data';

export const metadata = {
  title: 'Dashboard | Collect Analytics',
  description: 'Live analytics for Collect ecosystem tokens and NFT collections.',
};

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const preciseNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const percentDisplay = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

const severityStyles: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  info: 'bg-slate-100 text-slate-700 border-slate-200',
};

const eventStyles: Record<string, string> = {
  token: 'bg-indigo-100 text-indigo-700',
  nft: 'bg-emerald-100 text-emerald-700',
  liquidity: 'bg-sky-100 text-sky-700',
  governance: 'bg-amber-100 text-amber-700',
};

function timestampLabel(timestamp: number) {
  const date = new Date(timestamp);
  return `${dateFormatter.format(date)} | ${timeFormatter.format(date)}`;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ChangeBadge({ value, symbol }: { value: number; symbol: string }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
        Stable
      </span>
    );
  }

  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      <span>{isPositive ? 'UP' : 'DOWN'}</span>
      <span>
        {preciseNumber.format(Math.abs(value))} {symbol}
      </span>
    </span>
  );
}

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof loadDashboardData>>;
  try {
    data = await loadDashboardData();
  } catch (error) {
    console.error('Failed to load dashboard data', error);
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-24">
        <div className="max-w-xl space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Unable to load analytics right now</h1>
          <p className="text-sm text-slate-600">
            We could not reach the Polygon Etherscan API. Please refresh in a few moments or verify that the
            `ETHERSCAN_API_KEY` environment variable is configured correctly.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-8">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-700">
                Collect ecosystem overview
              </span>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Analytics Command Center</h1>
              <p className="max-w-3xl text-sm text-slate-600">
                Real-time insights sourced from on-chain activity via Etherscan. Review token emissions, NFT holder movements, and
                recent transfer activity to guide treasury, liquidity, and community decisions.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
            >
              {"<"} Back to overview
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total token supply</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {preciseNumber.format(data.summary.totalTokenSupply)}
              </p>
              <p className="text-xs text-slate-500">Combined circulating supply across tracked ERC-20 contracts.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Token volume (24h)</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {preciseNumber.format(data.summary.tokenVolume24h)}
              </p>
              <p className="text-xs text-slate-500">Sum of ERC-20 transfer value within the last 24 hours.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Token wallets touched (24h)</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {compactNumber.format(data.summary.uniqueTokenWallets24h)}
              </p>
              <p className="text-xs text-slate-500">Unique sender/receiver addresses across all token transfers.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">NFT transfers (24h)</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {data.summary.nftTransfers24h}
              </p>
              <p className="text-xs text-slate-500">ERC-721/ERC-1155 transfers registered in the last 24 hours.</p>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Token KPIs</h2>
            <p className="max-w-3xl text-sm text-slate-600">
              Each card aggregates live polygon data for the configured ERC-20 contracts, highlighting supply movements, unique
              counterparties, and the most recent high-value transfers.
            </p>
          </header>
          <div className="grid gap-6 lg:grid-cols-2">
            {data.tokens.map((token) => (
              <article key={token.contract.address} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-900">{token.contract.label}</h3>
                    <p className="text-sm text-slate-500">{token.contract.symbol} / {token.contract.network}</p>
                  </div>
                  <ChangeBadge value={token.netSupplyChange24h} symbol={token.contract.symbol} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Max supply</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {token.contract.maxSupply !== undefined
                        ? preciseNumber.format(token.contract.maxSupply)
                        : 'Not set'}
                    </p>
                    <p className="text-xs text-slate-500">Configured maximum cap for this contract.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Current supply</p>
                    <p className="text-lg font-semibold text-slate-900">{preciseNumber.format(token.totalSupply)}</p>
                    <p className="text-xs text-slate-500">Minted {preciseNumber.format(token.minted24h)} ({token.mintedCount24h} tx)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Volume (24h)</p>
                    <p className="text-lg font-semibold text-slate-900">{preciseNumber.format(token.volume24h)}</p>
                    <p className="text-xs text-slate-500">Burned {preciseNumber.format(token.burned24h)} ({token.burnedCount24h} tx)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Transfers (24h)</p>
                    <p className="text-lg font-semibold text-slate-900">{token.transferCount24h}</p>
                    <p className="text-xs text-slate-500">Unique wallets {token.uniqueWallets24h}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Top counterparties</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {token.topCounterparties.length === 0 ? (
                        <li>No recent counterparties</li>
                      ) : (
                        token.topCounterparties.map((entry) => (
                          <li key={entry.address} className="flex items-center justify-between">
                            <span>{truncateAddress(entry.address)}</span>
                            <span>{preciseNumber.format(entry.netFlow)}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Latest transfers</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {token.latestTransfers.length === 0 ? (
                      <li>
                        No transfers in the last 24 hours. We will populate this stream as soon as on-chain activity resumes.
                      </li>
                    ) : (
                      token.latestTransfers.map((transfer) => (
                        <li key={transfer.hash} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span>{preciseNumber.format(transfer.amount)} {token.contract.symbol}</span>
                            <span className="text-xs text-slate-400">{timestampLabel(transfer.timestamp)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>From {truncateAddress(transfer.from)}</span>
                            <span>→</span>
                            <span>To {truncateAddress(transfer.to)}</span>
                            <a
                              href={`https://polygonscan.com/tx/${transfer.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto text-indigo-600 hover:text-indigo-500"
                            >
                              View
                            </a>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">NFT Collection Metrics</h2>
            <p className="max-w-3xl text-sm text-slate-600">
              Transfer flow, participant counts, and mint/burn activity for the tracked NFT contracts. Data updates automatically with
              every on-chain event.
            </p>
          </header>
          <div className="grid gap-6 lg:grid-cols-2">
            {data.nfts.map((collection) => (
              <article key={collection.contract.address} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{collection.contract.label}</h3>
                    <p className="text-sm text-slate-500">{collection.contract.symbol} / {collection.contract.network}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {collection.transfers24h} transfers
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Max supply</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {collection.contract.maxSupply !== undefined
                        ? preciseNumber.format(collection.contract.maxSupply)
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Unique wallets (24h)</p>
                    <p className="text-lg font-semibold text-slate-900">{collection.uniqueWallets24h}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Mint / burn (24h)</p>
                    <p className="text-lg font-semibold text-slate-900">{collection.minted24h} / {collection.burned24h}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Current supply (approx)</p>
                    <p className="text-lg font-semibold text-slate-900">{collection.currentSupplyApprox}</p>
                    <p className="text-xs text-slate-500">Derived from the latest on-chain mint/burn data.</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Sales (24h)</p>
                    <p className="text-lg font-semibold text-slate-900">{collection.sales24h}</p>
                    <p className="text-xs text-slate-500">Secondary transfers between non-mint wallets.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Recent transfers</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {collection.recentTransfers.length === 0 ? (
                      <li>
                        No NFT transfers detected in the last 24 hours. As soon as a new mint or transfer lands, it will show here.
                      </li>
                    ) : (
                      collection.recentTransfers.map((transfer) => (
                        <li key={transfer.hash} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span>Token #{transfer.tokenId}</span>
                            <span className="text-xs text-slate-400">{timestampLabel(transfer.timestamp)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>From {truncateAddress(transfer.from)}</span>
                            <span>→</span>
                            <span>To {truncateAddress(transfer.to)}</span>
                            <a
                              href={`https://polygonscan.com/tx/${transfer.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto text-indigo-600 hover:text-indigo-500"
                            >
                              View
                            </a>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Recent sales</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {collection.recentSales.length === 0 ? (
                      <li>No secondary sales detected in the last 24 hours.</li>
                    ) : (
                      collection.recentSales.map((sale) => (
                        <li key={`${sale.hash}-${sale.tokenId}`} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span>Token #{sale.tokenId}</span>
                            <span className="text-xs text-slate-400">{timestampLabel(sale.timestamp)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>From {truncateAddress(sale.from)}</span>
                            <span>→</span>
                            <span>To {truncateAddress(sale.to)}</span>
                            <a
                              href={`https://polygonscan.com/tx/${sale.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto text-indigo-600 hover:text-indigo-500"
                            >
                              View
                            </a>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">On-chain Events</h2>
              <p className="text-sm text-slate-600">Highlights generated from the latest token and NFT transfers.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-slate-500">Powered by live Etherscan queries</span>
          </header>
          <ul className="space-y-4">
            {data.events.length === 0 ? (
              <li className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">No recent events detected.</li>
            ) : (
              data.events.map((event) => (
                <li key={event.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${eventStyles[event.category]}`}>
                          {event.category}
                        </span>
                        <span className="text-xs text-slate-500">{timestampLabel(event.timestamp)}</span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">{event.label}</h3>
                      <p className="text-sm text-slate-600">{event.description}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{event.delta}</span>
                      {event.hash ? (
                        <a
                          href={`https://polygonscan.com/tx/${event.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View transaction
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="space-y-4">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Comparative Insights</h2>
            <p className="text-sm text-slate-600">Cross-asset comparisons using the live metrics captured above.</p>
          </header>
          <div className="grid gap-6 lg:grid-cols-3">
            {data.comparativeMetrics.map((metric) => (
              <article key={metric.metric} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">{metric.metric}</h3>
                  <p className="text-sm text-slate-600">{metric.description}</p>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {metric.items.map((entry) => (
                    <li key={entry.symbol} className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{entry.symbol}</span>
                      <span>
                        {entry.unit === '%'
                          ? `${percentDisplay.format(entry.value)}%`
                          : preciseNumber.format(entry.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Alerts & Health</h2>
              <p className="text-sm text-slate-600">Automatically generated signals based on the on-chain data pulled above.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Configure alerts
            </button>
          </header>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.healthAlerts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                No alerts triggered in the last 24 hours.
              </div>
            ) : (
              data.healthAlerts.map((alert) => (
                <article key={alert.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyles[alert.severity]}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{alert.title}</h3>
                  <p className="text-sm text-slate-600">{alert.description}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Recommended action</p>
                  <p className="text-sm font-medium text-slate-700">{alert.recommendedAction}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-6">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Workspace Snapshot</h2>
            <p className="text-sm text-slate-600">Auto-generated from participation metrics to guide collaboration focus.</p>
          </header>
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <header className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Saved views</h3>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  Create view
                </button>
              </header>
              <ul className="space-y-3 text-sm text-slate-600">
                {data.workspace.savedViews.map((view) => (
                  <li key={view.id} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-800">{view.label}</p>
                      <p className="text-xs text-slate-500">Watchers {view.watchers}</p>
                    </div>
                    <span className="text-xs text-slate-400">Updated {timestampLabel(view.lastUpdated)}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Contract tags</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {data.workspace.contractTags.map((tag) => (
                  <li key={tag.tag} className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">#{tag.tag}</p>
                    <p className="text-xs text-slate-500">{tag.description}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="space-y-6">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Contract Directory</h2>
            <p className="text-sm text-slate-600">
              Every contract wired into the dashboard, including those without recent on-chain activity.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            {dashboardContracts.map((contract) => (
              <article key={contract.address} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{contract.label}</h3>
                    <p className="text-xs text-slate-500">{contract.symbol} / {contract.network}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                    {contract.category === 'token' ? 'Token' : 'NFT'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                  <code className="block break-all text-sm text-slate-600">{contract.address}</code>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Max supply</p>
                  <p className="text-sm text-slate-600">
                    {contract.maxSupply !== undefined ? preciseNumber.format(contract.maxSupply) : 'Not set'}
                  </p>
                </div>
                {contract.notes ? (
                  <p className="text-sm text-slate-500">{contract.notes}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
