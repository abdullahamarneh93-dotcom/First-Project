// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
//
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'YYYY-MM-DD').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully');
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        title, 
        amount::float8 AS amount, 
        category, 
        to_char(date, 'YYYY-MM-DD') AS date 
      FROM expenses 
      ORDER BY date DESC, id DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Internal server error while fetching expenses' });
  }
});
//------------------GET BY ID----------------- //
app.get('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id) || parseInt(id) <= 0) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const query = `
      SELECT 
        id, 
        title, 
        amount::float8 AS amount, 
        category, 
        to_char(date, 'YYYY-MM-DD') AS date 
      FROM expenses 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching single expense:', error);
    res.status(500).json({ message: 'Internal server error while fetching expense' });
  }
});

//-----------------POST --------------//
app.post('/api/expenses', async (req, res) => {
  const { title, amount, category, date } = req.body;

  const validCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required and must not be empty' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a number greater than 0' });
  }

  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ 
      message: `Category must be one of: ${validCategories.join(', ')}` 
    });
  }

  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'A valid date is required' });
  }

  try {
    const query = `
      INSERT INTO expenses (title, amount, category, date)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, 
        title, 
        amount::float8 AS amount, 
        category, 
        to_char(date, 'YYYY-MM-DD') AS date
    `;
    const values = [title.trim(), parsedAmount, category, date];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Internal server error while creating expense' });
  }
});

//----------PUT---------------//

app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id) || parseInt(id) <= 0) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  const { title, amount, category, date } = req.body;
  const validCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required and must not be empty' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a number greater than 0' });
  }

  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ 
      message: `Category must be one of: ${validCategories.join(', ')}` 
    });
  }

  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ message: 'A valid date is required' });
  }

  try {
    const query = `
      UPDATE expenses
      SET 
        title = $1, 
        amount = $2, 
        category = $3, 
        date = $4
      WHERE id = $5
      RETURNING 
        id, 
        title, 
        amount::float8 AS amount, 
        category, 
        to_char(date, 'YYYY-MM-DD') AS date
    `;
    const values = [title.trim(), parsedAmount, category, date, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Internal server error while updating expense' });
  }
});

//--------------DELETE ------------------//

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id) || parseInt(id) <= 0) {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  try {
    const query = `
      DELETE FROM expenses
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({ message: 'Expense deleted successfully', id: Number(id) });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Internal server error while deleting expense' });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});