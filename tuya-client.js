import { TuyaContext } from '@tuya/tuya-connector-nodejs';
import dotenv from 'dotenv';

dotenv.config();

const context = new TuyaContext({
  baseUrl: process.env.TUYA_API_ENDPOINT,
  accessKey: process.env.TUYA_ACCESS_ID,
  secretKey: process.env.TUYA_ACCESS_KEY,
});

export default context;
