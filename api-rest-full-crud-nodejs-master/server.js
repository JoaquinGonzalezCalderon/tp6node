// import express
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

// create a new express app
const app = express();

// create a new port
const PORT = process.env.PORT || 3000;

// middleware to parse the body of the request JSON
app.use(express.json());

// --- DB POOL ---
const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
});

// (opcional) chequeo y create table si no existe
async function ensureSchema() {
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
    await pool.query(createTableSQL);
}
ensureSchema().catch((err) => {
    console.error('Error creando/verificando esquema:', err);
    process.exit(1);
});

// GET /users
app.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name, email, created_at AS "createdAt" FROM users ORDER BY id;');
        res.json(rows);
    } catch (err) {
        console.error('GET /users error:', err);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// GET /users/:id
app.get('/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { rows } = await pool.query(
            'SELECT id, name, email, created_at AS "createdAt" FROM users WHERE id = $1;',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /users/:id error:', err);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

// POST /users
// Body JSON esperado: { "name": string, "email": string }
app.post('/users', async (req, res) => {
    try {
        const { name, email } = req.body || {};
        if (!name || !email) {
            return res.status(400).json({ error: 'Nombre y email son requeridos' });
        }
        const insertSQL = `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING id, name, email, created_at AS "createdAt";
    `;
        const { rows } = await pool.query(insertSQL, [name, email]);
        res.status(201).json(rows[0]);
    } catch (err) {
        // Manejo de email único
        if (err.code === '23505') {
            return res.status(409).json({ error: 'El email ya existe' });
        }
        console.error('POST /users error:', err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

/**
 * DELETE /users/:id
 * Elimina un usuario por id
 */
app.delete('/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1;', [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.status(204).send();
    } catch (err) {
        console.error('DELETE /users/:id error:', err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
