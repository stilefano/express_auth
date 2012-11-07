var mongo = require('mongodb');

var hash = require('./pass').hash;

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('authdb', server, {safe: true});


db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'authdb' database");
        db.collection('users', {safe:true}, function(err, collection) {
            if (err) {
                console.log("The 'auth' collection doesn't exist. Creating it with sample data...");
            }
        });     
    }
});

exports.addUser = function(req,res,fn){
	
	var pageParam = req.body;

	function insertInto(pageParam){	
	    db.collection('users', function(err, collection) {
	        collection.insert(pageParam, {safe:true}, function(err, result) {
	            if (err) {					return fn(err.err)
	            } else {
					return fn(null)
	            }
	        });
	    });		
	}
	
	hash(req.body.password, function(err, salt, hash){
		  pageParam.salt = salt;
		  pageParam.hash = hash;
		  insertInto(pageParam);
	})
}

exports.restrict = function (req, res,username, next) {
	console.log(req.session.user.username,' ***** ', username)
  if (req.session.user && req.session.user.username == username) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/');
  }
}

exports.authenticate = function(accounts, pass, fn) {
  console.log('authenticating %s:%s',accounts, pass)
  if (!module.parent) console.log('authenticating %s:%s',accounts, pass);   
  var user = accounts;
  var userMatched;
  db.collection('users', function(err, collection) {
      collection.findOne({'username':user}, function(err, item) {  
          userMatched=item;
		  if (!userMatched) return fn(new Error('cannot find user'));
		  hash(pass, userMatched.salt, function(err, hash){		     
		    if (err) return fn(err);
		    if (hash == userMatched.hash) return fn(null, userMatched);
		    	fn(new Error('invalid password'));
		  }) 
      });
  });  
}
