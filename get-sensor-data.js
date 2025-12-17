import context from './tuya-client.js';
import dotenv from 'dotenv';

dotenv.config();

const DEVICE_ID = process.env.DEVICE_ID;

async function getSensorData() {
  if (!DEVICE_ID) {
    console.error('Error: DEVICE_ID no está configurado en el archivo .env');
    console.log('Ejecuta "npm run get-devices" para obtener el ID de tu sensor');
    process.exit(1);
  }

  try {
    console.log(`Obteniendo datos del sensor ${DEVICE_ID}...\n`);

    // 1. Obtener status (valores actuales)
    const response = await context.request({
      path: `/v1.0/iot-03/devices/${DEVICE_ID}/status`,
      method: 'GET',
    });

    if (response.success) {
      if (response.result && Array.isArray(response.result)) {
        console.log('--- Lecturas del Sensor ---');
        response.result.forEach((status) => {
          switch (status.code) {
            case 'va_temperature':
            case 'temp_current':
              console.log(`🌡️  Temperatura: ${status.value / 10}°C`);
              break;
            case 'va_humidity':
            case 'humidity_value':
              console.log(`💧 Humedad: ${status.value}%`);
              break;
            case 'battery_percentage':
            case 'battery_value':
              console.log(`🔋 Batería: ${status.value}%`);
              break;
            // Omitir otros valores técnicos si se desea, o imprimirlos en debug
            default:
              // console.log(`${status.code}: ${status.value}`);
              break;
          }
        });
      }
    } else {
      console.error('Error al obtener estado:', response);
    }

    // 2. Obtener detalles del dispositivo (para timestamp de última actualización)
    const deviceResponse = await context.request({
      path: `/v1.0/devices/${DEVICE_ID}`,
      method: 'GET',
    });

    if (deviceResponse.success) {
      if (deviceResponse.result.update_time) {
        const updateTime = new Date(deviceResponse.result.update_time * 1000);
        console.log(`⏱️  Última actualización: ${updateTime.toLocaleString()}`);
      }
    } else {
      console.error('Error al obtener detalles del dispositivo:', deviceResponse);
    }

  } catch (error) {
    console.error('Error al obtener datos del sensor:', error.message);
  }
}

getSensorData();
