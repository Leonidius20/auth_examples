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

const APP_URL = 'http://localhost:3000';

app.use(cors());
const checkJwt = auth({
    audience: AUDIENCE,
    issuerBaseURL: `https://${DOMAIN}/`,
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/logout', (req, res) => {
    res.redirect(`https://${DOMAIN}/v2/logout?client_id=${CLIENT_ID}&returnTo=${encodeURIComponent(APP_URL)}`);
});

app.get('/receivecode', (req, res) => {
    if (req.query.code) { // if we got a code
        const code = req.query.code;

        // exchange it for an access token
        const options = {
            method: 'POST',
            url: `https://${DOMAIN}/oauth/token`,
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            form: {
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                scope: 'offline_access openid profile email',
                redirect_uri: `${APP_URL}/receivecode`
            }
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            const jsonResp = JSON.parse(body);
            if (body.error) {
                res.status(401).json(error).send();
            } else {
                // we have the access token, now get person's details
                // console.log(jsonResp)
                const token = jsonResp['access_token'];

                const id_token = jsonResp['id_token'];
                //res.json(id_token)
                //console.log(id_token)
                res.redirect(`${APP_URL}/userinfo?token=${token}`)


            }
        });
    } else {
        //
    }
});

app.get('/userinfo', (req, res) => {
    const accessToken = req.query.token;
    if (!accessToken) {
        res.send('Error: No access token in URL parameters');
    }

    const options = {
        method: 'GET',
        url: `https://${DOMAIN}/userinfo`,
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        const userInfo = JSON.parse(body);
        const username = userInfo['name'];
        const email = userInfo['email'];
        res.send(getHtml(username, email));
    })
});

app.get('/login', (req, res) => {
    const callbackUrl = `${APP_URL}/receivecode`;

    res.redirect(
        `https://${DOMAIN}/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&response_mode=query&scope=${encodeURIComponent('offline_access openid profile email')}`);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function getHtml(username, email) {
    return `
    <!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login</title>
    </head>
    <body>
        <main id="main-holder">
            <div>Hello, ${username}!</div>
            <div>Your email is: ${email}</div>
            <a href="/">Back to main page</a>
            <a href="/logout">Logout</a>
        </main>
    </body>
    `;
}