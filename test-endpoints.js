import axios from 'axios';
import querystring from 'querystring';

const ETHERSCAN_API_KEY = 'XAT89JC1XQ9BK7C59PXJ5WAS4W3GGQ25MU';
const CONTRACT = '0x136Bcf922fA0A728809B2ccD08BCAD9b0091c2a8';

// Candidate URLs
const URLS = [
    'https://api-sepolia.scrollscan.com/api',
    'https://api-sepolia.scrollscan.com/v2/api',
    'https://api-sepolia.scrollscan.com/api/v2',
    'https://api-sepolia.scrollscan.com/api?chainId=534351',
];

async function testEndpoints() {
    console.log('Testing endpoint variations for simple balance check (to find working V2)...');

    for (const url of URLS) {
        try {
            console.log(`\nTesting: ${url}`);
            const params = {
                module: 'account',
                action: 'balance',
                address: CONTRACT,
                tag: 'latest',
                apikey: ETHERSCAN_API_KEY,
                chainId: 534351 // Trying with chainId everywhere
            };

            const res = await axios.get(url, { params });
            if (res.data.result && !res.data.result.includes('deprecated')) {
                console.log(`✅ SUCCESS! Working Endpoint: ${url}`);
                console.log('Result:', res.data);
                return; // Found it
            } else {
                console.log(`❌ Failed or Deprecated message: ${res.data.result}`);
            }
        } catch (e) {
            console.log(`❌ Network Error: ${e.message}`);
        }
    }
}

testEndpoints();
