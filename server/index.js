// server/index.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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
  if (err) {
    console.error('Ошибка проверки таблицы:', err.message);
    return;
  }
  
  if (!row) {

    const defaultState = {
      hunger: 0.3,
      energy: 0.8,
      fatigue: 0.2,
      updated_at: Date.now()
    };
    
    db.run(
      "INSERT INTO pet_state (id, hunger, energy, fatigue, updated_at) VALUES (1, ?, ?, ?, ?)",
      [defaultState.hunger, defaultState.energy, defaultState.fatigue, defaultState.updated_at],
      (err) => {
        if (err) {
          console.error('Ошибка вставки данных по умолчанию:', err.message);
        } else {
          console.log('✅ БД инициализирована со значениями по умолчанию');
        }
      }
    );
  } else {
    console.log('✅ Таблица уже существует, данные загружены');
    console.log(`📊 Текущее состояние: голод=${row.hunger}, энергия=${row.energy}, усталость=${row.fatigue}`);
  }
});

app.get('/api/state', (req, res) => {
  db.get("SELECT hunger, energy, fatigue, updated_at FROM pet_state WHERE id = 1", (err, row) => {
    if (err) {
      console.error('Ошибка SELECT:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'State not found' });
    }
    
    res.json(row);
  });
});

app.post('/api/state', (req, res) => {
  const { hunger, energy, fatigue } = req.body;
  
  if (hunger === undefined || energy === undefined || fatigue === undefined) {
    return res.status(400).json({ error: 'Missing fields: hunger, energy, fatigue are required' });
  }
  
  if (hunger < 0 || hunger > 1 || energy < 0 || energy > 1 || fatigue < 0 || fatigue > 1) {
    return res.status(400).json({ error: 'Values must be between 0 and 1' });
  }
  
  const updated_at = Date.now();
  
  db.run(
    "UPDATE pet_state SET hunger = ?, energy = ?, fatigue = ?, updated_at = ? WHERE id = 1",
    [hunger, energy, fatigue, updated_at],
    function(err) {
      if (err) {
        console.error('Ошибка UPDATE:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ 
        success: true, 
        updated_at,
        changes: this.changes 
      });
    }
  );
});

app.post('/api/state/save', (req, res) => {
  const { hunger, energy, fatigue } = req.body;
  
  if (hunger !== undefined && energy !== undefined && fatigue !== undefined) {
    db.run(
      "UPDATE pet_state SET hunger = ?, energy = ?, fatigue = ?, updated_at = ? WHERE id = 1",
      [hunger, energy, fatigue, Date.now()],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  } else {
    res.status(400).json({ error: 'No data provided' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🐾 Сервер питомца запущен на http://localhost:${PORT}`);
  console.log(`📡 Доступные эндпоинты:`);
  console.log(`   GET  http://localhost:${PORT}/api/state`);
  console.log(`   POST http://localhost:${PORT}/api/state`);
  console.log(`   POST http://localhost:${PORT}/api/state/save\n`);
});