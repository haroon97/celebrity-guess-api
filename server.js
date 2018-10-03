const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const generatePassword = require('password-generator');

const db = knex({
  client: 'pg',
  connection: {
  host : '127.0.0.1',
  user : 'postgres',
  password : '',
  database : 'demographicsapp'
}
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
         user: 'haroonrmit@gmail.com',
         pass: 'chaingang345'
     }
 })

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

app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  db.select('*')
   .from('login')
   .where('email', '=', email)
   .returning('*')
   .then(user => {
     if (bcrypt.compareSync(password, user[0].password)) {
       res.json('logged in');
     } else {
       res.status(400).json('wrong credentials');
     }
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
  });
});

app.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.transaction(trx => {
    trx('users')
     .where('id', id)
     .del()
     .returning('email')
     .then(userEmail => {
       return trx('login')
        .where('email', userEmail[0])
        .del()
        .returning('*')
        .then(data => {
          res.json('account deleted')
        })
     })
     .then(trx.commit)
     .catch(trx.rollback)
  })
  .catch(err => {
    res.status(400).json('not deleted');
  });
});

app.patch('/image', (req, res) => {
  const { id } = req.body;
  db('users')
   .where('id', '=', id)
   .increment('entries', 1)
   .returning('entries')
   .then(entries => {
     res.json(entries[0])
   })
   .catch(err => {
     res.status(400).json('error')
   });
});

app.patch('/update/:email', (req, res) => {
  const {name, email, password } = req.body;
  const userEmail = req.params.email;
  db.transaction(trx => {
    trx('login')
     .where('email', '=', userEmail)
     .update({
       email: email,
       password: password
     })
     .returning('email')
     .then(updatedEmail => {
       return trx('users')
         .where('email', '=', userEmail)
         .update({
           email: updatedEmail[0],
           name: name
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
    res.status(400).json('not updated');
  });
});

app.post('/forgot', (req, res) => {
  const { email } = req.body;
  let newPassword = generatePassword();
  db.select('*').from('login')
  .where('email', '=', email)
  .returning('*')
  .then(user => {
    if (user.length > 0) {
      mailOptions = {
      from: 'haroonrmit@gmail.com', 
      to: `${email}`, 
      subject: 'Password reset', 
      html: `<p>Your new password is ${newPassword}</p>`
      };
      transporter.sendMail(mailOptions);
      db('login')
      .where({email: user[0].email})
      .update({
      password: newPassword
      })
      res.json(user[0]);
    } else {
    res.status(404).json('email not found');
   }
  })
});

app.listen(3000, () => {
  console.log('App running on port 3000');
});