const Client = require('pg').Client;
const fs = require('fs');
const client = new Client({
    host: 'localhost',
    user: 'postgres',
    port: 5432,
    password: 'shamit',
    database: 'test'
})

module.exports = client;