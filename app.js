require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session'); 
const passport = require('passport');
const pssLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const md5 = require('md5');
// const encrypt = require('mongoose-encryption');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: "session secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); // initialize passport 
app.use(passport.session()); // also use passport for session

// database connection
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
// DB Schema

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(pssLocalMongoose);
userSchema.plugin(findOrCreate);
// use this plugin before the model gets created
// userSchema.plugin(encrypt, {secret: process.env.SECRETS, encryptedFields: ['password']}); 

// Data Model
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },

  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', function(req, res) {
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] 
}));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/register', function(req, res) {
    res.render('register');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.get('/submit', function(req, res) {
    if(req.isAuthenticated()){
        res.render('submit');
    }else {
        res.redirect('/login');
    } 
});

app.get('/secrets', function(req, res) {
    // if(req.isAuthenticated()){
    //     res.render('secrets');
    // }else {
    //     res.redirect('/login');
    // }
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if (err){
          console.log(err);
        } else {
          if (foundUsers) {
            res.render("secrets", {usersWithSecrets: foundUsers});
          }
        }
      });
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
})

// password : md5(req.body.password)
app.post('/register', function(req, res) {
    
    User.register( {username: req.body.username}, req.body.password, function(err, regUser) {
        if(err) {
            console.log(err);
            res.redirect('/register');
        }else {
            passport.authenticate("local")(req, res, function() {
                res.redirect('/secrets');
            });
        }
    })

});

 // const password = md5(req.body.password);
app.post('/login', function(req, res) {
    
    const user = new User({
        username : req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        }else {
            passport.authenticate("local")(req, res, function() {
                res.redirect('/secrets');
            });
        }
    });
});

app.post('/submit', function(req, res) {
    const submitString = req.body.secret;
    // console.log(req.user.id);
    User.findById(req.user.id, function(err, foundUser) {
        if(err) {
            console.log(err);
        }else {
            // foundUser.secret.push(submitString);
            foundUser.secret = submitString;
            foundUser.save(function() {
                res.redirect('/secrets');
            });
        }
    });
});

app.listen(8080, function() {
    console.log('server started on port 8080');
});