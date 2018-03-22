const colours = require('./colours');
var jwt = require('jwt-simple');
var moment = require('moment');
var config = require('./token-config');

exports.ensureAuthenticated = function(req, res, next) {
	if(!req.headers.authorization) {
	console.log("[LOG]: Missing authetication header");
	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress  + colours.Reset);
	console.log("");	
		return res
			.status(403)
			.send({message: "Missing authetication header"});
	}
	var token = req.headers.authorization.split(" ")[1];
	var payload = "";
	try {
		payload = jwt.decode(token, config.TOKEN_SECRET);
		if(payload.exp <= moment().unix()) {
			console.log("[LOG]: The token has expired");
			console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress  + colours.Reset);
			console.log("");
			return res
				.status(401)
				.send({message: "The token has expired"});
		}  
		req.user = payload.sub;
		next();
	} catch (err) {
		console.log("[LOG]: Invalid token");
		console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress  + colours.Reset);
		console.log("");
		res.status(401).send('Invalid token\n');
	}
}
