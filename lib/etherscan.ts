import BigNumber from 'bignumber.js';

const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/v2/api';
const DEFAULT_CHAIN_ID = 137; // Polygon mainnet
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface EtherscanResponse<T> {
  status: '0' | '1';
  message: string;
  result: T;
}

interface RequestOptions<T> {
  allowEmptyResult?: boolean;
  fallbackValue?: T;
}

export async function etherscanRequest<T>(
  params: Record<string, string | number>,
  { allowEmptyResult = false, fallbackValue }: RequestOptions<T> = {},
): Promise<T> {
  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    throw new Error('ETHERSCAN_API_KEY is not set');
  }

  const url = new URL(ETHERSCAN_BASE_URL);

  const mergedParams: Record<string, string | number> = {
    chainid: DEFAULT_CHAIN_ID,
    apikey: apiKey,
    ...params,
  };

  Object.entries(mergedParams).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Etherscan request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as EtherscanResponse<T>;

  if (data.status === '1') {
    return data.result;
  }

  const resultText = typeof data.result === 'string' ? data.result : '';

  if (allowEmptyResult && (data.message === 'No transactions found' || resultText.includes('No transactions found'))) {
    return data.result;
  }

  if (fallbackValue !== undefined) {
    if (resultText.toLowerCase().includes('rate limit') || resultText.toLowerCase().includes('invalid api key')) {
      return fallbackValue;
    }
  }

  throw new Error(
    `Etherscan error: ${data.message || 'Unknown error'}${resultText ? ` - ${resultText}` : ''}`,
  );
}

export function formatUnits(value: string, decimals = 18): number {
  if (!value) return 0;
  const divisor = new BigNumber(10).pow(decimals);
  return new BigNumber(value).dividedBy(divisor).toNumber();
}

export function toBigNumberUnits(value: string, decimals = 18): BigNumber {
  const divisor = new BigNumber(10).pow(decimals);
  return new BigNumber(value).dividedBy(divisor);
}

export function fromHexAddress(address: string): string {
  return address.toLowerCase();
}

export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS;
}

export function isSameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export { ZERO_ADDRESS, DEFAULT_CHAIN_ID };
