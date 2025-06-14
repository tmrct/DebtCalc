const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve files from root directory

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.post('/data/scheduleData', (req, res) => {
    const data = JSON.stringify(req.body, null, 2);
    const filePath = path.join(__dirname, '..', 'data', 'scheduleData.json');
    
    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Server error');
        }
        res.send('Data successfully saved to server');
    });
});

// Add GET endpoint to fetch schedule data
app.get('/data/scheduleData', (req, res) => {
    const filePath = path.join(__dirname, '..', 'data', 'scheduleData.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Server error');
        }
        res.json(JSON.parse(data));
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});