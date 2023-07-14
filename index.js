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

var answer = {
    "contact": {
        "primaryContatctId": '',
        "emails": [],
        "phoneNumbers": [],
        "secondaryContactIds": []
    }
}
app.post('/identify', async (req, res) => {
    console.log(req.body);
    const { email, phoneNumber } = req.body;

    const query = "SELECT * FROM person WHERE (email = ($1) OR phoneNumber = ($2)) AND linkPrecedence = 'primary'"
    // const query = "SELECT * FROM $1";
    const values = [email, phoneNumber];

    await client.connect();

    const result = await client.query(query, values);

    if (result.rows.length == 0) {
        const insertQuery0 = "INSERT INTO person(phoneNumber, email, linkedId, linkPrecedence) VALUES ($1, $2, $3, $4)";
        const values0 = [phoneNumber, email, null, 'primary'];
        await client.query(insertQuery0, values0);
    }
    else if (result.rows.length == 1) {
        const insertQuery1 = "INSERT INTO person(phoneNumber, email, linkedId, linkPrecedence) VALUES ($1, $2, $3, $4)";
        const values1 = [phoneNumber, email, result.rows[0].id, 'secondary'];
        await client.query(insertQuery1, values1);
    }
    else {

    }

    console.log(result.rows);
    client.end();
    return res.status(200).json(result.rows);

})

app.listen(port, (err) => {
    if (err) {
        console.log(err)
        return;
    }
    console.log(`Server is running on port: ${port}`);
})