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
	req.assert('email', 'Valid email required').isEmail();
	//req.assert('email', 'valid email required').isEmail();
	req.assert('username','String is not in range (min 6 characters to 20)').len(6,20);
	req.assert('password', '6 to 20 characters required').len(6, 20);
	req.assert('passwordConfirmation','Password and Password Confirmation are not equal, please redigit them').equals(req.body.password);
	
	var pageParam = req.body;
	//var errors = req.validationErrors();
	var mappedErrors = req.validationErrors(true);
	
	        
	function checkExistence(){
		
	}
	
	function insertInto(pageParam) {
		var alreadyExists = false;
		db.collection('users', function(err, collection) {
			
			if(mappedErrors){
				return fn(mappedErrors,null)		
			}else{
				collection.find().toArray(function(err, items) {
					for(var key in items){
		            	console.log(items[key].username," ",req.body.username);
		            	if(items[key].username == req.body.username){
		            		alreadyExists=true;
		            		return fn("already exists",null);
		            	}				
					}
					if(!alreadyExists){
						collection.insert(pageParam, {
								safe : true
							},function(err,result){
								console.log("too late")
								return fn(null,null);}
					)}
	        	})				
			}
		});
	}
	
    
	//if(req.body.password == req.body.passwordConfirmation){
		hash(req.body.password, function(err, salt, hash) {
			pageParam.salt = salt;
			pageParam.hash = hash;
			insertInto(pageParam);
		})		
	/*}else{
		error = "password confirmation is different from password"
		var params = {
			username:req.body.username,
			email:req.body.email
		}
		fn(error,params)
	}*/
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
