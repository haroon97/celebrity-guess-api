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

app.get('/', (req, res) => {
  res.send('Hello Express');
});

app.listen(3000, () => {
  console.log('App running on port 3000');
})