const express = require('express');
const app = express();
const port = 8000;

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const client = require('./db');


app.get('/', (req, res) => {
    res.send('Hello!')
})

const table = "person";
app.post('/identify', async (req, res) => {
    console.log(req.body);
    const { email, phoneNumber } = req.body;

    const query = 'SELECT * FROM $1 WHERE email = $2 OR phoneNumber = $3'
    const values = [table, email, phoneNumber];

    await client.connect();

    client.query('select * from person', [], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'An error occurred while processing the request' });
        }

        console.log(result);
        client.end();
        return res.status(200).json(result.rows);
    })
})

app.listen(port, (err) => {
    if (err) {
        console.log(err)
        return;
    }
    console.log(`Server is running on port: ${port}`);
})