import fs from 'fs';
import path from 'path';
import solc from 'solc';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import axios from 'axios';
import querystring from 'querystring';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ETHERSCAN_API_KEY = 'XAT89JC1XQ9BK7C59PXJ5WAS4W3GGQ25MU';
// NOTE: Sometimes the deprecation message is due to missing params or bad encoding in V1 calls, but we will try the same endpoint with cleaner params first, or fallback to standard Etherscan V2 POST format.
// Scrollscan docs actually still point to the same V1-like API for verifySourceCode, but strict parameter handling might be key.
// Etherscan V2 usually uses a different endpoint structure or just a version flag, but for Scrollscan specifically:
// Based on deprecation message "switch to Etherscan API V2", the URL pattern often changes to /api/v2 or similar.
// However, standardized V2 calls usually look like: https://api-sepolia.scrollscan.com/api?module=contract&action=verifysourcecode&... 
// Wait, if /api is deprecated, maybe we just need to send it to the specialized endpoint. 

// Let's try the specific "Verify Source Code" endpoint if V2 API is strictly enforced. 
// BUT, often the issue is just the User-Agent or slight header tweaks. 
// Actually, let's try the V2 path: https://api-sepolia.scrollscan.com/v2/api
const SCROLL_API_URL = 'https://api-sepolia.scrollscan.com/api'; // Keeping base, will try headers/params tweak first

const CONTRACT_ADDRESS = '0x136Bcf922fA0A728809B2ccD08BCAD9b0091c2a8';

async function verify() {
    console.log('--- Iniciando Verificación Manual ---');

    const contractPath = path.resolve(__dirname, 'contracts', 'SensorRegistry.sol');
    const sourceContent = fs.readFileSync(contractPath, 'utf8');

    // Obtener version exacta de solc instalada
    const solcVersion = solc.version();
    const cleanVersion = 'v' + solcVersion.split('.Emscripten')[0];
    console.log(`Versión compilador detectada: ${cleanVersion}`);

    // Preparar parámetros V1 estandar (a veces el error V2 es engañoso y es solo un parámetro mal formado)
    // Referencia: https://docs.scroll.io/en/developers/verified-contracts/
    const params = {
        apikey: ETHERSCAN_API_KEY,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: CONTRACT_ADDRESS,
        sourceCode: sourceContent,
        codeformat: 'solidity-single-file',
        contractname: 'SensorRegistry',
        compilerversion: cleanVersion,
        optimizationUsed: 1, // 1 = true
        runs: 200,
        evmversion: '', // default
        licenseType: 3, // 3 = MIT
        chainId: 534351 // Scroll Sepolia Chain ID (crucial for some V2 parsers)
    };

    try {
        console.log('Enviando petición a la API (Intento con chainId)...');

        // V2 often requires strict JSON or specific content type.
        // Let's try wrapping it in the new query format if available, but for now
        // the deprecation message likely implies using the "v2" URL path if it exists.

        // Attempt 1: Change URL to /v2/api
        // const v2Url = 'https://api-sepolia.scrollscan.com/v2/api';

        const response = await axios.post(SCROLL_API_URL, querystring.stringify(params), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('Respuesta:', response.data);

        if (response.data.status === '1') {
            console.log(`✅ Solicitud enviada! GUID: ${response.data.result}`);
            console.log(`Verificar estado: https://api-sepolia.scrollscan.com/api?module=contract&action=checkverifystatus&guid=${response.data.result}`);
        } else {
            console.error('❌ Error API:', response.data.result);
            if (response.data.message) console.error('Mensaje:', response.data.message);
        }

    } catch (error) {
        console.error('Error de red:', error.message);
    }
}

verify();
