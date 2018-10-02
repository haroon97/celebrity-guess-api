const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const bodyParser = require('body-parser');

const db = knex({
  client: 'pg',
  connection: {
  host : '127.0.0.1',
  user : 'postgres',
  password : '',
  database : 'demographicsapp'
}
});

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      password: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
      .insert({
        email: loginEmail[0],
        name: name,
        joinedat: new Date()
      })
      .returning('*')
      .then(user => {
        res.json(user[0]);
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => {
    return res.status(400).json('unable to register');
  });
});

app.get('/profile/:id', (req, res) => {
  const id = req.params.id;
  db.select('*').from('users').where({id})
  .then(user => {
    if (user.length) {
      res.json(user[0])
    } else {
      res.status(404).json('not found');
    }
    console.log(user.length);
  })
});

app.listen(3000, () => {
  console.log('App running on port 3000');
})