import dotenv from 'dotenv';
// import {createRequire} from 'module';

// const require = createRequire(import.meta.url);
const redis = require('redis');
const { promisify } = require('util');

dotenv.config({path: './.env'});

const client = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_ENDPOINT,
  {
    'auth_pass': process.env.REDIS_PASSWORD,
    'return_buffers': true
  }
).on('error', (err) => console.error('ERR:REDIS: ', err));

const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);
const getList = promisify(client.lrange).bind(client);

export default {
  client,
  get,
  set,
  getList
};
