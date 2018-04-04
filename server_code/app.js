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
const ips = ['::ffff:127.0.0.1','127.0.0.1',"::1"];
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
		query= { query: { bool: { must: [ 
										{"match_phrase":{"path": filepath }},
										{"term":{"path_length": filepath.length}},
										{"match_phrase":{"filename": filename }},
										{"term":{"filename_length": filename.length}} 
										] } } };
	}else if (filepath.length > 0){
		query= { query: { bool: { must: [   
										{"match_phrase":{"path": filepath }},
										{"term":{"path_length": filepath.length}} 
										] } } };
	}else if (filename.length > 0){
		query= { query: { bool: { must: [
										{"match_phrase":{"filename": filename }},
										{"term":{"filename_length": filename.length}}
										] } } };
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

function find_param_name(req){
	var name="";		//parameter name 
	try{
		if (req.body.name != undefined){ //if defined as -F parameter
			name = req.body.name ;
		}else{
			name = req.query.name;
			if (name == undefined){ //if defined as ? parameter
				name="";
			}
		}
	}catch(e){
		name = req.query.name;
		if (name == undefined){ //if defined as ? parameter
			name="";
		}
	} 
	return name;
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
//****************************************************
	//This function flush the pending operations to the DataBase.
	function my_flush(req){  
		var testhttp = require('http');
		var rescode="";
		var contentType = 'text/plain';
		var myres = { code: "", text: "" }; 
		var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
		return new Promise( (resolve,reject) => {  
			testhttp.get('http://'+es_servername+':'+es_port+'/repository_db/_flush', function(rescode) {  	
				myres.code="200";
				myres.text="200 Succeed";
				resolve (myres);  
			}).on('error', function(e) { 
				myres.text="400"+"Flush error "+currentdate;
				myres.code="400";
				LogsModule.register_log( 400,req.connection.remoteAddress,"Flush error "+e,currentdate,"");
				reject (myres);
			}); 
		}); 
	};
	
	//report on the screen the list of fields, and values
	function consolelogjson(JSONstring ){
		var jsonobj = JSON.parse(JSONstring);
		var keys = Object.keys(jsonobj);
		console.log("total keys "+keys.length);
		for (var i = 0; i < keys.length; i++) {
			console.log("name: \""+Object.getOwnPropertyNames(jsonobj)[i]+"\" \t\tvalue: \""+ jsonobj[keys[i]]+ "\"");
			var labeltxt=Object.getOwnPropertyNames(jsonobj)[i];
			console.log("pos: " + jsonobj.indexOf(labeltxt));
		}
	}
	
	//the purpose is to remove the fields/properties path,path_length, filename,filename_length, if present.
	//and generate thos fields/properties from the input parameters
	function fix_json(JSONstring,filename,path){ 
		var new_json = { 
		} 
		var jsonobj = JSON.parse(JSONstring);
		var keys = Object.keys(jsonobj); 
		for (var i = 0; i < keys.length; i++) {
			var label=Object.getOwnPropertyNames(jsonobj)[i];
			label=label.toLowerCase();
			if((label != 'path') && (label != 'filename') && (label != 'path_length') && (label != 'filename_length'))
			new_json[label]=jsonobj[keys[i]];		//add one property 
		} 
		new_json['path']=path;
		new_json['path_length']=path.length; //label can not contain points '.' !
		new_json['filename']=filename;
		new_json['filename_length']=filename.length;
		return new_json;
	}
	
	function generate_json_example(){ 
		var Employee = {
			firstname: "Pedro",
			lastname: "Picapiedra"
		} 
		console.log(Employee);  
		delete Employee.firstname; //delete one property
		var label='age';
		Employee[label]="32";		//add one property
		console.log(Employee);  
	}
	
	//report on the screen the list of fields, and values
	function get_value_json(JSONstring,label){
		var jsonobj = JSON.parse(JSONstring);
		var keys = Object.keys(jsonobj);
		console.log("total keys "+keys.length);
		var i=0;
		var myres = {value: undefined, pos: undefined }; 
		while (i < keys.length) {
			if(Object.getOwnPropertyNames(jsonobj)[i]==label){
				myres.pos=i;
				myres.value=jsonobj[keys[i]];
				return (myres);
			}
			i++;
		}
		return (myres);
	}	
	
	//**********************************************************
	//after succedd on the upload of themetadata, we proceed to upload the file 
	function upload_file (UploadFile,  homedir , File_Server_Path, DestPath,DestFileName,user, ipaddress,date,mydebug) {
		return new Promise( (resolve,reject) => {
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
			var myres = { code: "400", text:  "" };
			try{
				supportmkdir.mkDirFullPathSync(os.homedir()+File_Server_Path+ '/' +DestPath);
			}catch(e){
				myres.code="400";
				myres.text="error mkdir "+e ;
				reject (myres);
			} 
			var dir = DestPath + '/';
			// Use the mv() method to place the file somewhere on your server
			//Upload the file, after create the folder if not existing
			if (UploadFile == undefined){   
				resultlog = LogsModule.register_log( 400,ipaddress,"UPLOAD Error ", date, user);
				resultlog.then((resultreg) => {
					myres.code="400";
					myres.text="param UploadFile undefined ." ;
					reject (myres);
				},(resultReject)=> { 
					myres.code="400";
					myres.text="param UploadFile undefined ." ;
					reject (myres);
				});
			}else{		  	
				UploadFile.mv( os.homedir()+File_Server_Path + '/' + dir + DestFileName, function(err) { 
					if (err) { 
						resultlog = LogsModule.register_log( 400,ipaddress,"UPLOAD Error "+err, date, user); 
						resultlog.then((resultreg) => {
							myres.code="400";
							myres.text=" ."+err ;
							console.log("up41");
							reject (myres);
						},(resultReject)=> { 
							myres.code="400";
							myres.text="."+err ;
							console.log("up42");
							reject (myres);
						});
					} else{ 
						resultlog = LogsModule.register_log( 200,ipaddress,'File UPLOADED at path: '+os.homedir()+File_Server_Path+ '/' + dir + DestFileName , date, user);
						resultlog.then((resultreg) => {
							myres.code="200";
							if ( (mydebug.localeCompare("true")==0) || (mydebug.localeCompare("TRUE")==0) ){//strings equal, in other case returns the order of sorting
								myres.text='\n' + ResponseDebug + colours.FgYellow + colours.Bright + 'File uploaded at path: '+ colours.Reset +os.homedir()+File_Server_Path+ '/' + '\n\n' ;  
							}else{
								myres.text="UPLOAD: succeed" ; 
							}
							resolve(myres);
						},(resultReject)=> { 
							myres.code="400";
							myres.text="400: Error on registering the Log\n" ;
							reject (myres);
						});	 
					}
				});  
			}
		}); 
	}  //end register  
	

	
//********************************************************** 
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
	var resultlog ;
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	console.log("\n[LOG]: Deleting Database"); 
	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
	if(( req.connection.remoteAddress!= ips[0] ) &&( req.connection.remoteAddress!=ips[1])&&( req.connection.remoteAddress!=ips[2])){
		console.log(" ACCESS DENIED from IP address: "+req.connection.remoteAddress);
		res.writeHead(403, {"Content-Type": "text/plain"});
		res.end("\n403: FORBIDDEN access from external IP.\n");		
		var messagea = "Deleting Database FORBIDDEN access from external IP.";
		resultlog = LogsModule.register_log( 403,req.connection.remoteAddress,messagea,currentdate,""); 
		return ;
	}	
	var resultFind=""; 
	var searching = MetadataModule.drop_db( );
	searching.then((resultFind) => { 
		deleteFolderRecursive (os.homedir()+File_Server_Path) ;
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n"); 
// 		 we can not register nothing after delete the DB !!! 
	},(resultReject)=> {
		console.log("log: Bad Request: " + resultReject); 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: Bad Request "+resultReject+"\n"); 
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultReject,currentdate,"");
	} );
});
//**********************************************************
app.get('/new_db', function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
// 	console.log("\n[LOG]: New Database"); 
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset); 
	var metadatamapping = {
		"metadata": {
			"properties": {
				"path": {
					"type": "string",
					"index": "analyzed"
				},
				"path_length": { 
					"type": "short"
				},
				"user_owner": {//of the file, user_id is the user email
					"type": "string",
					"index": "analyzed"
				},
				"name": {//of the application
					"type": "string",
					"index": "analyzed"
				},
				"filename": {
					"type": "string",
					"index": "analyzed"
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
					"type": "string",
					"index": "not_analyzed" //for avoid hacking when using incomplete email addresses.
				},
				"email_length": {
					"type": "short"
				},
				"password": {
					"type": "string",
					"index": "not_analyzed" //for avoid hacking when using incomplete pw.
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
	var resultlog ;
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
						resultlog = LogsModule.register_log( 200,req.connection.remoteAddress,"DB successfully created",currentdate,""); 
					},(resultRejecte)=> { 
						res.writeHead(400, {"Content-Type": "text/plain"});
						res.end("\n400: Bad Request "+resultRejecte+"\n");
						resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultRejectd,currentdate,"");
					} ); 
				},(resultRejectd)=> { 
					res.writeHead(400, {"Content-Type": "text/plain"});
					res.end("\n400: Bad Request "+resultRejectd+"\n");
					resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultRejectd,currentdate,"");
				} ); 
			},(resultRejectc)=> { 
				res.writeHead(400, {"Content-Type": "text/plain"});
				res.end("\n400: Bad Request "+resultRejectc+"\n");
				resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultRejectc,currentdate,"");
			} ); 
		},(resultRejectb)=> { 
			res.writeHead(400, {"Content-Type": "text/plain"});
			res.end("\n400: Bad Request "+resultRejectb+"\n");
			resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultRejectb,currentdate,"");
		} );
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: Bad Request "+resultReject+"\n");
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"Bad Request "+resultReject,currentdate,"");
	} );
});

//**********************************************************
app.get('/_flush', function(req, res) { 
	var verify_flush = my_flush(req );  
	verify_flush.then((resolve_result) => {  
		res.writeHead(resolve_result.code, {"Content-Type": "text/plain"});
		res.end(resolve_result.text+"\n", 'utf-8');  
	},(reject_result)=> {  
		res.writeHead(reject_result.code, {"Content-Type": "text/plain"}); 
		res.end(reject_result.text+"\n", 'utf-8'); 
	});// 
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
	var resultlog ;
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
			resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
			return ;
		}
	}else{
		res.writeHead(400, { 'Content-Type': contentType });
		res.end("\n400: Bad Request, missing filepath.\n");
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,message_no_path,currentdate,res.user);
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
			resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
			return ;
		}		
	}else{
		res.writeHead(400, { 'Content-Type': contentType });
		res.end("\n400: Bad Request, missing filename.\n");
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,message_no_file,currentdate,res.user); //TODO podemos poner el "user" del token !!
		return ;
	}
	
	if (mydebug == undefined){
		mydebug="false";
	}
		
	myPath = os.homedir()+ File_Server_Path + '/' + filepath + '/' + filename; 
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
				resultlog = LogsModule.register_log( 200,req.connection.remoteAddress,"DONWLOAD granted to file: "+myPath,currentdate,res.user);
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
		varresultlog = LogsModule.register_log(404,req.connection.remoteAddress,"DOWNLOAD error: File not found: "+filepath+filename,currentdate,res.user);
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
// 		if (resultCount>0){
// 			//1.1- find id of the existing doc for such path filename 
// 			var bodyquery= componse_query(filepath, filename);
// 			var searching = MetadataModule.get_metadata(bodyquery,pretty);
// 			searching.then((resultFind) => {  
// 				res.writeHead(400, {"Content-Type": "text/plain"});
// 				res.end(resultFind+"\n");
// 			});
// 		}else{
// 			//1.2- Not existing doc, 
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
	var resultlog ;
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
	var resultFind=""; 
	var query= componse_query(filepath, filename);

	//1.1- find id of the existing doc for such path filename
	var searching = MetadataModule.query_metadata(query, pretty);
	searching.then((resultFind) => { 
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n");
		resultlog = LogsModule.register_log(200,req.connection.remoteAddress,"QUERY METADATA granted to query:" +JSON.stringify(query),currentdate,res.user);
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("Bad Request "+resultReject.text+"\n");
		resultlog = LogsModule.register_log(400,req.connection.remoteAddress,"QUERY METADATA BAD Request on query:" +JSON.stringify(query),currentdate,res.user); 
	}); 
});
//**********************************************************
app.get('/es_query_metadata', middleware.ensureAuthenticated, function(req, res) { 
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 		
	var QueryBody =find_param_QueryBody(req);
	var resultlog ;
	var pretty = find_param_pretty(req); 
	var mybody_obj = JSON.parse( QueryBody); 
// 	console.log("   " +colours.FgYellow + colours.Bright + "Query: " + colours.Reset + JSON.stringify(mybody_obj) );
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset); 
	var resultFind="";
	//1.1- find id of the existing doc for such path filename JSON.stringify(
	var searching = MetadataModule.query_metadata( mybody_obj, pretty); //.replace(/\//g, '\\/');
	searching.then((resultFind) => { 
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n");
		resultlog = LogsModule.register_log(200,req.connection.remoteAddress,"ES-QUERY METADATA granted to query:" +JSON.stringify(query),currentdate,res.user);
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("Bad Request "+resultReject.text+"\n");
		resultlog = LogsModule.register_log(400,req.connection.remoteAddress,"ES-QUERY METADATA BAD Request on query:" +JSON.stringify(query),currentdate,res.user); 
	}); 
}); 
//**********************************************************
//TODO: falta confirmar que los archivos existen
app.post('/upload',middleware.ensureAuthenticated, function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var contentType = 'text/plain';
	var resultlog ;
	var mydebug = "false";
	if (!req.files){
		res.writeHead(400, { 'Content-Type': contentType });
		res.end('No files were uploaded.');   
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,'No files were uploaded.',currentdate,res.user);
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
// 				ResponseDebug = colours.FgYellow + colours.Bright + 'Error: missing Path '+Reset + '\n'; 
				res.writeHead(400, { 'Content-Type': contentType });
				res.end("400:Bad Request, missing Path.\n");
				resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
				return;				
			}
		}
	}catch(e){
		DestPath = req.query.Path;
		if (DestPath == undefined){ //if defined as ? parameter
// 			ResponseDebug = colours.FgYellow + colours.Bright + 'Error: missing Path '+Reset + '\n';
			res.writeHead(400, { 'Content-Type': contentType });
			res.end("400:Bad Request, missing Path.\n");
			resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
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
				resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
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
			resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
			return;
		}
	} 
	// The name of the input field (i.e. "UploadFile") is used to retrieve the uploaded file
	let UploadFile = req.files.UploadFile; 
	var JSONstring="";
	if (req.files.UploadJSON != undefined){ 
// 		console.log("   " +colours.FgYellow + colours.Bright + "JSON as file: " + colours.Reset );
// 		console.log(req.files.UploadJSON.data.toString('utf8'));
		JSONstring=req.files.UploadJSON.data.toString('utf8'); 
	}  
	var resultCount="";
	var resultFind="";
	var resultDelete=""; 
/*	var bodyquery= componse_query(DestPath, DestFileName);
	var countfiles= MetadataModule.count_file(bodyquery);	
	//1.- count files
	countfiles.then((resultCount) => {
		// succesMessage es lo que sea que pasamos en la función resolve(...) de arriba.
		// No tiene por qué ser un string, pero si solo es un mensaje de éxito, probablemente lo sea. 
		if (resultCount>0){ 
			//1.1- find id of the existing doc for such path filename
			var searching = MetadataModule.find_file(DestPath,DestFileName);
			searching.then((resultFind) => { 
				//1.1.1- update existing json
				if (RawJSON != undefined){
					var result= MetadataModule.update_json(RawJSON ,resultFind);
					console.log("Result updated json with id " + resultFind + " was: "+result);
				}else if (JSONstring.length > 0){
					var result= MetadataModule.update_json(JSONstring ,resultFind);
					console.log("Result updated json with id " + resultFind + " was: "+result);
				} 
				var verify_flush = my_flush(req );
				verify_flush.then((resolve_result) => {     
					//nothing to do now
				},(reject_result)=> {  
					res.writeHead(reject_result.code, {"Content-Type": "text/plain"});
					res.end(reject_result.text+"\n", 'utf-8');
					return;
				});// 
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
		}else{	*/
			var result_upload;
			var filename;
			var path;			
			//1.2- Not existing doc, just need to add
			// process the RAW JSON parameter: upload the info in the ElasticSearch server.
			if (RawJSON != undefined){ 
// 				filename= get_value_json(RawJSON,"filename");
// 				path= get_value_json(RawJSON,"path");
	// 			var jsonobj = JSON.parse(RawJSON);
	// 			var keys = Object.keys(jsonobj);
	// 			console.log("total keys "+keys.length);
	// 			for (var i = 0; i < keys.length; i++) {
	// 			console.log(jsonobj[keys[i]]);
	// 			}
				var result= MetadataModule.register_update_filename_path_json(RawJSON, DestFileName, DestPath); 
				result.then((resultResolve) => {
					resultlog = LogsModule.register_log( 200,req.connection.remoteAddress,resultResolve.text,currentdate,res.user);
					var resultResUp;
					var resultRejectUp;
					//after succeed on the upload of themetadata, we proceed to upload the file 
					result_upload = upload_file(UploadFile, os.homedir(), File_Server_Path,
					DestPath,DestFileName,//path.value,filename.value,//
					res.user,req.connection.remoteAddress,currentdate,mydebug);
					result_upload.then((resultResUp) => {
						res.writeHead(resultResUp.code, {"Content-Type": "text/plain"});
						res.end(resultResUp.text+"\n", 'utf-8');
						return;
					},(resultRejectUp)=> { 
						console.log("resultRejectUp.code" +resultRejectUp.code);
						res.writeHead(resultRejectUp.code, {"Content-Type": "text/plain"});
						res.end(resultRejectUp.text+"\n", 'utf-8');
						return;
					} );					
				},(resultReject)=> {
					res.writeHead(resultReject.code, {"Content-Type": "text/plain"});
					res.end(resultReject.text+"\n", 'utf-8')
					resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"Upload Error",currentdate,res.user); 
					return;
				});//end count_users  
			}else if (JSONstring.length > 0){
 			
var JSONstring=fix_json(JSONstring, DestFileName, DestPath);
console.log(JSONstring);
 
// 					console.log("bodyyyyy is "+savableEvent);
				
// 				filename= get_value_json(JSONstring,"filename");
// 				path= get_value_json(JSONstring,"path"); 
// 				consolelogjson(JSONstring);	 
				var result= MetadataModule.register_update_filename_path_json(JSONstring, DestFileName, DestPath); 
				result.then((resultResolve) => {
					resultlog = LogsModule.register_log( 200,req.connection.remoteAddress,resultResolve.text,currentdate,res.user); 
					var resultResUp;
					var resultRejectUp;
					//after succeed on the upload of themetadata, we proceed to upload the file 
					result_upload = upload_file(UploadFile, os.homedir(), File_Server_Path, 
						DestPath,DestFileName,//path.value,filename.value,//
						res.user,req.connection.remoteAddress,currentdate,mydebug);
					result_upload.then((resultResUp) => {
						res.writeHead(resultResUp.code, {"Content-Type": "text/plain"});
						res.end(resultResUp.text+"\n", 'utf-8');
						return;
					},(resultRejectUp)=> { 
						console.log("resultRejectUp.code" +resultRejectUp.code);
						res.writeHead(resultRejectUp.code, {"Content-Type": "text/plain"});
						res.end(resultRejectUp.text+"\n", 'utf-8');
						return;
					} ); 								
				},(resultReject)=> {
					res.writeHead(resultReject.code, {"Content-Type": "text/plain"});
					res.end(resultReject.text+"\n", 'utf-8');
					resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"Upload Error",currentdate,res.user); 
					return;
				});//end count_users 
			}
// 		} 
// 	}); 
});

//**********************************************************
//example:
// curl -H "Content-Type: text/plain" -XPOST http://localhost:8000/signup?name="bob"\&email="bob@abc.commm"\&pw="1234"
// app.post('/signup',ipfilter(ips, {mode: 'allow'}), function(req, res) {
app.post('/signup', function(req, res) {
	"use strict";    
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var name= find_param_name(req);
	var email= find_param_email(req);
	var pw=find_param_pw(req); 
	var resultlog ;
	console.log("name is "+name);
	if (pw == undefined){ 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: SIGNUP Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	} 
	if (email == undefined){
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	} 	
	var resultreg="";
	var resultReject=""; 
	var resolve_result="";
	var reject_result="";
	console.log("[LOG]: REGISTER USER+PW"); 
	console.log("   " +colours.FgYellow + colours.Bright + "user: " + colours.Reset + email );
	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
	if(( req.connection.remoteAddress!= ips[0] ) &&( req.connection.remoteAddress!=ips[1])&&( req.connection.remoteAddress!=ips[2])){
		console.log(" ACCESS DENIED from IP address: "+req.connection.remoteAddress);
		var messagea =  "REGISTER USER '"+ email  + "' FORBIDDEN access from external IP";
		resultlog = LogsModule.register_log( 403,req.connection.remoteAddress,messagea,currentdate,"");
		res.writeHead(403, {"Content-Type": "text/plain"});
		res.end("\n403: FORBIDDEN access from external IP.\n");
		return ;
	}
	var result = UsersModule.register( name, email, pw);
	result.then((resultreg) => {
		var messageb =  "REGISTER USER '"+ email + "' GRANTED";
		resultlog = LogsModule.register_log( resultreg.code, req.connection.remoteAddress, messageb,currentdate,""); 
		var verify_flush = my_flush( req);
		verify_flush.then((resolve_result) => {    
			res.writeHead(resultreg.code, {"Content-Type": "text/plain"});
			res.end("Succeed\n");	
		},(reject_result)=> {  
			res.writeHead(reject_result.code, {"Content-Type": "text/plain"});
			res.end(reject_result.text+"ERROR FLUSH\n", 'utf-8');
			resultlog = LogsModule.register_log( reject_result.code, req.connection.remoteAddress, reject_result.text+"ERROR FLUSH",currentdate,"");
		});//
	},(resultReject)=> { 
		res.writeHead(resultReject.code, {"Content-Type": "text/plain"});
		res.end(resultReject.code+"Bad Request "+resultReject.text+"\n");
		var messagec =  "REGISTER USER '"+ email  + "' BAD REQUEST";
		resultlog = LogsModule.register_log( resultReject.code, req.connection.remoteAddress, messagec,currentdate,"");
	} ); 
});

//**********************************************************
//example:
// curl -H "Content-Type: text/plain" -XPOST http://localhost:8000/signup?name="bob"\&email="bob@abc.commm"\&pw="1234"
// app.post('/signup',ipfilter(ips, {mode: 'allow'}), function(req, res) {
app.post('/update_user', function(req, res) {
	"use strict";    
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var name= find_param_name(req);
	var email= find_param_email(req);
	var pw=find_param_pw(req);  
	if (pw == undefined){ 
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: SIGNUP Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	} 
	if (email == undefined){
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("\n400: Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log( 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	} 
	
	var resultreg="";
	var resultReject="";   
	if(( req.connection.remoteAddress!= ips[0] ) &&( req.connection.remoteAddress!=ips[1])&&( req.connection.remoteAddress!=ips[2])){ 
		var messagea =  "REGISTER USER '"+ email  + "' FORBIDDEN access from external IP";
		resultlog = LogsModule.register_log( 403,req.connection.remoteAddress,messagea,currentdate,"");
		res.writeHead(403, {"Content-Type": "text/plain"});
		res.end("\n403: FORBIDDEN access from external IP.\n");
		return ;
	}	 
	var result = UsersModule.update_user( name, email, pw);
	result.then((resultreg) => { 
		var messageb =  "UPDATE USER '"+ email + "' GRANTED";
		resultlog = LogsModule.register_log( resultreg.code, req.connection.remoteAddress, messageb,currentdate,""); 
		var verify_flush = my_flush( req);
		verify_flush.then((resolve_result) => {    
			res.writeHead(resultreg.code, {"Content-Type": "text/plain"});
			res.end( "Succceed\n");
		},(reject_result)=> {  
			res.writeHead(reject_result.code, {"Content-Type": "text/plain"});
			res.end(reject_result.text+"\n", 'utf-8');
		});//
	},(resultReject)=> { 
		res.writeHead(resultReject.code, {"Content-Type": "text/plain"});
		res.end("Bad Request "+resultReject.text+"\n");
		var messagec =  "UPDATE USER '"+ email  + "' BAD REQUEST";
		resultlog = LogsModule.register_log( resultreg.code, req.connection.remoteAddress, messagec,currentdate,"");
	} ); 
});

//**********************************************************
var middleware = require('./token-middleware');
// Ruta solo accesible si estás autenticado
app.get('/verifytoken',middleware.ensureAuthenticated, function(req, res) {
	//console.log('acceso a contenido privado');
// 	console.log("\n[LOG]: Verfication of token"); 
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset); 
		var message = "The token is valid !!!.\n"
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end(message, 'utf-8');
} );

//**********************************************************
//example:
// curl -H "Content-Type: text/plain" -XGET http://localhost:8000/login?email="bob"\&pw="1234" --output token.txt
app.get('/login', function(req, res) {
	"use strict";
	var resultlog ;
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	var email= find_param_email(req);
	var pw=find_param_pw(req);
	if (pw == undefined){
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("400: Bad Request, missing Passwd\n"); 
		resultlog = LogsModule.register_log( 400, req.connection.remoteAddress, "400: Bad Request, missing Passwd",currentdate,"");
		return ;
	}
	if (email == undefined){
		res.writeHead(400, {"Content-Type": "text/plain"});
		res.end("400: Bad Request, missing Email\n"); 
		  resultlog = LogsModule.register_log( 400, req.connection.remoteAddress, "400: Bad Request, missing Email",currentdate,"");		
		return  ;
	}

// 	console.log("\n[LOG]: LOGIN USER+PW+ GENERATION OF TOKEN");
// 	console.log("   " +colours.FgYellow + colours.Bright + "user: " + colours.Reset + email );
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset); 
	var resultCount="";
	var resultReject="";
	var result = UsersModule.query_count_user_pw( email, pw); //returns the count of email-pw, if !=1 then we consider not registered.
		result.then((resultCount) => {  
			if(resultCount==1){
				var mytoken= auth.emailLogin(email); 
				res.writeHead(200, {"Content-Type": "text/plain"});
				res.end(mytoken);
				  resultlog = LogsModule.register_log( 200, req.connection.remoteAddress, "New token Generated",currentdate,"");
			}else{
				res.writeHead(401, {"Content-Type": "text/plain"});
				res.end("401 (Unauthorized) Autentication failed, incorrect user  "+ email +" or passwd "+ pw +"\n"); 
				  resultlog = LogsModule.register_log( 401, req.connection.remoteAddress, "401: Bad Request of Token, incorrect user or passwd "+email+"or passwd "+pw,currentdate,"");
			}
		},(resultReject)=> { 
			res.writeHead(400, {"Content-Type": "text/plain"});
			res.end("\n400: Bad Request "+resultReject+"\n");
			  resultlog = LogsModule.register_log( 400, req.connection.remoteAddress, "400: Bad Token Request "+resultReject,currentdate,"");	
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
