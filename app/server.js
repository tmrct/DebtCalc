const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/data/scheduleData', (req, res) => {
    const data = JSON.stringify(req.body, null, 2);
    const filePath = path.join(__dirname, '../data', 'scheduleData.json');
    
    fs.writeFile(filePath, data, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Server error');
        }
        res.send('Data successfully saved to server');
    });
});

app.listen(port, () => {
    console.log(`Server running at https://debtcalc.onrender.com`);
});