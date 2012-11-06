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

var username;

/*exports.login = function(req,res){
		
	    db.collection('users', function(err, collection) {
        collection.find().toArray(function(err, items) {
       			for(var i=0;i<items.length;i++){
       				users={
       					username : items[i].username,
       					password : items[i].password
       				}
       			}
       			console.log(items)
           	 	res.send(items)
        
        });
    });
}*/

/*users = {
  account: function(){
  	 db.collection('users', function(err, collection) {
		  	 	
  	 });
  },

  account: {
		name: "prova"
  }
};

hash('foobar', function(err, salt, hash){
  if (err) throw err;
  // store the salt & hash in the "db"
  users.account.salt = salt;
  users.account.hash = hash;
  
  console.log(users.account)
});*/

exports.addUser = function(req,res){
	var pageParam = req.body;
    /*username = req.body.username;*/
	
	function insertInto(pageParam){
    db.collection('users', function(err, collection) {
		console.log(pageParam,"222222")
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
	
	hash(req.body.password, function(err, salt, hash){
		  pageParam.salt = salt;
		  pageParam.hash = hash;
		  insertInto(pageParam);
	})


	
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
  var user = accounts;
  var userMatched;
  db.collection('users', function(err, collection) {
      collection.findOne({'username':user}, function(err, item) {
          console.log(item, "ggggg")
          userMatched=item;
          console.log(" /n ",userMatched.hash, err)
		 // var user = users.account;
		
		  // query the db for the given username
		  if (!userMatched) return fn(new Error('cannot find user'));
		  // apply the same algorithm to the POSTed password, applying
		  // the hash against the pass / salt, if there is a match we
		  // found the user
		  hash(pass, userMatched.salt, function(err, hash){
		     
		    if (err) return fn(err);
		   
		    if (hash == userMatched.hash) return fn(null, user);
		    fn(new Error('invalid password'));
		  }) 
      });
  });  
  
    
    
    

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
