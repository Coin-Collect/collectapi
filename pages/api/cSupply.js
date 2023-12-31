import axios from 'axios';
import BigNumber from 'bignumber.js';

const apiKey = 'R7BR3EI9DR9AQB9BWTU3MIYEC3KFWB8EUV';
const contractAddress = '0x56633733fc8BAf9f730AD2b6b9956Ae22c6d4148';
const decimals = 18; // replace this with the number of decimal places your token uses
const nonCirculatingSupply = new BigNumber(125).multipliedBy(new BigNumber(10).pow(6)); // 125 million

export default async (req, res) => {
    try {
        const url = `https://api.polygonscan.com/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${apiKey}`;
        const response = await axios.get(url);
        const totalSupplyInWei = new BigNumber(response.data.result);
        const totalSupply = totalSupplyInWei.dividedBy(new BigNumber(10).pow(decimals));
        const circulatingSupply = totalSupply.minus(nonCirculatingSupply); // Subtracting non-circulating supply
        res.status(200).send(circulatingSupply.toString(10)); // Only sending the circulating supply value as a string
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching circulating supply.');
    }
};
