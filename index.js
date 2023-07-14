const express = require('express');
const app = express();
const port = 8000;

const bodyParser = require('body-parser');
app.use(bodyParser.json());
const Client = require('pg').Client;

const config = require('./db');


app.get('/', (req, res) => {
    res.send('Hello!')
})

const table = "person";

app.post('/identify', async (req, res) => {

    const client = new Client(config);
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
        let ind = 1;
        let id2 = result.rows[0].id;
        if (result.rows[0].createdAt < result.rows[1].createdAt) {
            ind = 0;
            id2 = result.rows[1].id;
        }

        let id1 = result.rows[ind].id;

        const updateQuery2 = "UPDATE person SET linkedId=$1, linkPrecedence=$2, updatedAt = NOW() WHERE (id = $3 OR linkedId = $4)";
        const updateValues = [id1, 'secondary', id2, id2];
        await client.query(updateQuery2, updateValues);
    }

    const outQuery = "SELECT * FROM person WHERE (email = ($1) OR phoneNumber = ($2))";
    const output = await client.query(outQuery, values);

    var answer = {
        "contact": {
            "primaryContatctId": 0,
            "emails": [],
            "phoneNumbers": [],
            "secondaryContactIds": []
        }
    }

    let all_emails = [];
    let all_phones = [];

    output.rows.forEach(obj => {
        if (obj.linkPrecedence == 'primary') {
            answer.contact.primaryContatctId = obj.id;
        }
        else {
            answer.contact.secondaryContactIds.push(obj.id);
        }
        if (obj.email != null) all_emails.push(obj.email);
        if (obj.phoneNumber != null) all_phones.push(obj.phoneNumber);
    });

    answer.contact.emails = [...new Set(all_emails)];
    answer.contact.phoneNumbers = [...new Set(all_phones)];

    console.log(result.rows);
    client.end();
    return res.status(200).json(answer);

})

app.listen(port, (err) => {
    if (err) {
        console.log(err)
        return;
    }
    console.log(`Server is running on port: ${port}`);
})