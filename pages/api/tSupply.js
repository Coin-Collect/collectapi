import axios from 'axios';
import BigNumber from 'bignumber.js';

const apiKey = 'R7BR3EI9DR9AQB9BWTU3MIYEC3KFWB8EUV';
const contractAddress = '0x56633733fc8BAf9f730AD2b6b9956Ae22c6d4148';
const decimals = 18; // replace this with the number of decimal places your token uses

export default async (req, res) => {
    try {
        const url = `https://api.polygonscan.com/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${apiKey}`;
        const response = await axios.get(url);
        const totalSupplyInWei = new BigNumber(response.data.result);
        const totalSupply = totalSupplyInWei.dividedBy(new BigNumber(10).pow(decimals));
        res.status(200).send(totalSupply.toString(10)); // Only sending the total supply value as a string
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching total supply.');
    }
};
