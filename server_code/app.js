#!/usr/bin/env node
// Author: J.M.Montañana HLRS 2018
//   If you find any bug, please notify to hpcjmont@hlrs.de

// Copyright (C) 2018 University of Stuttgart
// 
//     Licensed under the Apache License, Version 2.0 (the "License");
//     you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//  
//       http://www.apache.org/licenses/LICENSE-2.0
//  
//     Unless required by applicable law or agreed to in writing, software
//     distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
//     limitations under the License.

const colours = require('./colours');
const MetadataModule = require('./support-metadata'); 
const UsersModule = require('./support-usersaccounts');
const LogsModule = require('./support-logs');

const supportmkdir = require('./mkdirfullpath'); 
	//privides the function register_json;
const express = require('express');
//     ipfilter = require('express-ipfilter').IpFilter;
const ips = ['::ffff:127.0.0.1','127.0.0.1'];
const app = express();
const fileUpload = require('express-fileupload');
var fs = require('fs'); 
var dateFormat = require('dateformat');

var es_servername = 'localhost';
var es_port = '9400';
const os = require('os'); 
const File_Server_Path = '/phantom_servers/phantom_repository'; // this will be allocated in the home folder of the user running nodejs !! os.homedir()+File_Server_Path

//const queryString = require('query-string');
//**********************************************************
var bodyParser = require('body-parser');
var cors = require('cors');
var auth = require('./token-auth');
var middleware = require('./token-middleware');
//***********************************************************

var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

//**********************************************************
// Retorna un número aleatorio entre min (incluido) y max (excluido)
function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}
	
function componse_query(filepath, filename){
	if ((filepath.length > 0) && (filename.length > 0)) {
		query= { query: { bool: { must: [ { match: { "path": filepath } } , { match: { "filename" : filename } } ] } } };
	}else if (filepath.length > 0){
		query= { query: { bool: { must: [ { match: { "path": filepath } } ] } } };
	}else if (filename.length > 0){
		query= { query: { bool: { must: [ { match: { "filename" : filename } } ] } } };
	}else {
		query= { query: { "match_all": {} }};
	} 
	return query;
}

function find_param_pretty(req){	
	var pretty ="";
	//parameter pretty 
	try{
		if (req.body.pretty != undefined){ //if defined as -F parameter
			pretty = req.body.pretty ;
		}else{
			pretty = req.query.pretty;
			if (pretty == undefined){ //if defined as ? parameter
				pretty="";
			}
		}
	}catch(e){
		pretty = req.query.pretty;
		if (pretty == undefined){ //if defined as ? parameter
			pretty="";
		}
	} 
	return pretty;
}

function find_param_filepath(req){	
	var filepath ="";
	//parameter path 
	try{
		if (req.body.Path != undefined){ //if defined as -F parameter
			filepath = req.body.Path ;
		}else{
			filepath = req.query.Path;
			if (filepath == undefined){ //if defined as ? parameter
				filepath="";
			}
		}
	}catch(e){
		filepath = req.query.Path;
		if (filepath == undefined){ //if defined as ? parameter
			filepath="";
		}
	} 
	return filepath;
}

function find_param_filename(req){	
	var filename ="";
	//parameter filename 
	try{
		if (req.body.filename != undefined){ //if defined as -F parameter
			filename = req.body.filename ;
		}else{
			filename = req.query.filename;
			if (filename == undefined){ //if defined as ? parameter
				filename="";
			}
		}
	}catch(e){
		filename = req.query.filename;
		if (filename == undefined){ //if defined as ? parameter
			filename="";
		}
	} 
	return filename;
} 

function find_param_email(req){
	var email="";		//parameter email 
	try{
		if (req.body.email != undefined){ //if defined as -F parameter
			email = req.body.email;
		}else{
			email = req.query.email; //if defined as ? parameter 
		}
	}catch(e){
		email = req.query.email;//if defined as ? parameter
	} 
	return email;
}

function find_param_pw(req){
	var pw="";		//parameter pw 
	try{
		if (req.body.pw != undefined){ //if defined as -F parameter
			pw = req.body.pw ;
		}else{
			pw = req.query.pw; //if defined as ? parameter 
		}
	}catch(e){
		pw = req.query.pw; //if defined as ? parameter
	} 
	return pw;
} 

function find_param_QueryBody(req){
	var QueryBody="";
	//parameter QueryBody 
	try{
		if (req.body.QueryBody != undefined){ //if defined as -F parameter
			QueryBody = req.body.QueryBody ;
		}else{
			QueryBody = req.query.QueryBody;
			if (QueryBody == undefined){ //if defined as ? parameter
				QueryBody="";
			}
		}
	}catch(e){
		QueryBody = req.query.QueryBody;
		if (QueryBody == undefined){ //if defined as ? parameter
			QueryBody="";
		}
	} 
	return QueryBody;
}
//**********************************************************
// Configuramos Express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use(fileUpload());

//**********************************************************
// Path only accesible when Authenticated
app.get('/private',middleware.ensureAuthenticated, function(req, res) {
	var message = "\n\nAccess to restricted content !!!.\n\n"
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end(message, 'utf-8');
});
//**********************************************************
/* GET home page. */
app.get('/', function(req, res, next) {	
	var json = {};
	json.message = "PHANTOM Repository server is up and running."
	json.release = req.app.get('version');
	json.versions = [ 'v1' ];
	json.current_time = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	res.json(json);
});
//**********************************************************
app.get('/upload_file.html', function(req, res) {
	var fs = require('fs');
	var path = require('path');
	var filePath = '~/repository/upload_file.html';
	var extname = path.extname(filePath);
	var contentType = 'text/html';
// 	switch (extname) {
// 		case '.js':
// 			contentType = 'text/javascript';
// 			break;
// 		case '.css':
// 			contentType = 'text/css';
// 			break;
// 		case '.json':
// 			contentType = 'application/json';
// 			break;
// 		case '.png':
// 			contentType = 'image/png';
// 			break;
// 		case '.jpg':
// 			contentType = 'image/jpg';
// 			break;
// 		case '.wav':
// 			contentType = 'audio/wav';
// 			break;
// 	}
	fs.readFile(filePath, function(error, content) {
		if (error) {
			if(error.code == 'ENOENT'){
				fs.readFile('./404.html', function(error, content) {
					res.writeHead(404, { 'Content-Type': contentType });
					res.end(content, 'utf-8');
				});
			} else {
				res.writeHead(500);
				res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
				res.end(); 
			}
		} else {
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content, 'utf-8');
		}
	});
});

//*******************************
app.get('/download_file.html', function(req, res) {
	var fs = require('fs');
	var path = require('path');
	var filePath = 'web/download_file.html';
	var extname = path.extname(filePath);
	var contentType = 'text/html'; 
	fs.readFile(filePath, function(error, content) {
		if (error) {
			if(error.code == 'ENOENT'){
				fs.readFile('./404.html', function(error, content) {
					res.writeHead(200, { 'Content-Type': contentType });
					res.end(content, 'utf-8');
				});
			} else {
				res.writeHead(500);
				res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
				res.end(); 
			}
		} else {
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content, 'utf-8');
		}
	});
});
//*******************************
app.get('/examplec.json', function(req, res) {
	var fs = require('fs');
	var path = require('path');
	var filePath = 'web/examplec.json';
	var extname = path.extname(filePath);
	var contentType = 'text/html'; 
	fs.readFile(filePath, function(error, content) {
		if (error) {
			if(error.code == 'ENOENT'){
				fs.readFile('./404.html', function(error, content) {
					res.writeHead(200, { 'Content-Type': contentType });
					res.end(content, 'utf-8');
				});
			} else {
				res.writeHead(500);
				res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
				res.end(); 
			}
		} else {
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content, 'utf-8');
		}
	});
});

//*******************************
app.get('/query_metadata.html', function(req, res) {
	var fs = require('fs');
	var path = require('path');
	var filePath = 'web/query_metadata.html';
	var extname = path.extname(filePath);
	var contentType = 'text/html'; 
	fs.readFile(filePath, function(error, content) {
		if (error) {
			if(error.code == 'ENOENT'){
				fs.readFile('./404.html', function(error, content) {
					res.writeHead(200, { 'Content-Type': contentType });
					res.end(content, 'utf-8');
				});
			} else {
				res.writeHead(500);
				res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
				res.end(); 
			}
		} else {
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content, 'utf-8');
		}
	});
});
//**********************************************************
app.get('/verify_es_connection', function(req, res) {	
	var testhttp = require('http');
	var contentType = 'text/plain'; 
	testhttp.get('http://'+es_servername+':'+es_port+'/', function(rescode) {
// 		console.log("statusCode: ", rescode.statusCode); // <======= Here's the status code
	// 	console.log("headers: ", rescode.headers);
// 		rescode.on('data', function(d) {
// 			process.stdout.write(d);
// 		});
// 		var int_code= parseInt( rescode.statusCode, 10 ); 
		res.writeHead(rescode.statusCode, { 'Content-Type': contentType });
		res.end(""+rescode.statusCode, 'utf-8');
	}).on('error', function(e) {
		console.error(e);
		res.writeHead(000, { 'Content-Type': contentType });
		res.end("000", 'utf-8');		
	});

});
/* 
		'"tokens":{' +
			'"properties": {' +
				'"user_id": {' +
					'"type": "string"' +
				'},' +
				'"currenttime": {' +
					'"type": "string"' +
				'},' +
				'"expirationtime": {' +
					'"type": "string"' +
				'}' +
			'}' +
		'}' +
'}' +
'}';*/

//**********************************************************
app.get('/drop_db', function(req, res) {
	"use strict";
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	console.log("\n[LOG]: Deleting Database"); 
	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
	if(( req.connection.remoteAddress!= '127.0.0.1' ) &&( req.connection.remoteAddress!='::ffff:127.0.0.1')){
		console.log(" ACCESS DENIED from IP address: "+req.connection.remoteAddress);
		res.writeHead(403, {"Content-Type": "text/plain"});
		res.end("\n403: FORBIDDEN access from external IP.\n");		
		var messagea = "Deleting Database FORBIDDEN access from external IP.";
		LogsModule.register_log( 403,req.connection.remoteAddress,messagea,currentdate,""); 
		return ;
	}	
	var resultFind=""; 
	var searching = MetadataModule.drop_db( );
	searching.then((resultFind) => { 
		deleteFolderRecursive (os.homedir()+File_Server_Path) ;
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n"); 
// 		LogsModule.register_log(200,req.connection.remoteAddress,resultFind,currentdate); //we can not register nothing after delete the DB !!!
	},(resultReject)=> {
		console.log("log: Bad Request: " + resultReject); 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: Bad Request "+resultReject+"\n"); 
		LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultReject,currentdate,"");
	} );
});
//**********************************************************
app.get('/new_db', function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
// 	console.log("\n[LOG]: New Database"); 
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
// 	console.log("");
	var metadatamapping = {
			"metadata": {
				"properties": {
					"path": {
						"type": "string",
						"index": "not_analyzed"
					},
					"path_length": { 
						"type": "short"
					},
					"filename": {
						"type": "string",
						"index": "not_analyzed"
					},
					"filename_length": { 
						"type": "short"
					}
				} 
			}
		}
	var usersmapping = {			 
			"users": {
				"properties": {
					"email": {
					"type": "string"
					},
					"email_length": {
					"type": "short"
					},
					"password": {
					"type": "string",
					"index": "not_analyzed"
					},
					"password_length": {
					"type": "short"
					}
				}
			}
		}
	var tokensmapping = { 
			"tokens":{
				"properties": {
					"user_id": {
						"type": "string"
					},
					"generationtime": {
						"type": "date",
						"store": "yes",
						"format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
						"index": "analyzed"
					},
					"expirationtime": {
						"type": "date",
						"store": "yes",
						"format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
						"index": "analyzed"
					}
				}
			}
		} 
	var logsmapping = { 
			"logs":{
				"properties": {
					"code": {
						"type": "string"
					},
					"ip": {
						"type": "string"
					},
					"message": {
						"type": "string"
					},
					"date": { 
						"type": "date",
						"store": "yes",
						"format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
						"index": "analyzed"
					}
				}
			}
		} 
	var resultFind=""; 
	var searching = MetadataModule.new_db( );
	searching.then((resultFind) => {		
		var searchingb = MetadataModule.new_mapping( "metadata", metadatamapping);
		searching.then((resultFindb) => {
			var searchingc = MetadataModule.new_mapping( "users", usersmapping);
			searching.then((resultFindc) => {
				var searchingd = MetadataModule.new_mapping( "tokens", tokensmapping);
				searching.then((resultFindd) => { 
					var searchinge = MetadataModule.new_mapping( "logs", logsmapping);
					searching.then((resultFinde) => {  
						res.writeHead(200, {"Content-Type": "application/json"});
						res.end(resultFinde+"\n"); 
						LogsModule.register_log( 200,req.connection.remoteAddress,"DB successfully created",currentdate,""); 
					},(resultRejecte)=> {
// 						console.log("log: Bad Request: " + resultRejectd); 
						res.writeHead(400, {"Content-Type": "text/plain"});
						res.end("\n400: Bad Request "+resultRejecte+"\n");
						LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultRejectd,currentdate,"");
					} ); 
				},(resultRejectd)=> {
// 					console.log("log: Bad Request: " + resultRejectd); 
					res.writeHead(400, {"Content-Type": "text/plain"});
					res.end("\n400: Bad Request "+resultRejectd+"\n");
					LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultRejectd,currentdate,"");
				} ); 
			},(resultRejectc)=> {
// 				console.log("log: Bad Request: " + resultRejectc); 
				res.writeHead(400, {"Content-Type": "text/plain"});
				res.end("\n400: Bad Request "+resultRejectc+"\n");
				LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultRejectc,currentdate,"");
			} ); 
		},(resultRejectb)=> {
// 			console.log("log: Bad Request: " + resultRejectb); 
			res.writeHead(400, {"Content-Type": "text/plain"});
			res.end("\n400: Bad Request "+resultRejectb+"\n");
			LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultRejectb,currentdate,"");
		} );
	},(resultReject)=> {
// 		console.log("log: Bad Request: " + resultReject); 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: Bad Request "+resultReject+"\n");
		LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultReject,currentdate,"");
	} );
});

//**********************************************************
app.get('/_flush', function(req, res) {
	var testhttp = require('http');
	var contentType = 'text/plain';
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	testhttp.get('http://'+es_servername+':'+es_port+'/repository_db/_flush', function(rescode) {
// 		console.log("statusCode: ", rescode.statusCode); // <======= Here's the status code
// 		console.log("headers: ", rescode.headers);
// 		rescode.on('data', function(d) {
// 			process.stdout.write(d);
// 		}); 
		res.writeHead(rescode.statusCode, { 'Content-Type': contentType });
		res.end("200", 'utf-8');
	}).on('error', function(e) {
// 		console.error(e);
		res.writeHead(400, { 'Content-Type': contentType });
		res.end("400", 'utf-8');
		LogsModule.register_log( 400,req.connection.remoteAddress,"Flush error "+e,currentdate,"");
	});
});
//**********************************************************
app.get('/download',middleware.ensureAuthenticated, function(req, res) {
	var fs = require('fs');
	var path = require('path');
	var myPath = "";
	var mydebug = req.query.debug; 
	var filepath= req.query.filepath;
	var filename= req.query.filename;
	var dir = "";
	var contentType = 'text/plain';
	var ResponseDebug = "";
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var message_no_path = "DOWNLOAD Bad Request missing filepath"; 
	if (filepath != undefined) {
		ResponseDebug = 'filepath is '+filepath;
		if(filepath.charAt(0) === '"') {
			filepath = filepath.substr(1);
		}
		if(filepath.length>0){
		if(filepath.charAt(filepath.length-1) === '"') {
			filepath = filepath.substring(0, filepath.length - 1); 
		}}
		if (filepath.length == 0){ 
			res.writeHead(400, { 'Content-Type': contentType });
			res.end("\n400: Bad Request, missing filepath.\n"); 
			LogsModule.register_log( 400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
			return ;
		}
	}else{
		res.writeHead(400, { 'Content-Type': contentType });
		res.end("\n400: Bad Request, missing filepath.\n");
		LogsModule.register_log( 400,req.connection.remoteAddress,message_no_path,currentdate,res.user);
		return ;
	} 
	
	var message_no_file = "DOWNLOAD Bad Request missing filename"; 
	if (filename != undefined){ 
		ResponseDebug = 'Filename is '+filename;
		if(filename.charAt(0) === '"') {
		filename = filename.substr(1);
		}
		if(filename.length>0){
		if(filename.charAt(filename.length-1) === '"') {
			filename = filename.substring(0, filename.length - 1); 
		}}		
		if (filename.length == 0){ 
			res.writeHead(400, { 'Content-Type': contentType });
			res.end("\n400: Bad Request, missing filename.\n");
			LogsModule.register_log( 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
			return ;
		}		
	}else{
		res.writeHead(400, { 'Content-Type': contentType });
		res.end("\n400: Bad Request, missing filename.\n");
		LogsModule.register_log( 400,req.connection.remoteAddress,message_no_file,currentdate,res.user); //TODO podemos poner el "user" del token !!
		return ;
	}
	
	if (mydebug == undefined){
		mydebug="false";
	}
		
	myPath = os.homedir()+ File_Server_Path + '/' + filepath + '/' + filename;
// 	console.log("\n[LOG]: DOWNLOADING FILE");
// 	console.log("   " +colours.FgYellow + colours.Bright + "Path: " + colours.Reset + filepath); 
// 	console.log("   " +colours.FgYellow + colours.Bright + "  Filename: " + colours.Reset + filename);
// 	console.log("   " +colours.FgYellow + colours.Bright + " requested from IP:" + req.connection.remoteAddress + colours.Reset); 
	var returncode=200;
	// Check if file specified by the filePath exists 
	fs.exists(myPath, function(exists){
		if (exists) { 
			// Content-type is very interesting part that guarantee that
			// Web browser will handle response in an appropriate manner.
			//fs.createReadStream(myPath).pipe(response);
			var resolvedBase = path.resolve(myPath);
			var stream = fs.createReadStream(resolvedBase);
			//stream.setEncoding('UTF8');
			// Handle non-existent file
			stream.on('error', function(error) {
				returncode=404; 
			});
			// File exists, stream it to user
			if(returncode==200){
				res.writeHead(200, {
					"Content-Type": "application/octet-stream",
					"Content-Disposition": "attachment; filename=" + filename
				}); 
				stream.pipe(res);
				LogsModule.register_log( 200,req.connection.remoteAddress,"DONWLOAD granted to file: "+myPath,currentdate,res.user);
			}
// 			if ( (mydebug.localeCompare("true")==0) || (mydebug.localeCompare("TRUE")==0) ){//strings equal, in other case returns the order of sorting
// 				console.log(colours.FgYellow + colours.Bright + '     File Downloaded at path: '+ colours.Reset +myPath+ '\n\n');
// 			}
		} else {
			returncode=404; 
		} 
	});
	if(returncode!=200){ 
		//res.setHeader(name.value); //only before writeHeader
		//res.writeHead(404, 'Not Found'); //can call only once;
		//res.write('file loc is '+myPath+'\n');
		//res.write('404: File Not Found!'); 
		res.writeHead(404, {"Content-Type": "text/plain"});
		res.write("\n404: Bad Request, file not found.\n");
		res.end("ERROR File does not exist"+filename+ " "+ filepath+" "+"\n");	
		LogsModule.register_log(404,req.connection.remoteAddress,"DOWNLOAD error: File not found: "+filepath+filename,currentdate,res.user);
	}
});
//**********************************************************
// app.get('/get_metadata', function(req, res) { 
// 	"use strict";
// 	var ResponseDebug = ""; 
// 	var RawJSON=""; 
//	var filepath=find_param_filepath(req);
//	var filename= find_param_filename(req); 
//	var pretty = find_param_pretty(req);
// 	console.log("LOG: RETRIEVE METADATA");
// 	console.log("   " +colours.FgYellow + colours.Bright + "Path: " + colours.Reset + filepath); 
// 	console.log("   " +colours.FgYellow + colours.Bright + " Uploaded Filename: " + colours.Reset + filename );  
// 	var resultCount="";
// 	var resultFind=""; 
// 	var bodyquery= componse_query(filepath, filename); 
// 	var countfiles= MetadataModule.count_file(bodyquery);
// 	//1.- count files
// 	countfiles.then((resultCount) => {
// 		// succesMessage es lo que sea que pasamos en la función resolve(...) de arriba.
// 		// No tiene por qué ser un string, pero si solo es un mensaje de éxito, probablemente lo sea.
// 		console.log("counted files: " + resultCount);
// 		if (resultCount>0){
// 			//1.1- find id of the existing doc for such path filename 
// 			var bodyquery= componse_query(filepath, filename);
// 			var searching = MetadataModule.get_metadata(bodyquery,pretty);
// 			searching.then((resultFind) => {
// 				console.log("searching ...:\n"+resultFind); 
// 				res.writeHead(400, {"Content-Type": "text/plain"});
// 				res.end(resultFind+"\n");
// 			});
// 		}else{
// 			//1.2- Not existing doc,
// 			console.log("Not found file :" +filename+" on path :"+filepath);
// 			res.writeHead(400, {"Content-Type": "text/plain"});
// 			res.end("ERROR Not found Metadata\n");
// 		}
// 	});
// });
//**********************************************************
app.get('/query_metadata',middleware.ensureAuthenticated, function(req, res) { 
	"use strict";
	var ResponseDebug = "";
	var filename =find_param_filename(req);
	var RawJSON="";
	var filepath =find_param_filepath(req);
	var pretty = find_param_pretty(req);
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	if (filepath != undefined) { 
		if(filepath.charAt(0) === '"') {
		filepath = filepath.substr(1);
		}
		if(filepath.length>0){
		if(filepath.charAt(filepath.length-1) === '"') {
		filepath = filepath.substring(0, filepath.length - 1); 
		}} 
	} 
	
	if (filename != undefined){  
		if(filename.charAt(0) === '"') {
			filename = filename.substr(1);
		}
		if(filename.length>0){
		if(filename.charAt(filename.length-1) === '"') {
			filename = filename.substring(0, filename.length - 1); 
		}}	 
	}
// 	console.log("\n[LOG]: QUERY METADATA");
// 	console.log("   " +colours.FgYellow + colours.Bright + "Path: " + colours.Reset + filepath); 
// 	console.log("   " +colours.FgYellow + colours.Bright + " Filename: " + colours.Reset + filename );
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
// 	console.log("");
	var resultFind=""; 
	var query= componse_query(filepath, filename);

	//1.1- find id of the existing doc for such path filename
	var searching = MetadataModule.query_metadata( query, pretty);
	searching.then((resultFind) => {
		//console.log("searching ...:\n"+resultFind); 
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n");
		LogsModule.register_log(200,req.connection.remoteAddress,"QUERY METADATA granted to query:" +JSON.stringify(query),currentdate,res.user);
	},(resultReject)=> {
// 		console.log("log: Bad Request: " + resultReject); 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("Bad Request "+resultReject.text+"\n");
		LogsModule.register_log(400,req.connection.remoteAddress,"QUERY METADATA BAD Request on query:" +JSON.stringify(query),currentdate,res.user); 
	}); 
});
//**********************************************************
app.get('/es_query_metadata', middleware.ensureAuthenticated, function(req, res) { 
	"use strict"; 
		var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 		
	var QueryBody =find_param_QueryBody(req);
	var pretty = find_param_pretty(req);
// 	console.log("\n[LOG]: ES-QUERY METADATA");
	var mybody_obj = JSON.parse( QueryBody); 
// 	console.log("   " +colours.FgYellow + colours.Bright + "Query: " + colours.Reset + JSON.stringify(mybody_obj) );
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
// 	console.log("");	 
	var resultFind="";
	//1.1- find id of the existing doc for such path filename JSON.stringify(
	var searching = MetadataModule.query_metadata( mybody_obj, pretty); //.replace(/\//g, '\\/');
	searching.then((resultFind) => {
		//console.log("searching ...:\n"+resultFind); 
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n");
		LogsModule.register_log(200,req.connection.remoteAddress,"ES-QUERY METADATA granted to query:" +JSON.stringify(query),currentdate,res.user);
	},(resultReject)=> {
// 		console.log("log: Bad Request: " + resultReject); 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("Bad Request "+resultReject.text+"\n");
		LogsModule.register_log(400,req.connection.remoteAddress,"ES-QUERY METADATA BAD Request on query:" +JSON.stringify(query),currentdate,res.user); 
	}); 
}); 
//**********************************************************

//TODO: falta confirmar que los archivos existen
app.post('/upload',middleware.ensureAuthenticated, function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var contentType = 'text/plain';
	var mydebug = "false";
	if (!req.files){
		res.writeHead(400, { 'Content-Type': contentType });
		res.end('No files were uploaded.');  
		console.log('No files were uploaded.');
		LogsModule.register_log( 400,req.connection.remoteAddress,'No files were uploaded.',currentdate,res.user);
		return;
	}
	var ResponseDebug = "";
	var DestFileName ="";
	var DestPath ="";
	var RawJSON="";
	//parameter DEBUG
	try{
		if (req.body.debug != undefined){
			mydebug = req.body.debug ;
		}else{
			mydebug = req.query.debug ;
			if(mydebug== undefined){ //if defined as ? parameter
				mydebug="false";
			}
		}
	}catch(e){
		mydebug = req.query.debug ;
		if(mydebug== undefined){ //if defined as ? parameter
			mydebug="false";
		}
	}

	//parameter RAW JSON
	try{
		if (req.body.RawJSON != undefined){ //if defined as -F parameter
			RawJSON = req.body.RawJSON;
		}else{
			RawJSON = req.query.RawJSON; 
		}
	}catch(e){
		RawJSON = req.query.RawJSON; 
	}

	var message_no_path = "UPLOAD Bad Request missing Path";
	//parameter path 
	try{
		if (req.body.Path != undefined){ //if defined as -F parameter
			DestPath = req.body.Path ;
		}else{
			DestPath = req.query.Path;
			if (DestPath == undefined){ //if defined as ? parameter
				ResponseDebug = colours.FgYellow + colours.Bright + 'Error: missing Path '+Reset + '\n'; 
				res.writeHead(400, { 'Content-Type': contentType });
				res.end("400:Bad Request, missing Path.\n");
				LogsModule.register_log( 400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
				return;				
			}
		}
	}catch(e){
		DestPath = req.query.Path;
		if (DestPath == undefined){ //if defined as ? parameter
			ResponseDebug = colours.FgYellow + colours.Bright + 'Error: missing Path '+Reset + '\n';
			res.writeHead(400, { 'Content-Type': contentType });
			res.end("400:Bad Request, missing Path.\n");
			LogsModule.register_log( 400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
			return;			
		}
	} 

	var message_no_file = "UPLOAD Bad Request missing DestFileName";
	//parameter DestFileName
	try{
		if (req.body.DestFileName != undefined){ //if defined as -F parameter
			DestFileName = req.body.DestFileName ;
			ResponseDebug += colours.FgYellow + colours.Bright + 'Filename is: '+ colours.Reset+ DestFileName + '\n';
		}else{
			DestFileName = req.query.DestFileName;
			if (DestFileName != undefined){ //if defined as ? parameter
				ResponseDebug += colours.FgYellow + colours.Bright + 'Filename is: '+Reset +DestFileName+ '\n';
			}else{
				res.writeHead(400, { 'Content-Type': contentType });
				res.end("400:Bad Request, missing DestFileName.\n");
				LogsModule.register_log( 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
				return;
			}
		}
	}catch(e){
		DestFileName = req.query.DestFileName;
		if (DestFileName != undefined){ //if defined as ? parameter
			ResponseDebug += colours.FgYellow + colours.Bright + 'Filename is: '+colours.Reset +DestFileName+ '\n';
		}else{
			res.writeHead(400, { 'Content-Type': contentType });
			res.end("400:Bad Request, missing DestFileName.\n");
			LogsModule.register_log( 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
			return;
		}
	}

	// The name of the input field (i.e. "UploadFile") is used to retrieve the uploaded file
	let UploadFile = req.files.UploadFile;
	// report LOGS on server console
// 	console.log("\n[LOG]: UPLOADING FILE");
// 	console.log("   " +colours.FgYellow + colours.Bright + "Path: " + colours.Reset + DestPath); 
// 	console.log("   " +colours.FgYellow + colours.Bright + "  Uploaded Filename: " + colours.Reset + DestFileName );
// 	console.log("   " +colours.FgYellow + colours.Bright + "     Debug: " + colours.Reset + mydebug);
// 	if (RawJSON != undefined){ 
// 		console.log("   " +colours.FgYellow + colours.Bright + "   RawJSON: " + colours.Reset + RawJSON);
// 	}else{
// 		console.log("   " +colours.FgYellow + colours.Bright + "   RawJSON: " + colours.Reset + 'Doesn\'t provided a Json as param.');
// 	}
	var JSONstring="";
	if (req.files.UploadJSON != undefined){ 
// 		console.log("   " +colours.FgYellow + colours.Bright + "JSON as file: " + colours.Reset );
// 		console.log(req.files.UploadJSON.data.toString('utf8'));
		JSONstring=req.files.UploadJSON.data.toString('utf8');
// 	}else{
// 		console.log("   " +colours.FgYellow + colours.Bright + "JSON as file: " + colours.Reset + 'Doesn\'t provided a Json as file.');
	}
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
// 	console.log("");	

	var resultCount="";
	var resultFind="";
	var resultDelete=""; 
	var bodyquery= componse_query(DestPath, DestFileName);
	var countfiles= MetadataModule.count_file(bodyquery);	
	//1.- count files
	countfiles.then((resultCount) => {
		// succesMessage es lo que sea que pasamos en la función resolve(...) de arriba.
		// No tiene por qué ser un string, pero si solo es un mensaje de éxito, probablemente lo sea.
// 		console.log("counted files: " + resultCount);
		if (resultCount>0){
			//1.1- find id of the existing doc for such path filename
			var searching = MetadataModule.find_file(DestPath,DestFileName);
			searching.then((resultFind) => {
				//console.log("searching ...:\n"+resultFind); //only for debug purposes
				//1.1.1- update existing json
				if (RawJSON != undefined){
					var result= MetadataModule.update_json(RawJSON ,resultFind);
					console.log("Result updated json with id " + resultFind + " was: "+result);
				}else if (JSONstring.length > 0){
					var result= MetadataModule.update_json(JSONstring ,resultFind);
					console.log("Result updated json with id " + resultFind + " was: "+result);
				}	
// 				//1.1.1- remove existing metadata
// 				var deleting = MetadataModule.delete_json(DestPath,DestFileName,resultFind); //_id such "AWIAn8DjfLZhK4r7Ht3c"
// 				deleting.then((resultDelete) => {
// 					console.log("Result removed old json: "+resultDelete);
// 					// process the RAW JSON parameter: upload the info in the ElasticSearch server. 
// 					if (RawJSON != undefined){
// 						var result= MetadataModule.register_json(RawJSON);
// 						console.log("Result of register json : "+result);
// 					}else if (JSONstring.length > 0){
// 						var result= MetadataModule.register_json(JSONstring);
// 						console.log("Result of register json : "+result);
// 					} 
// 				});
			});
		}else{
			//1.2- Not existing doc, just need to add
			// process the RAW JSON parameter: upload the info in the ElasticSearch server.
			if (RawJSON != undefined){
				var result= MetadataModule.register_json(RawJSON);
				LogsModule.register_log( 200,req.connection.remoteAddress,message_no_file,currentdate,res.user);
// 				console.log("Result of register json of new file: "+result);
			}else if (JSONstring.length > 0){
				var result= MetadataModule.register_json(JSONstring);
// 				console.log("Result of register json of new file: "+result);
			}
		}
	});

	// show the content of the file in the server console:
	//fs.readFile(req.files.UploadFile, function (err, data) {
	// if (err) throw err;
	// // data will contain your file contents
	// console.log(data)
	// delete file
	//fs.unlink(req.files.path, function (err) {
	// if (err) throw err;
	// console.log('successfully deleted ' + req.files.path);
	//});
	//});
 	
	//Folder: compose and create if not existing
/*	if (!fs.existsSync(File_Server_Path + '/' +DestPath)){
		fs.mkdirSync(File_Server_Path+ '/' +DestPath);
	}*/ 
	supportmkdir.mkDirFullPathSync(os.homedir()+File_Server_Path+ '/' +DestPath);
	var dir = DestPath + '/';
	// Use the mv() method to place the file somewhere on your server
	//Upload the file, after create the folder if not existing
		if (UploadFile == undefined){  
			res.writeHead(400, { 'Content-Type': contentType });
			res.end("400: param UploadFile undefined \n");
			LogsModule.register_log( 400,req.connection.remoteAddress,"UPLOAD Error ",currentdate,res.user);
			return;				
		}
			
	UploadFile.mv( os.homedir()+File_Server_Path + '/' + dir + DestFileName, function(err) {
		if (err) {
			res.writeHead(400, { 'Content-Type': contentType });
			res.end("400: "+err+" \n");
			LogsModule.register_log( 400,req.connection.remoteAddress,"UPLOAD Error "+err,currentdate,res.user);
			return;
		}
	});

	res.writeHead(200, { 'Content-Type': contentType });
	if ( (mydebug.localeCompare("true")==0) || (mydebug.localeCompare("TRUE")==0) ){//strings equal, in other case returns the order of sorting
		res.end('\n' + ResponseDebug + colours.FgYellow + colours.Bright + 'File uploaded at path: '+ colours.Reset +os.homedir()+File_Server_Path+ '/' + '\n\n'); 
	}else{
		res.end("UPLOAD: succeed");
	}
	LogsModule.register_log( 200,req.connection.remoteAddress,'File UPLOADED at path: '  +os.homedir()+File_Server_Path+ '/' + dir + DestFileName ,currentdate,res.user);
});
//**********************************************************
//example:
// curl -H "Content-Type: text/plain" -XPOST http://localhost:8000/signup?email="bob"\&pw="1234"
// app.post('/signup',ipfilter(ips, {mode: 'allow'}), function(req, res) {
app.post('/signup', function(req, res) {
	"use strict";    
var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var email= find_param_email(req);
	var pw=find_param_pw(req); 
	if (pw == undefined){ 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: SIGNUP Bad Request, missing Email.\n");
		LogsModule.register_log( 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	} 
	if (email == undefined){
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: Bad Request, missing Email.\n");
		LogsModule.register_log( 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	} 
	
	var resultreg="";
	var resultReject="";  	
	console.log("[LOG]: REGISTER USER+PW"); 
	console.log("   " +colours.FgYellow + colours.Bright + "user: " + colours.Reset + email );
	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
	if(( req.connection.remoteAddress!= '127.0.0.1' ) &&( req.connection.remoteAddress!='::ffff:127.0.0.1')){
		console.log(" ACCESS DENIED from IP address: "+req.connection.remoteAddress);
		var messagea =  "REGISTER USER '"+ email  + "' FORBIDDEN access from external IP";
		LogsModule.register_log( 403,req.connection.remoteAddress,messagea,currentdate,"");
		res.writeHead(403, {"Content-Type": "text/plain"});
		res.end("\n403: FORBIDDEN access from external IP.\n");
		return ;
	}	
	console.log("");
	var result = UsersModule.register( email, pw);
	result.then((resultreg) => {		
			res.writeHead(resultreg.code, {"Content-Type": "text/plain"});
			res.end(resultreg.text+ "\n");
			var messageb =  "REGISTER USER '"+ email + "' GRANTED";
			LogsModule.register_log( resultreg.code, req.connection.remoteAddress, messageb,currentdate,"");
	},(resultReject)=> {
// 		console.log("log: Bad Request: " + resultReject); 
			res.writeHead(resultReject.code, {"Content-Type": "text/plain"});
			res.end("Bad Request "+resultReject.text+"\n");
			var messagec =  "REGISTER USER '"+ email  + "' BAD REQUEST";
			LogsModule.register_log( resultreg.code, req.connection.remoteAddress, messagec,currentdate,"");
	} ); 
});

//**********************************************************
var middleware = require('./token-middleware');
// Ruta solo accesible si estás autenticado
app.get('/verifytoken',middleware.ensureAuthenticated, function(req, res) {
	//console.log('acceso a contenido privado');
// 	console.log("\n[LOG]: Verfication of token"); 
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
// 	console.log("");
		var message = "The token is valid !!!.\n"
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end(message, 'utf-8');
} );

//**********************************************************
//example:
// curl -H "Content-Type: text/plain" -XGET http://localhost:8000/login?email="bob"\&pw="1234" --output token.txt
app.get('/login', function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	var email= find_param_email(req);
	var pw=find_param_pw(req);
	if (pw == undefined){
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("400: Bad Request, missing Passwd\n"); 
		LogsModule.register_log( 400, req.connection.remoteAddress, "400: Bad Request, missing Passwd",currentdate,"");
		return ;
	}
	if (email == undefined){
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("400: Bad Request, missing Email\n"); 
		LogsModule.register_log( 400, req.connection.remoteAddress, "400: Bad Request, missing Email",currentdate,"");		
		return  ;
	}

// 	console.log("\n[LOG]: LOGIN USER+PW+ GENERATION OF TOKEN");
// 	console.log("   " +colours.FgYellow + colours.Bright + "user: " + colours.Reset + email );
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
// 	console.log("");
	var resultCount="";
	var resultReject="";
	var result = UsersModule.query_user_pw( email, pw); //returns the count of email-pw, if !=1 then we consider not registered.
		result.then((resultCount) => { 
			//console.log("counted users: " + resultCount + "\n");
			if(resultCount==1){
				var mytoken= auth.emailLogin(email);
				//console.log("appjs "+mytoken+"\n");
				res.writeHead(200, {"Content-Type": "text/plain"});
				res.end(mytoken);
				LogsModule.register_log( 200, req.connection.remoteAddress, "New token Generated",currentdate,"");
			}else{
				res.writeHead(401, {"Content-Type": "text/plain"});
				res.end("401 (Unauthorized) Autentication failed, incorrect user  "+email+"or passwd "+pw+"\n");
				console.log("401 (Unauthorized) Autentication failed, incorrect user  "+email+"or passwd "+pw+"\n");
				LogsModule.register_log( 401, req.connection.remoteAddress, "401: Bad Request of Token, incorrect user or passwd "+email+"or passwd "+pw,currentdate,"");
			}
		},(resultReject)=> {
// 		console.log("log: Bad Request: " + resultReject); 
			res.writeHead(400, {"Content-Type": "text/plain"});
			res.end("\n400: Bad Request "+resultReject+"\n");
			LogsModule.register_log( 400, req.connection.remoteAddress, "400: Bad Token Request "+resultReject,currentdate,"");	
		} );
}); // login
//**********************************************************
var tryToOpenServer = function(port)
{
	console.log('trying to Open port: ' + port);
	app.listen(port, function() {
		console.log('HTTP listening:' + port);
	}).on('error', function(err){
		if (err.code === 'EADDRINUSE') {
			// port is currently in use
			console.log(colours.FgRed + colours.Bright + 'server error, port ' + port + ' is busy' + colours.Reset);
		} else { 
			console.log(err);
		}
	});
};

tryToOpenServer(8000);
