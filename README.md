# Koilen Scroll Demo

Integration of Tuya IoT Sensors with Scroll Sepolia Testnet.

## Overview
This project reads temperature and humidity data from a Tuya-enabled device and logs it immutably on the Scroll Sepolia blockchain. It includes a frontend dashboard to view real-time and historical data stored on-chain.

## Features
- **Tuya Integration**: Fetches real-time sensor data via Tuya Cloud API.
- **Blockchain Storage**: Stores readings on Scroll Sepolia using a smart contract (`SensorRegistry`).
- **Keystore Security**: Uses encrypted JSON keystores for safe transaction signing.
- **Automated Service**: Daemon script to log data at configurable intervals.
- **Visual Dashboard**: Modern web frontend with interactive charts and reading history.

## Prerequisites
- Node.js v16+
- A Scroll Sepolia funded wallet (Keystore JSON file)
- Tuya Developer Account (Access ID/Secret)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configuration**
   Create a `.env` file with your credentials:
   ```env
   # Tuya API
   TUYA_ACCESS_ID=your_access_id
   TUYA_ACCESS_SECRET=your_access_secret
   TUYA_API_ENDPOINT=https://openapi.tuyaus.com
   DEVICE_ID=your_device_id

   # Wallet
   KEYSTORE_PASSWORD=your_keystore_password
   ```

3. **Keystore**
   Place your encrypted keystore file (e.g., `defaultKey` or `UTC--...json`) in the root directory.

## Deployment

Deploy the smart contract to Scroll Sepolia:

```bash
node deploy-standalone.js
```
*This script compiles the contract, deploys it, and manages verification on Scrollscan automatically.*

## Usage

### 1. Data Logging Service
Start the service to read from Tuya and write to Scroll:

*   **Run once:**
    ```bash
    node koilen-service.js
    ```

*   **Run continuously (Daemon mode):**
    ```bash
    node koilen-service.js loop
    ```
    *Default interval: 30 seconds.*

### 2. Frontend Dashboard
Visualize the data:

```bash
npx http-server frontend -p 8080 -c-1
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

## Project Structure
- `contracts/`: Solidity smart contracts.
- `frontend/`: HTML/CSS/JS for the dashboard.
- `scripts/`: Legacy Hardhat scripts.
- `deploy-standalone.js`: Main deployment automation.
- `koilen-service.js`: Main logic for data fetching and transaction signing.
- `tuya-client.js`: Tuya API wrapper.

## Verified Contract
**SensorRegistry**: `0xc26a0053fE1b4849F33409E2ddAC2F9C76484Af9` (Scroll Sepolia)
