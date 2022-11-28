const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_KEY = 'Authorization';
const JWT_SECRET = 'b0c9e91d58600590dc8e0299507bad26154b2272ab48f0bbff1c10570367aec9498d6be860f5d935c70aae53bfdffedde62f640318dd4e53de4835f696f6f7ea';

app.use((req, res, next) => {
    let token = req.get(SESSION_KEY);
    if (token) {
        // checking signature
        jwt.verify(token, JWT_SECRET, (err, user) => {
            console.log(user)
            if (err) {
                console.log(err);
            } else {
                req.user = user.login;
                req.username = users.find(user1 => user1.login === req.user).username;
            }
            next();
        });
    } else{
        console.log("kurwa")
        next();
    }
});

app.get('/', (req, res) => {
    if (req.user) {
        return res.json({
            username: req.username,
            logout: 'http://localhost:3000/logout'
        })
    }
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/logout', (req, res) => {
    res.redirect('/');
});

const users = [
    {
        login: 'Login',
        password: 'Password',
        username: 'Username',
    },
    {
        login: 'Login1',
        password: 'Password1',
        username: 'Username1',
    }
]

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    const user = users.find((user) => {
        return user.login === login && user.password === password;
    });

    if (user) {
        const token = jwt.sign({login: login}, JWT_SECRET);
        res.json(token);
    }

    res.status(401).send();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
