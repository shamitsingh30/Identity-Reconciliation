CREATE DATABASE test;
CREATE TYPE linkedtype AS ENUM ('primary', 'secondary');
CREATE TABLE person(
    id SERIAL PRIMARY KEY,
    phoneNumber TEXT,
    email TEXT,
    linkedId INTEGER,
    linkPrecedence linkedtype
)