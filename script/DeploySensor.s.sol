// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/SensorRegistry.sol";

contract DeploySensor is Script {
    function run() external {
        // Retrieve private key from environment or usage params
        // But since we are using keystore via CLI, we just need to broadcast
        
        vm.startBroadcast();

        SensorRegistry sensor = new SensorRegistry();

        vm.stopBroadcast();
        
        console.log("SensorRegistry deployed at:", address(sensor));
    }
}
