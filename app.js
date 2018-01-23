#!/usr/bin/env node

const Reset = "\x1b[0m"
const Bright = "\x1b[1m"
const Dim = "\x1b[2m"
const Underscore = "\x1b[4m"
const Blink = "\x1b[5m"
const Reverse = "\x1b[7m"
const Hidden = "\x1b[8m"

const FgBlack = "\x1b[30m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
const FgYellow = "\x1b[33m"
const FgBlue = "\x1b[34m"
const FgMagenta = "\x1b[35m"
const FgCyan = "\x1b[36m"
const FgWhite = "\x1b[37m"

const BgBlack = "\x1b[40m"
const BgRed = "\x1b[41m"
const BgGreen = "\x1b[42m"
const BgYellow = "\x1b[43m"
const BgBlue = "\x1b[44m"
const BgMagenta = "\x1b[45m"
const BgCyan = "\x1b[46m"
const BgWhite = "\x1b[47m"

// Retorna un número aleatorio entre min (incluido) y max (excluido)
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
//**********************************************************

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
var fs = require('fs');
const hostname = '127.0.0.1';
const port = 3000;
var dateFormat = require('dateformat');

/* GET home page. */
app.get('/', function(req, res, next) {
    var json = {};
    json.message = "PHANTOM Repository server is up and running."
    json.release = req.app.get('version');
    json.versions = [ 'v1' ];
    json.current_time = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
    res.json(json);
});

// default options
app.use(fileUpload());

"use strict";
app.get('/download', function(req, res) {
	var fs = require('fs');
	var path = require('path');
	var myPath = "";
	var mydebug = req.query.debug;
	var exp = req.query.experiment;
	var user = req.query.user;
	var filename= req.query.filename;
        var dir = "";
        var respuesta  = "";
        if (exp != undefined){
                dir = exp ;
                respuesta = 'Experiment is '+exp;
        }else{
		return res.status(400).send("\n400: Bad Request, missing exp_id.\n");
        }

        if (user != undefined){
                dir = exp ;
                respuesta = 'User_id is '+exp;
        }else{
                return res.status(400).send("\n400: Bad Request, missing user_id.\n");
        }
        if (filename != undefined){
                dir = exp ;
                respuesta = 'Filename is '+exp;
        }else{
                return res.status(400).send("\n400: Bad Request, missing filename.\n");
        }
	if (mydebug == undefined){
		mydebug="false";
	}
	myPath = '/home/jmontana/phantom_repository/';
	myPath += user+'/'+ exp + '/' + filename;
	
        console.log("LOG: DOWNLOADING FILE");
        console.log("   " +FgYellow + Bright + "Experiment: " + Reset + exp);
        console.log("   " +FgYellow + Bright + "   User_id: " + Reset + user);
        console.log("   " +FgYellow + Bright + "  Filename: " + Reset + filename );
        console.log(" ");

	var respuesta = FgYellow + Bright + 'User is: '+Reset +user + '\n';
	respuesta += FgYellow + Bright + 'Experiment is '+Reset +exp + '\n';
	respuesta += FgYellow + Bright + 'Filename is '+Reset + filename + '\n';

        if ( mydebug.localeCompare("true")==0  ){//strings equal, in other case returns the order of sorting
                res.send('\n' + respuesta +  FgYellow + Bright + 'File uploaded at path: '+ Reset +myPath+ '\n\n');
        }else if ( mydebug.localeCompare("TRUE")==0  ){//strings equal, in other case returns the order of sorting
                res.send('\n' + respuesta +  FgYellow + Bright + 'File uploaded at path: '+ Reset +myPath+ '\n\n');
        }

    var resolvedBase = path.resolve(myPath);
    var stream = fs.createReadStream(resolvedBase);
    // Handle non-existent file
    stream.on('error', function(error) {
	    
            res.writeHead(404, 'Not Found');
	    res.write('file loc is '+myPath+'\n');
            res.write('404: File Not Found!');
            res.end();
    });
    // File exists, stream it to user
    res.statusCode = 200;
    stream.pipe(res);
});
 
app.post('/upload', function(req, res) {
	"use strict";
	var mydebug = "false";
	var fecha = Date.now();
	var number =  Math.round(getRandomArbitrary(0, 999));
	var new_exp = number.toString() + fecha.toString();
	var new_user =  Math.round(getRandomArbitrary(0, 999)) + fecha.toString();
	var mypath = '/home/jmontana/phantom_repository/';
	if (!req.files)
		return res.status(400).send('No files were uploaded.');
	var direxp = "";
	var exp = "";
	var diruser = "";
	var user = "";
	var respuesta  = "";
	var filename ="";

try{
        if (req.body.debug != undefined){
                mydebug = req.body.debug ;
        }else{
                mydebug = req.query.debug ;
                if(mydebug== undefined){  //if defined as ? parameter
			mydebug="false";
                }
        }
}catch(e){
                mydebug = req.query.debug ;
                if(mydebug== undefined){  //if defined as ? parameter
			mydebug="false";
        }
}

try{	
	if (req.body.experiment != undefined){
		exp = req.body.experiment ;
		direxp = exp ;
		respuesta = FgYellow + Bright + 'Experiment is '+Reset +exp + '\n';
	}else{
		exp = req.query.experiment ;
		if(exp!= undefined){  //if defined as ? parameter
			direxp = exp ;
			respuesta = FgYellow + Bright + 'Experiment is '+Reset +exp + '\n';
		}else{
			direxp = new_exp ; 
			exp = new_exp;
			respuesta = FgYellow + Bright + 'Not defined Experiment, new random exp_id: '+Reset + new_exp + '\n';
		}
	}
}catch(e){
                exp = req.query.experiment ;
                if(exp!= undefined){  //if defined as ? parameter
                        direxp = exp ;
                        respuesta = FgYellow + Bright + 'Experiment is '+Reset +exp + '\n';
                }else{
                        direxp = new_exp ;
                        exp = new_exp;
                        respuesta = FgYellow + Bright + 'Not defined Experiment, new random exp_id: '+Reset + new_exp + '\n';
                }
}


try{
        if (req.body.user != undefined){ //if defined as -F parameter
                user = req.body.user ;
                diruser = user ;
                respuesta += FgYellow + Bright + 'User_id is: '+ Reset+ user + '\n';
        }else{
		user = req.query.user;
        	if (user != undefined){  //if defined as ? parameter
	                diruser = user ;
                	respuesta += FgYellow + Bright + 'User is: '+Reset +user + '\n';
       		}else{
        		diruser = new_user ;
			user= new_user;
                	respuesta += FgYellow + Bright + 'Not defined User, new random user_id: '+Reset +new_user + '\n';
		}
        }
}catch(e){
                user = req.query.user;
                if (user != undefined){  //if defined as ? parameter
                        diruser = user ;
                        respuesta += FgYellow + Bright + 'User is: '+Reset +user + '\n';
                }else{
                        diruser = new_user ;
                        user= new_user;
                        respuesta += FgYellow + Bright + 'Not defined User, new random user_id: '+Reset +new_user + '\n';
                }


}
try{
        if (req.body.filename != undefined){ //if defined as -F parameter
                filename = req.body.filename ;
                respuesta += FgYellow + Bright + 'Filename is: '+ Reset+ filename + '\n';
        }else{
                filename = req.query.filename;
                if (filename != undefined){  //if defined as ? parameter
                        respuesta += FgYellow + Bright + 'Filename is: '+Reset +filename+ '\n';
                }else{
			return res.status(400).send("\n400: Bad Request, missing filename.\n");
                }
        }
}catch(e){


                filename = req.query.filename;
                if (filename != undefined){  //if defined as ? parameter
                        respuesta += FgYellow + Bright + 'Filename is: '+Reset +filename+ '\n';
                }else{
                        return res.status(400).send("\n400: Bad Request, missing filename.\n");
                }

}
	if (!fs.existsSync(mypath+diruser)){
		fs.mkdirSync(mypath+diruser);
	}
        if (!fs.existsSync(mypath+diruser+'/'+direxp)){
                fs.mkdirSync(mypath+diruser+'/'+direxp);
        }
	var dir = diruser + '/' + direxp + '/';

	// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
	let sampleFile = req.files.sampleFile;
	//let filename = '/home/jmontana/new_nodejs/jojo.txt'; 
	console.log("LOG: UPLOADING FILE");
	console.log("   " +FgYellow + Bright + "Experiment: " + Reset + exp);
	console.log("   " +FgYellow + Bright + "   User_id: " + Reset + user);
	console.log("   " +FgYellow + Bright + "  Filename: " + Reset + filename );
	console.log("   " +FgYellow + Bright + "     Debug: " + Reset + mydebug);
	console.log(" ");	
	// Use the mv() method to place the file somewhere on your server
	//sampleFile.mv('/home/jmontana/new_nodejs/', function(err) {
	sampleFile.mv( mypath + dir + filename, function(err) {
		if (err)
			return res.status(500).send(err);
	});

	if ( mydebug.localeCompare("true")==0  ){//strings equal, in other case returns the order of sorting
		res.send('\n' + respuesta +  FgYellow + Bright + 'File uploaded at path: '+ Reset +mypath+ '\n\n');
	}else if ( mydebug.localeCompare("TRUE")==0  ){//strings equal, in other case returns the order of sorting
                res.send('\n' + respuesta +  FgYellow + Bright + 'File uploaded at path: '+ Reset +mypath+ '\n\n');
        }else{
		res.send(exp);
	}
});

app.listen(8000);

