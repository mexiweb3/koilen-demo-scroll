import context from './tuya-client.js';
import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';
import prompts from 'prompts';

dotenv.config();

const DEVICE_ID = process.env.DEVICE_ID;
const CONTRACT_ADDRESS = '0xc26a0053fE1b4849F33409E2ddAC2F9C76484Af9';
const RPC_URL = 'https://sepolia-rpc.scroll.io';
const INTERVAL_SECONDS = 30;

// ABI Minimal para logReading
const ABI = [
    "function logReading(int16 _temp, uint16 _humidity) external",
    "event NewReading(uint256 indexed timestamp, int16 temperature, uint16 humidity)"
];

async function getSensorReadings() {
    try {
        const response = await context.request({
            path: `/v1.0/iot-03/devices/${DEVICE_ID}/status`,
            method: 'GET',
        });

        if (!response.success || !response.result) {
            throw new Error('Error obteniendo datos de Tuya');
        }

        let temp = null;
        let humidity = null;

        response.result.forEach(item => {
            if (item.code === 'va_temperature' || item.code === 'temp_current') {
                temp = item.value; // Ya viene multiplicado por 10 (ej: 261 = 26.1)
            }
            if (item.code === 'va_humidity' || item.code === 'humidity_value') {
                humidity = item.value;
            }
        });

        return { temp, humidity };
    } catch (error) {
        console.error('Error Tuya API:', error.message);
        return null;
    }
}

async function main() {
    console.log('--- Iniciando Koilen Sensor Service ---');
    console.log(`Contrato: ${CONTRACT_ADDRESS}`);
    console.log(`Intervalo: ${INTERVAL_SECONDS} segundos`);

    // Setup Wallet
    if (!fs.existsSync('defaultKey')) {
        console.error('ERROR: No se encontró el archivo keystore "defaultKey".');
        process.exit(1);
    }

    let password = process.env.KEYSTORE_PASSWORD;
    if (!password) {
        const response = await prompts({
            type: 'password',
            name: 'value',
            message: 'Contraseña del Keystore (para firmar transacciones):',
            validate: value => value.length > 0 ? true : 'Requerido'
        });
        password = response.value;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const keystoreJson = fs.readFileSync('defaultKey', 'utf8');
    const wallet = await ethers.Wallet.fromEncryptedJson(keystoreJson, password);
    const signer = wallet.connect(provider);

    console.log(`Wallet desbloqueada: ${signer.address}`);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const runTask = async () => {
        console.log(`\n[${new Date().toLocaleTimeString()}] Obteniendo datos...`);

        const data = await getSensorReadings();
        if (!data || data.temp === null || data.humidity === null) {
            console.warn('Datos incompletos, saltando ciclo.');
            return;
        }

        console.log(`Lectura: Temp=${data.temp / 10}°C, Hum=${data.humidity}%`);

        try {
            console.log('Enviando transacción a Scroll...');
            const tx = await contract.logReading(data.temp, data.humidity);
            console.log(`Tx enviada: ${tx.hash}`);
            await tx.wait();
            console.log('✅ Transacción confirmada!');
        } catch (error) {
            console.error('Error enviando transacción:', error.message);
        }
    };

    // Ejecutar una vez
    await runTask();

    // Si se pasa el argumento 'loop', se ejecuta en intervalo
    if (process.argv.includes('loop')) {
        console.log(`\nModo bucle activado. Próxima ejecución en ${INTERVAL_SECONDS} segundos.`);
        setInterval(runTask, INTERVAL_SECONDS * 1000);
    } else {
        console.log('\nEjecución única finalizada.');
        process.exit(0);
    }
}

main().catch(console.error);
