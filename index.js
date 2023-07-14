const express = require('express');
const app = express();
const port = 8000;

const bodyParser = require('body-parser');
app.use(bodyParser.json());

require('dotenv').config();
// importing connected client
const client = require('./db');

// dummy home page
app.get('/', (req, res) => {
    res.send('Hello!')
})
// identify route
app.post('/identify', async (req, res) => {

    const { email, phoneNumber } = req.body;    // fetching the data from request body

    if (email == undefined && phoneNumber == undefined) {   // any one of the contact detail needed
        return res.status(500).send('Send valid contact details.')
    }
    // query to check number of primary ids registered on the given contact details
    const query = "SELECT * FROM person WHERE (email = ($1) OR phoneNumber = ($2)) AND linkPrecedence = 'primary'"

    const values = [email, phoneNumber];

    try {
        const result = await client.query(query, values);
        // if result length is 0. it means not previously registered. therefore linkPrecedence = 'Primary'
        if (result.rows.length == 0) {
            const insertQuery0 = "INSERT INTO person(phoneNumber, email, linkedId, linkPrecedence) VALUES ($1, $2, $3, $4)";
            const values0 = [phoneNumber, email, null, 'primary'];
            try {
                await client.query(insertQuery0, values0);
            }
            catch (err) {
                return res.status(500).send('Error inserting data');
            }
        }
        else if (result.rows.length == 1) { //if result length == 1. it means previously registered.
            const insertQuery1 = "INSERT INTO person(phoneNumber, email, linkedId, linkPrecedence) VALUES ($1, $2, $3, $4)";
            const values1 = [phoneNumber, email, result.rows[0].id, 'secondary'];
            if (phoneNumber == result.rows[0].phonenumber && email == result.rows[0].email) { }//if both contact details matches. do nothing
            else {  // if not insert the contact details with linkPrecendence as secondary
                try {
                    await client.query(insertQuery1, values1);
                }
                catch (err) {
                    return res.status(500).send('Error in inserting the data');
                }
            }
        }
        else {  //if result length = 2. it means one one matches with phone and other with email. Now do necessary changes to link one primary entry and all its secondary entry to other primary entry.
            let ind = 1;
            let id2 = result.rows[0].id;
            if (result.rows[0].createdAt < result.rows[1].createdAt) {
                ind = 0;
                id2 = result.rows[1].id;
            }

            let id1 = result.rows[ind].id;

            const updateQuery2 = "UPDATE person SET linkedId=$1, linkPrecedence=$2, updatedAt = NOW() WHERE (id = $3 OR linkedId = $4)";
            const updateValues = [id1, 'secondary', id2, id2];
            try {
                await client.query(updateQuery2, updateValues);
            }
            catch (err) {
                return res.status(500).send('Error in updating the data');
            }
        }

        const outQuery = "SELECT * FROM person WHERE (email = ($1) OR phoneNumber = ($2))";
        const output = await client.query(outQuery, values);

        var answer = {  // output format
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
            if (obj.linkprecedence == 'primary') {
                answer.contact.primaryContatctId = obj.id;
            }
            else {
                answer.contact.secondaryContactIds.push(obj.id);
            }
            if (obj.email != null) all_emails.push(obj.email);
            if (obj.phonenumber != null) all_phones.push(obj.phonenumber);
        });

        answer.contact.emails = [...new Set(all_emails)];
        answer.contact.phoneNumbers = [...new Set(all_phones)];

        return res.status(200).json(answer);     //return output with 200 status code
    }
    catch (err) {
        return res.status(500).send('Error fetching the data from database.');
    }

})

app.listen(port, (err) => {
    if (err) {
        console.log(err)
        return;
    }
    console.log(`Server is running on port: ${port}`);
})