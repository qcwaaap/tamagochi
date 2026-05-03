const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'pet_state.db'));

db.run(`
  CREATE TABLE IF NOT EXISTS pet_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hunger REAL NOT NULL,
    energy REAL NOT NULL,
    fatigue REAL NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

db.get("SELECT * FROM pet_state WHERE id = 1", (err, row) => {
  if (!row) {
    db.run(
      "INSERT INTO pet_state (id, hunger, energy, fatigue, updated_at) VALUES (1, 0.3, 0.8, 0.2, ?)",
      [Date.now()]
    );
    console.log('база данных создана с начальными значениями');
  } else {
    console.log('база данных уже существует');
  }
});

app.get('/api/state', (req, res) => {
  db.get("SELECT hunger, energy, fatigue FROM pet_state WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.post('/api/state', (req, res) => {
  const { hunger, energy, fatigue } = req.body;
  db.run(
    "UPDATE pet_state SET hunger = ?, energy = ?, fatigue = ?, updated_at = ? WHERE id = 1",
    [hunger, energy, fatigue, Date.now()],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.listen(PORT, () => {
  console.log(`сервер запущен на http://localhost:${PORT}`);
});