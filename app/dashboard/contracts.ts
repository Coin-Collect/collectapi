export type ContractCategory = 'token' | 'nft';

export interface DashboardContract {
  address: string;
  label: string;
  symbol: string;
  category: ContractCategory;
  network: string;
  decimals?: number;
  maxSupply?: number;
  notes?: string;
}

export const dashboardContracts: DashboardContract[] = [
  {
    address: '0x56633733fc8BAf9f730AD2b6b9956Ae22c6d4148',
    label: 'Collect Token',
    symbol: 'COLL',
    category: 'token',
    network: 'Polygon Mainnet',
    notes: 'Primary ERC-20 token',
    decimals: 18,
    maxSupply: 326_435_433.06,
  },
  {
    address: '0x7B1Ead5f2d144D6F8b0eDD3090cB7713A615C3C5',
    label: 'Rewards Token',
    symbol: 'RWD',
    category: 'token',
    network: 'Polygon Mainnet',
    decimals: 18,
  },
  {
    address: '0xeacde3e3c5aae81d435d9a592827803296e25aae',
    label: 'Founder NFT',
    symbol: 'FDR',
    category: 'nft',
    network: 'Polygon Mainnet',
  },
  {
    address: '0x6ea79a316d4dedf58bca7abf8e13cc6f16358247',
    label: 'Membership NFT',
    symbol: 'MEM',
    category: 'nft',
    network: 'Polygon Mainnet',
  },
];

export const tokenContracts = dashboardContracts.filter((contract) => contract.category === 'token');
export const nftContracts = dashboardContracts.filter((contract) => contract.category === 'nft');
