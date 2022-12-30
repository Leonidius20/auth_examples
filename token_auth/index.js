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
const { auth } = require('express-oauth2-jwt-bearer');

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
/*app.use(auth({
    issuerBaseURL: `https://${DOMAIN}`,
    audience: AUDIENCE,
}));*/

app.use((req, res, next) => {
    let token = req.get(SESSION_KEY);
    if (token) {
        console.log(token);
        // checking signature

        request(
            {
                method: "GET",
                url: `https://${DOMAIN}/pem`
            },
            function (error, response, body) {
                if (error) res.status(500).json(error).send();

                const certificate = body;

                jwt.verify(token, certificate, { algorithm: 'RS256' },(err, user) => {
                    console.log(user)
                    if (err) {
                        console.log(err);
                    } else {
                        //req.user = user.login;
                        //req.username = users.find(user1 => user1.login === req.user).username;
                        req.token = token;
                    }
                    next();
                });
        });


    } else {
        next();
    }
});

app.get('/', (req, res) => {
    if (req.token) {
        // TODO: make a request to user info

        const options = {
            method: 'GET',
            url: `https://${DOMAIN}/userinfo`,
            headers: { 'Authorization': `Bearer ${req.token}` }
        }

        request(options, function (error, response, body) {
            if (error) console.log(error, body);
            const userInfo = JSON.parse(body);
            return res.json({
                username: userInfo['name'],
                logout: 'http://localhost:3000/logout'
            })
        })


    } else {
        res.sendFile(path.join(__dirname+'/index.html'));
    }

})

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

        console.log(body);
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
