import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import axios from 'axios';
import querystring from 'querystring';
import prompts from 'prompts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ETHERSCAN_API_KEY = 'XAT89JC1XQ9BK7C59PXJ5WAS4W3GGQ25MU';
const SCROLL_API_URL = 'https://api-sepolia.scrollscan.com/api';

async function main() {
    console.log('--- Iniciando Despliegue con Keystore ---');

    // 1. Cargar Keystore
    const keystoreFiles = fs.readdirSync(__dirname).filter(f => (f.endsWith('.json') && f.includes('UTC')) || f === 'defaultKey');
    if (keystoreFiles.length === 0 && !fs.existsSync('deployer-key.json')) {
        console.error('ERROR: No se encontró ningún archivo keystore (UTC..., defaultKey, deployer-key.json).');
        process.exit(1);
    }

    let keystorePath = fs.existsSync('deployer-key.json') ? 'deployer-key.json' : keystoreFiles[0];
    if (fs.existsSync('defaultKey')) keystorePath = 'defaultKey';

    console.log(`Usando keystore: ${keystorePath}`);

    const keystoreJson = fs.readFileSync(keystorePath, 'utf8');
    let password = process.env.KEYSTORE_PASSWORD;

    if (!password) {
        console.log('KEYSTORE_PASSWORD no está en .env. Por favor ingrésala manualmente.');
        const response = await prompts({
            type: 'password',
            name: 'value',
            message: 'Contraseña del Keystore:',
            validate: value => value.length > 0 ? true : 'La contraseña es requerida'
        });
        password = response.value;
    }

    if (!password) {
        console.error('ERROR: No se proporcionó contraseña.');
        process.exit(1);
    }

    // 2. Desencriptar Wallet
    console.log('Desencriptando wallet...');
    let wallet;
    try {
        wallet = await ethers.Wallet.fromEncryptedJson(keystoreJson, password);
    } catch (error) {
        console.error('ERROR: Contraseña incorrecta o keystore inválido.', error.message);
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io');
    wallet = wallet.connect(provider);
    console.log(`Wallet desbloqueada: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        console.error('ERROR: Fondos insuficientes.');
        process.exit(1);
    }

    // 3. Compilar Contrato
    console.log('\nCompilando SensorRegistry...');
    const contractPath = path.resolve(__dirname, 'contracts', 'SensorRegistry.sol');
    const sourceContent = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'SensorRegistry.sol': {
                content: sourceContent,
            },
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        const errors = output.errors.filter(e => e.severity === 'error');
        if (errors.length > 0) {
            console.error('Errores de compilación:', errors);
            process.exit(1);
        }
    }

    const contractOutput = output.contracts['SensorRegistry.sol']['SensorRegistry'];
    const bytecode = contractOutput.evm.bytecode.object;
    const abi = contractOutput.abi;

    // 4. Desplegar
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log('Enviando transacción de despliegue...');
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log(`\n✅ Contrato desplegado en: ${contractAddress}`);
    fs.appendFileSync('.env', `\nSENSOR_CONTRACT_ADDRESS=${contractAddress}`);

    // 5. Verificar
    console.log('\nIniciando verificación en Scrollscan...');

    // Esperar unos segundos para que el explorador indexe el contrato
    console.log('Esperando 20 segundos para indexación...');
    await new Promise(r => setTimeout(r, 20000));

    try {
        const params = {
            apikey: ETHERSCAN_API_KEY,
            module: 'contract',
            action: 'verifysourcecode',
            contractaddress: contractAddress,
            sourceCode: sourceContent,
            codeformat: 'solidity-single-file',
            contractname: 'SensorRegistry',
            compilerversion: 'v0.8.19+commit.7dd6d404', // Solc version used by hardcoded install or typically available
            optimizationUsed: 1, // True
            runs: 200
        };

        // Ajustar si la version de solc instalada es diferente.
        // Usamos solc.version() para obtener la exacta
        const solcVersion = solc.version();
        // solc.version returns something like 0.8.19+commit.7dd6d404.Emscripten.clang
        // Scrollscan expects usually v0.8.19+commit.7dd6d404
        const cleanVersion = 'v' + solcVersion.split('.Emscripten')[0];
        params.compilerversion = cleanVersion;
        console.log(`Versión compilador: ${cleanVersion}`);

        const response = await axios.post(SCROLL_API_URL, querystring.stringify(params));

        if (response.data.status === '1') {
            console.log(`Solicitud de verificación enviada! GUID: ${response.data.result}`);
            console.log(`Revisa el estado en: https://sepolia.scrollscan.com/address/${contractAddress}#code`);
        } else {
            console.error('Fallo al solicitar verificación:', response.data);
        }

    } catch (error) {
        console.error('Error verificando contrato:', error.message);
    }
}

main();
