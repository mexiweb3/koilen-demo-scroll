import hre from "hardhat";

async function main() {
    console.log("Desplegando contrato SensorRegistry...");

    const sensorRegistry = await hre.ethers.deployContract("SensorRegistry");

    await sensorRegistry.waitForDeployment();

    console.log(
        `SensorRegistry desplegado en: ${sensorRegistry.target}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
