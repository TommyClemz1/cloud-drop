require('dotenv').config();
const express = require('express');
const cors = require('cors');
const filesRouter = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'CloudDrop API is running' });
});

app.use('/api/files', filesRouter);

// Catch-all error handler so a thrown error doesn't crash the whole server
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`CloudDrop API listening on port ${PORT}`);
});
