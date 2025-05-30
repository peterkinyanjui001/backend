require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port for deployment

app.use(cors());
app.use(express.json());

// Serve static files with correct absolute path
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up file storage using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'peterpainter'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to MySQL');
    }
});

// Route: Upload painting data
app.post('/upload', upload.single('image'), (req, res) => {
    const { title, price, currency, description } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : '';

    if (!title || !price || !image_path) {
        return res.status(400).json({ message: 'Missing required fields: title, price, or image' });
    }

    const safeCurrency = currency || 'KES';
    const query = `INSERT INTO paintings (title, price, currency, description, image_path) VALUES (?, ?, ?, ?, ?)`;

    db.query(query, [title, price, safeCurrency, description, image_path], (err) => {
        if (err) {
            console.error('Insert error:', err.message);
            return res.status(500).json({ message: 'Database insert failed', error: err.message });
        }
        res.json({ message: 'Painting uploaded successfully' });
    });
});

// Route: Get all paintings
app.get('/paintings', (req, res) => {
    db.query('SELECT * FROM paintings ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch paintings' });
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
