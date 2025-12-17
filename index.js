import context from './tuya-client.js';
import dotenv from 'dotenv';

dotenv.config();

const DEVICE_ID = process.env.DEVICE_ID;
const POLLING_INTERVAL = 60000; // 60 segundos

async function getSensorData() {
  if (!DEVICE_ID) {
    console.error('Error: DEVICE_ID no está configurado en el archivo .env');
    console.log('Ejecuta "npm run get-devices" para obtener el ID de tu sensor');
    process.exit(1);
  }

  try {
    const response = await context.request({
      path: `/v1.0/iot-03/devices/${DEVICE_ID}/status`,
      method: 'GET',
    });

    if (response.success && response.result) {
      const timestamp = new Date().toLocaleString('es-ES');
      let temperature = null;
      let humidity = null;
      let battery = null;

      response.result.forEach((status) => {
        switch (status.code) {
          case 'va_temperature':
          case 'temp_current':
            temperature = status.value / 10;
            break;
          case 'va_humidity':
          case 'humidity_value':
            humidity = status.value;
            break;
          case 'battery_percentage':
          case 'battery_value':
            battery = status.value;
            break;
        }
      });

      console.log(`[${timestamp}] Temp: ${temperature}°C | Humedad: ${humidity}% | Batería: ${battery}%`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

console.log('Iniciando monitoreo del sensor de temperatura y humedad...');
console.log(`Intervalo de actualización: ${POLLING_INTERVAL / 1000} segundos\n`);

getSensorData();
setInterval(getSensorData, POLLING_INTERVAL);
