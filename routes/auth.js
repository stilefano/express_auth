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
                populateDB();
            }
        });
    }
});

var users = {
  // username: function(){
  	 // db.collection('users', function(err, collection) {
// 		  	 	
  	 // });
  // }	account: {
		name: "prova"
		}
};

hash('foobar', function(err, salt, hash){
  if (err) throw err;
  // store the salt & hash in the "db"
  users.account.salt = salt;
  users.account.hash = hash;
  
  console.log(users.account)
});

exports.addUser = function(req,res){
	var pageParam = req.body;
	console.log(req.body+" ************ "+JSON.stringify(pageParam))
    db.collection('users', function(err, collection) {
        collection.insert(pageParam, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}

exports.restrict = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

exports.authenticate = function(accounts, pass, fn) {
	
	console.log('authenticating %s:%s',accounts, pass)
  if (!module.parent) console.log('authenticating %s:%s',accounts, pass);
  var user = users.account;
  // query the db for the given username
  if (!user) return fn(new Error('cannot find user'));
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  hash(pass, user.salt, function(err, hash){
    
    if (err) return fn(err);
    if (hash == user.hash) return fn(null, user);
    fn(new Error('invalid password'));
  })
}





/*var populateDB = function(){
	
	var users = {
		username: "prova",
		password: "test",
		score: 0	
	}
	
	db.collection('users', function(err, collection) {
        collection.insert(users, {safe:true}, function(err, result) {});
    });
}*/
