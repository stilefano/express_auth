var express = require('express'),
	path = require('path'),
	http = require('http'),
	auth = require('./routes/auth');

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('host',process.env.HOST || "127.0.0.1");
    app.use(express.logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser()),
	app.use(express.cookieParser('shhhh, very secret')),
	app.use(express.session()),
    app.use(express.static(path.join(__dirname, 'public')));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
});

app.use(function(req, res, next){
  var err = req.session.error
    , msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

app.get("/", function(req,res){
	res.render('home')
})

app.get("/login", function(req, res){
	res.render('login.ejs', {
	});
});

app.get('/signup', function(req,res){
	res.render('signup.ejs')
})

app.get('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.get('/restricted', auth.restrict, function(req, res){
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

app.post('/signup', auth.addUser,function(){res.redirect('signup')});


app.post('/login', function(req, res){
  auth.retrieveUser(req.body.username);
  auth.authenticate(req.body.username, req.body.password,req,res, function(err, user){
    if (user) {
      // Regenerate session when signing in
      // to prevent fixation 
      req.session.regenerate(function(){
        // Store the user's primary key 
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.name
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.redirect('back');
      });
    } else {
      req.session.error = 'Authentication failed, please check your user name ';
      res.redirect('login');
    }
  });
});



/*app.get("/",function(req, res){
  res.locals.session = req.session;
  res.render('login', { title: 'Login to your account' });
});*/

http.createServer(app).listen(app.get('port'),function(){
	console.log("listin on port " + "http://"+app.get('host')+":"+app.get('port'));
})


