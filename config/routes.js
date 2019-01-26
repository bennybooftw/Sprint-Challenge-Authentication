const axios = require('axios');
const { authenticate } = require('../auth/authenticate');
const bcrypt = require('bcryptjs');
const knex = require('knex');
const knexConfig = require('../knexfile');
const db = knex(knexConfig.development);
const jwt = require('jsonwebtoken');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  const creds = req.body;
  const hash = bcrypt.hashSync(creds.password, 14);
  creds.password = hash;
  db('users')
    .insert(creds)
    .then(ids => {
      res.status(201).json(ids);
    })
    .catch(err => json(err));
}

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  };
  const secret = process.env.JWT_KEY;
  const options = {
    expiresIn: "2h"
  };
  return jwt.sign(payload, secret, options);
}

function login(req, res) {
  const creds = req.body;
  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);
        res.status(200).json({ message: "Welcome!", token});
      } else {
        res.status(401).json({ message: "Not authorized." });
      }
    })
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
