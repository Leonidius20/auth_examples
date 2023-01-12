const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');
const jwt = require('jsonwebtoken');
const request = require("request");
const cors = require('cors');
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_KEY = 'Authorization';

// TODO: put in env file
const DOMAIN = 'dev-k65ioh7c6583gibm.eu.auth0.com';
const CLIENT_ID = 'jDY86m3UACkJeAaOLj7XCWc2409fEUue';
const CLIENT_SECRET = 'X3SbkIedpXXmK_zO2VNDlBIQsHW2fbG6Y-4nYU39oXCarSn0H9ojck9Os52wlwev';
const AUDIENCE = 'https://dev-k65ioh7c6583gibm.eu.auth0.com/api/v2/';

app.use(cors());
const checkJwt = auth({
    audience: AUDIENCE,
    issuerBaseURL: `https://${DOMAIN}/`,
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/private', checkJwt, (req, res) => {
    // getting token from request jheder
    const token = req.header('Authorization').split(' ')[1];

    // getting user info
    const options = {
        method: 'GET',
        url: `https://${DOMAIN}/userinfo`,
        headers: { 'Authorization': `Bearer ${token}` }
    }

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        const userInfo = JSON.parse(body);
        return res.json({
            username: userInfo['name'],
            logout: 'http://localhost:3000/logout'
        })
    })
});

app.get('/logout', (req, res) => {
    res.redirect('/');
});

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    const options = { method: 'POST',
        url: `https://${DOMAIN}/oauth/token`,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form:
            {
                grant_type: 'password',
                username: login,
                password: password,
                audience: AUDIENCE,
                scope: 'offline_access openid profile email',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }
    };

    request(options, function (error, response, body) {
        if (error) {

            res.status(401).json(error).send();
        }

        const jsonResp = JSON.parse(body);
        if (body.error) {
            res.status(401).json(error).send();
        } else {
            res.json(jsonResp['access_token']);
        }
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
