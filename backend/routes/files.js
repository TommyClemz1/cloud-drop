const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = require('../s3');
const pool = require('../db');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB cap, adjust as needed
});

const BUCKET = process.env.S3_BUCKET_NAME;

// POST /api/files/upload — upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const key = `${crypto.randomUUID()}-${req.file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const result = await pool.query(
      `INSERT INTO files (original_name, s3_key, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.file.originalname, key, req.file.mimetype, req.file.size]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/files — list all uploaded files
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM files ORDER BY uploaded_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Could not fetch files' });
  }
});

// GET /api/files/:id/download — get a time-limited secure download link
router.get('/:id/download', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [
      req.params.id,
    ]);
    const file = result.rows[0];
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: file.s3_key }),
      { expiresIn: 300 } // link valid for 5 minutes
    );

    res.json({ downloadUrl: url, filename: file.original_name });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Could not generate download link' });
  }
});

// DELETE /api/files/:id — remove a file from S3 and the database
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [
      req.params.id,
    ]);
    const file = result.rows[0];
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await s3.send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: file.s3_key })
    );
    await pool.query('DELETE FROM files WHERE id = $1', [req.params.id]);

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
