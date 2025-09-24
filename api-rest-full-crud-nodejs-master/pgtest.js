require('dotenv').config();
const { Client } = require('pg');

console.log('ENV', {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  passwordLen: process.env.PGPASSWORD ? String(process.env.PGPASSWORD).length : 0,
});

const client = new Client({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

client
  .connect()
  .then(async () => {
    console.log('connected');
    const res = await client.query('SELECT current_user, current_database();');
    console.log(res.rows[0]);
  })
  .catch((err) => {
    console.error('connect error', err);
  })
  .finally(() => client.end());


