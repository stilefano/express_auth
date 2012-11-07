var express = require('express'),
	path = require('path'),
	http = require('http'),
	url = require('url'),
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
  res.locals.prova = "..."
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
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.get('/restricted?:username',function(req, res,next){
  var pathname = url.parse(req.url).query;
  auth.restrict(req,res,pathname,next);
});

app.post('/signup', function(req,res){
	auth.addUser(req,res,function(err){
			if(err){
				console.log(err)
					if(err.match('email')){
						req.session.error = "Error: You can not associate more than one user with the same email"
					}else if(err.match('username')){
						req.session.error = "Error: This username already exists"
					}else{
						req.session.error = "Error: try again"
					}
				res.redirect('/signup')
			}else{
			  auth.authenticate(req.body.username, req.body.password, function(err, user){
			    if (user) {
			      // Regenerate session when signing in
			      // to prevent fixation 
			      req.session.regenerate(function(){
			        // Store the user's primary key 
			        // in the session store to be retrieved,
			        // or in this case the entire user object
			        req.session.user = user;
			        req.session.success = 'Authenticated as ' + user.username
			          + ' click to <a href="/logout">logout</a>. '
			          + ' You may now access <a href="/restricted?'+user.username+'">restricted</a>.';
			        res.redirect('/');
			      });
			    } else {
			      req.session.error = 'Authentication failed, please check your user name <br/>'+'<strong>'+err+'</strong>';
			      res.redirect('login');
			    }
			  });
			}
		})
	});


app.post('/login', function(req, res){
  auth.authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      // Regenerate session when signing in
      // to prevent fixation 
      req.session.regenerate(function(){
        // Store the user's primary key 
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.username
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted?'+user.username+'">restricted</a>.';
        res.redirect('back');
      });
    } else {
      req.session.error = 'Authentication failed, please check your user name <br/>'+'<strong>'+err+'</strong>';
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


