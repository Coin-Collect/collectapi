import axios from 'axios';
import BigNumber from 'bignumber.js';

const apiKey = process.env.ETHERSCAN_API_KEY;
const contractAddress = '0x56633733fc8BAf9f730AD2b6b9956Ae22c6d4148';
const decimals = 18; // replace this with the number of decimal places your token uses
const apiBaseUrl = 'https://api.etherscan.io/v2/api';
const chainId = 137; // Polygon mainnet

export default async (req, res) => {
    try {
        if (!apiKey) {
            throw new Error('Missing ETHERSCAN_API_KEY environment variable');
        }

        const response = await axios.get(apiBaseUrl, {
            params: {
                chainid: chainId,
                module: 'stats',
                action: 'tokensupply',
                contractaddress: contractAddress,
                apikey: apiKey,
            },
        });

        const { status, result, message } = response.data;

        if (status !== '1' || !/^-?\d+$/.test(result)) {
            throw new Error(`Unexpected tokensupply response: status=${status}, message=${message}`);
        }

        const totalSupplyInWei = new BigNumber(result);
        const totalSupply = totalSupplyInWei.dividedBy(new BigNumber(10).pow(decimals));
        res.status(200).send(totalSupply.toString(10));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching circulating supply.');
    }
};
