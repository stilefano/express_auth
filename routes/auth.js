var mongo = require('mongodb');

var hash = require('./pass').hash;

var Server = mongo.Server, Db = mongo.Db, BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {
	auto_reconnect : true
});
db = new Db('authdb', server, {
	safe : true
});

db.open(function(err, db) {
	if (!err) {
		console.log("Connected to 'authdb' database");
		db.collection('users', {
			safe : true
		}, function(err, collection) {
			if (err) {
				console.log("The 'auth' collection doesn't exist. Creating it with sample data...");
			}
		});
	}
});

exports.addUser = function(req, res, fn) {

	var pageParam = req.body;

	function insertInto(pageParam) {
		db.collection('users', function(err, collection) {
			collection.insert(pageParam, {
				safe : true
			}, function(err, result) {
				if (err) {					return fn(err.err)
				} else {
					return fn(null)
				}
			});
		});
	}

	if(req.body.password == req.body.passwordConfirmation){
		hash(req.body.password, function(err, salt, hash) {
			pageParam.salt = salt;
			pageParam.hash = hash;
			insertInto(pageParam);
		})		
	}else{
		// usernameValue = req.body.username;
		// emailValue = req.body.email;
// 		
// 		
		// res.locals.usernameValue = usernameValue;
		// //emailValue = res.locals.emailValue;
// 		
		// console.log(usernameValue, "****",req.body.username)
		
		error = "password confirmation is different from password"
		fn(error)
	}
}

exports.restrict = function(req, res, username, next) {
	if (req.session.user && req.session.user.username == username) {
		res.render('restricted', {
			message : "Welcome " + username,
			isConnected : true
		})
	} else {
		req.session.error = 'Access denied!';
		if(!req.session.user) {
			//req.session.error = 'What are you trying to do Sir?';
			console.log("undefined")
			res.redirect('/404')
		}else{
			//req.session.error = 'Access denied!';
			console.log("defined")
			res.redirect('/restricted?'+req.session.user.username)	
		}
		
		//res.redirect('/restricted?'+req.session.user.username);
	}
}

exports.authenticate = function(accounts, pass, fn) {
	console.log('authenticating %s:%s', accounts, pass)
	if (!module.parent)
		console.log('authenticating %s:%s', accounts, pass);
	var user = accounts;
	var userMatched;
	db.collection('users', function(err, collection) {
		collection.findOne({
			'username' : user
		}, function(err, item) {
			userMatched = item;
			if (!userMatched)
				return fn(new Error('cannot find user'));
			hash(pass, userMatched.salt, function(err, hash) {
				if (err)
					return fn(err);
				if (hash == userMatched.hash)
					return fn(null, userMatched);
				fn(new Error('invalid password'));
			})
		});
	});
}
