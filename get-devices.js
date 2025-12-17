import context from './tuya-client.js';
import dotenv from 'dotenv';

dotenv.config();

const TUYA_UID = process.env.TUYA_UID;

async function getDevices() {
  try {
    console.log('Obteniendo lista de dispositivos...\n');

    if (!TUYA_UID) {
      console.log('⚠️  TUYA_UID no está configurado en .env\n');
      console.log('Para obtener tu UID, necesitas:');
      console.log('1. Ir a https://iot.tuya.com/');
      console.log('2. En tu Cloud Project, ir a: Devices → Link Tuya App Account');
      console.log('3. Escanear el QR con tu app Tuya Smart/Smart Life');
      console.log('4. Una vez vinculado, verás el UID en la lista de usuarios\n');
      console.log('Si ya conoces el DEVICE_ID de tu sensor, puedes agregarlo directamente al archivo .env');
      console.log('y usar el comando: npm run get-sensor-data\n');
      return;
    }

    console.log(`Buscando dispositivos para UID: ${TUYA_UID}\n`);

    const response = await context.request({
      path: `/v1.0/users/${TUYA_UID}/devices`,
      method: 'GET',
    });

    if (response.success && response.result) {
      console.log('✓ Dispositivos encontrados:\n');

      const devices = response.result;

      if (Array.isArray(devices) && devices.length > 0) {
        console.log('--- Lista de Dispositivos ---\n');
        devices.forEach((device, index) => {
          console.log(`${index + 1}. ${device.name || 'Sin nombre'}`);
          console.log(`   ID: ${device.id}`);
          console.log(`   Categoría: ${device.category || 'N/A'}`);
          console.log(`   Producto: ${device.product_name || 'N/A'}`);
          console.log(`   Online: ${device.online ? '✓ Sí' : '✗ No'}`);
          console.log('');
        });

        console.log('\n💡 Copia el ID del sensor que quieres monitorear y agrégalo como DEVICE_ID en tu archivo .env');
      } else {
        console.log('No se encontraron dispositivos para este usuario.');
        console.log('\nAsegúrate de:');
        console.log('1. Haber vinculado tu cuenta en Tuya IoT Platform');
        console.log('2. Tener dispositivos activos en tu app Tuya Smart');
      }
    } else {
      console.error('\n✗ Error al obtener dispositivos:', response);
      console.log('\nVerifica que:');
      console.log('1. El TUYA_UID sea correcto');
      console.log('2. Tu Cloud Project tenga los permisos necesarios');
      console.log('3. Las credenciales ACCESS_ID y ACCESS_KEY sean válidas');
    }
  } catch (error) {
    console.error('Error al obtener dispositivos:', error.message);
  }
}

getDevices();
