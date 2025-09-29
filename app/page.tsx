import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-20">
        <header className="space-y-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Collect Analytics
          </span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            On-chain insights for the Collect ecosystem.
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Monitor ERC-20 and NFT performance, track circulating supply, and surface KPIs across your community
            in one place. Use the dashboard to configure contracts and power upcoming analytics modules.
          </p>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-400"
            >
              Go to Dashboard
            </Link>
            <a
              href="https://polygonscan.com/token/0x56633733fc8BAf9f730AD2b6b9956Ae22c6d4148"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              View Collect Token
            </a>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Tokens at a glance</h2>
            <p className="mt-2 text-sm text-slate-300">
              Track total supply, distribution, and liquidity metrics for each ERC-20 contract configured in the
              dashboard.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">NFT collection health</h2>
            <p className="mt-2 text-sm text-slate-300">
              Surface holder counts, secondary market trends, and activity insights across your flagship NFT
              projects.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
