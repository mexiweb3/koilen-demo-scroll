require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

// Ensure PRIVATE_KEY is loaded
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    console.warn("⚠️  WARNING: PRIVATE_KEY not found in .env file. Deployment will fail.");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.19",
    defaultNetwork: "scrollSepolia",
    /*
  networks: {
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io",
      accounts: privateKey ? [privateKey] : [],
    },
  },
  */
};
