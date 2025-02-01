const fs = require('fs');
const path = require('path');

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

app.get('/data/scheduleData', (req, res) => {
    const filePath = path.join(dataDir, 'scheduleData.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            // Handle case where file might not exist yet
            return res.status(500).send('Server error, file not found or unable to read');
        }
        res.send(JSON.parse(data));
    });
});

app.post('/data/scheduleData', (req, res) => {
    const data = JSON.stringify(req.body, null, 2);
    const filePath = path.join(dataDir, 'scheduleData.json');
    
    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Server error');
        }
        res.send('Data successfully saved to server');
    });
});
