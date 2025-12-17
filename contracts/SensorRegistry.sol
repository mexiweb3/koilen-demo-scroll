// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SensorRegistry {
    // Evento para notificar nuevo registro y facilitar la búsqueda en logs
    event NewReading(uint256 indexed timestamp, int16 temperature, uint16 humidity);

    // Estructura para almacenar los datos
    struct Reading {
        uint40 timestamp; // Suficiente hasta año 34000+
        int16 temperature; // Soporta negativos, valores multiplicados por 10 (ej: 25.5 -> 255)
        uint16 humidity;   // 0-100%
    }

    Reading[] public readings;

    /**
     * @dev Registra una nueva lectura del sensor.
     * @param _temp Temperatura * 10 (ej: 26.1°C -> 261)
     * @param _humidity Humedad en porcentaje
     */
    function logReading(int16 _temp, uint16 _humidity) external {
        uint40 currentTime = uint40(block.timestamp);
        readings.push(Reading({
            timestamp: currentTime,
            temperature: _temp,
            humidity: _humidity
        }));

        emit NewReading(currentTime, _temp, _humidity);
    }

    /**
     * @dev Obtiene el número total de lecturas
     */
    function getReadingsCount() external view returns (uint) {
        return readings.length;
    }

    /**
     * @dev Obtiene las últimas N lecturas. Útil para dashboards.
     */
    function getLastReadings(uint _count) external view returns (Reading[] memory) {
        uint total = readings.length;
        if (_count > total) {
            _count = total;
        }

        Reading[] memory lastReadings = new Reading[](_count);
        for (uint i = 0; i < _count; i++) {
            lastReadings[i] = readings[total - 1 - i];
        }
        return lastReadings;
    }
}
