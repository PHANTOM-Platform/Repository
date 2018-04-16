#!/usr/bin/env node
// Author: J.M.Montañana HLRS 2018
// 	If you find any bug, please notify to hpcjmont@hlrs.de
// 
// 	Copyright (C) 2018 University of Stuttgart
// 
// 		Licensed under the Apache License, Version 2.0 (the "License");
// 		you may not use this file except in compliance with the License.
// 		You may obtain a copy of the License at
// 	
// 		http://www.apache.org/licenses/LICENSE-2.0
// 	
// 		Unless required by applicable law or agreed to in writing, software
// 		distributed under the License is distributed on an "AS IS" BASIS,
// 		WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// 		See the License for the specific language governing permissions and
// 		limitations under the License.
process.title = 'repository-server';

//****************** VARIABLES OF THE REPOSITORY SERVER, MODIFY DEPENDING ON YOUR DEPLOYMENT *****
	const es_servername = 'localhost';
	const es_port = '9400';
	const ips = ['::ffff:127.0.0.1','127.0.0.1',"::1"];
	const File_Server_Path = '/phantom_servers/phantom_repository'; 
	const SERVERNAME ="PHANTOM Repository";
	const SERVERPORT = 8000;
	const SERVERDB = "repository_db";
	
	// This will be allocated in the home folder of the user running nodejs !! os.homedir()+File_Server_Path
//******************** PACKAGES AND SOME GLOBAL VARIABLES ************
	const express 		= require('express');
	var app = express(); 
	const fileUpload 	= require('express-fileupload');
	var fs 				= require('fs');
	var dateFormat 		= require('dateformat');
	const os 			= require('os'); 
	const contentType_text_plain = 'text/plain';
//********************* SUPPORT JS file, with variable defs *********
	const colours 			= require('./colours');
//********************* SUPPORT JS file, for DB functionalities *****
	const MetadataModule 	= require('./support-metadata'); 
	const UsersModule 		= require('./support-usersaccounts');
	const LogsModule 		= require('./support-logs');
	const supportmkdir 		= require('./mkdirfullpath'); 
//*********************** SUPPORT JS file, for TOKENS SUPPORT *******
	var bodyParser	= require('body-parser');
	var cors		= require('cors');
	var auth		= require('./token-auth');
	var middleware	= require('./token-middleware');
 

//**********************************************************
//This function removes double quotation marks if present at the beginning and the end of the input string
function remove_quotation_marks(input_string){
	if(input_string.charAt(0) === '"') {
		input_string = input_string.substr(1);
	}
	if(input_string.length>0){
	if(input_string.charAt(input_string.length-1) === '"') {
		input_string = input_string.substring(0, input_string.length - 1); 
	}}
	return (input_string);
}	

function is_defined(variable) {
	return (typeof variable !== 'undefined');
}
//*********************************************************************
function find_param(body, query){	
	try{
		if (body != undefined){ //if defined as -F parameter
			return body ;
		}else if (query != undefined){ //if defined as ? parameter
			return query;
		}
	}catch(e){ 
		if (query != undefined){ //if defined as ? parameter
			return query;
		}
	} 
	return undefined ;
}
//*********************************************************************
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
//*********************************************************************	
//the purpose is to remove the fields/properties path,path_length, filename,filename_length, if present.
//and generate thos fields/properties from the input parameters
function update_filename_path_on_json(JSONstring,filename,path){ 
	var new_json = {  } 
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj); 
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=label.toLowerCase();
		if((label != 'path') && (label != 'filename') && (label != 'path_length') && (label != 'filename_length'))
		new_json[label]=jsonobj[keys[i]];	//add one property 
	} 
	new_json['path']		=path;
	new_json['path_length']	=path.length; //label can not contain points '.' !
	new_json['filename']	=filename;
	new_json['filename_length']=filename.length;
	return new_json;
}

function get_source_project_json(JSONstring){  
	var myres = { source: "", project: "" };
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj); 
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=label.toLowerCase();
		if(label == 'source')
			myres.source=jsonobj[keys[i]];		
		if(label == 'project')
			myres.project=jsonobj[keys[i]];
	} 
	return myres;
}
//*********************************************************************	
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
//*********************************************************************
//report on the screen the list of fields, and values
function get_value_json(JSONstring,label){
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj); 
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
function componse_query(project,source,filepath, filename){ 
	var query="";
	if (project != undefined)
	if (project.toString.length > 0){
		query= {"match_phrase":{"project": project }}, {"term":{"project_length": project.length}};  
	} 
	if (source != undefined)
	if (source.toString.length > 0){
		if(query.length >0 ){
			query= query, {"match_phrase":{"source": source }}, {"term":{"source_length": source.length}} ;
		}else{
			query= {"match_phrase":{"source": source }}, {"term":{"source_length": source.length}} ;
		} 
	} 
	if (filepath!=undefined)	
	if (filepath.toString.length > 0){
		if(query.length >0 ){
			query = query, {"match_phrase":{"path": filepath }}, {"term":{"path_length": filepath.length}} ;
		}else{
			query= {"match_phrase":{"path": filepath }}, {"term":{"path_length": filepath.length}} ;
		} 
	}
	if (filename!=undefined) 
	if (filename.toString.length > 0){
		if(query.length >0 ){
			query = query, {"match_phrase":{"filename": filename }}, {"term":{"filename_length": filename.length}} ;
		}else{
			query = {"match_phrase":{"filename": filename }}, {"term":{"filename_length": filename.length}} ;	
		}
	} 
	if(query.toString.length >0 ){
		query= { query: { bool: { must: [ query ] } } };
	}else{ 
		query= { query: { "match_all": {} }};
			
	}  
	return query;
}
//****************************************************
//This function flush the pending operations to the DataBase.
function my_flush(req){
	var testhttp = require('http');
	var rescode=""; 
	var myres = { code: "", text: "" }; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	return new Promise( (resolve,reject) => {
		testhttp.get('http://'+es_servername+':'+es_port+'/'+SERVERDB+'/_flush', function(rescode) {	
			myres.code="200";
			myres.text="200 Succeed";
			resolve (myres);
		}).on('error', function(e) { 
			myres.text="400"+"Flush error "+currentdate;
			myres.code="400";
			LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Flush error "+e,currentdate,"");
			reject (myres);
		}); 
	}); 
};
//**********************************************************
function validate_parameter(parameter,label,currentdate,user,address){
	var message_error = "DOWNLOAD Bad Request missing "+label;  
	if (parameter != undefined){  
		parameter = remove_quotation_marks(parameter);
		if (parameter.length > 0)
			return(parameter); 
	} 
	resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,address,message_error,currentdate, user);
	return undefined;
}

//*********************************************************
function retrieve_file(filePath,req){
	var fs = require('fs');
	var path = require('path');
	var extname = path.extname(filePath);
	var contentType = 'text/html';
	switch (extname) {
		case '.html':
			contentType = 'text/html';
			break;			
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
		case '.json':
			contentType = 'application/json';
			break;
		case '.png':
			contentType = 'image/png';
			break;
		case '.jpg':
			contentType = 'image/jpg';
			break;
		case '.wav':
			contentType = 'audio/wav';
			break;
	}
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
}
//**********************************************************
var middleware = require('./token-middleware');

// Access to private content only if autenticated, using an authorization token
app.get('/verifytoken',middleware.ensureAuthenticated, function(req, res) { 
// 	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset); 
		var message = "The token is valid !!!.\n"
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end(message, 'utf-8');
} );
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
//after succedd on the upload of themetadata, we proceed to upload the file 
function upload_file (UploadFile, homedir, File_Server_Path, DestPath,DestFileName,user, ipaddress,date,mydebug) {
	return new Promise( (resolve,reject) => {		
		//Folder: compose and create if not existing
	/*	if (!fs.existsSync(File_Server_Path + '/' +DestPath)) 
			fs.mkdirSync(File_Server_Path+ '/' +DestPath); */
		var myres = { code: "400", text: "" };
		try{
			supportmkdir.mkDirFullPathSync(os.homedir()+File_Server_Path+ '/' +DestPath);
		}catch(e){
			myres.code="400";
			myres.text="error mkdir "+e ;
			reject (myres);
		}
		// Use the mv() method to place the file somewhere on your server
		// Upload the file, after create the folder if not existing
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
			var dir = DestPath + '/';
			UploadFile.mv( os.homedir()+File_Server_Path + '/' + dir + DestFileName, function(err) { 
				if (err) { 
					resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,ipaddress,"UPLOAD Error "+err, date, user); 
					resultlog.then((resultreg) => {
						myres.code="400";
						myres.text=" ."+err ; 
						reject (myres);
					},(resultReject)=> { 
						myres.code="400";
						myres.text="."+err ; 
						reject (myres);
					});
				} else{ 
					resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,200,ipaddress,'File UPLOADED at path: '+
						os.homedir()+File_Server_Path+ '/' + dir + DestFileName , date, user);
					resultlog.then((resultreg) => {
						myres.code="200";
						if ( (mydebug.localeCompare("true")==0) || (mydebug.localeCompare("TRUE")==0) ){//strings equal, in other case returns the order of sorting
							myres.text='\n' +  colours.FgYellow + colours.Bright +
								'File uploaded at path: '+ colours.Reset +os.homedir()+File_Server_Path+ '/' + '\n\n' ;
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
} //end register 
//********************************************************** 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use(fileUpload()); 
//**********************************************************
/* GET home page. */
app.get('/', function(req, res, next) {	
	var json = {};
	json.message = SERVERNAME + "server is up and running."
	json.release = req.app.get('version');
	json.versions = [ 'v1' ];
	json.current_time = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	res.json(json);
});
//**********************************************************
app.get('/upload_file.html', function(req, res) {
	var filePath = 'web/upload_file.html';
	retrieve_file(filePath,req);
});
//**********************************************************
app.get('/upload_file.html', function(req, res) { 
	var filePath = 'web/upload_file.html';
	retrieve_file(filePath,req);
});
//*******************************
app.get('/download_file.html', function(req, res) { 
	var filePath = 'web/download_file.html';
	retrieve_file(filePath,req);
});
//*******************************
app.get('/examplec.json', function(req, res) { 
	var filePath = 'web/examplec.json';
	retrieve_file(filePath,req);
});
//*******************************
app.get('/query_metadata.html', function(req, res) { 
	var filePath = 'web/query_metadata.html';
	retrieve_file(filePath,req);
});
// Path only accesible when Authenticated
app.get('/private',middleware.ensureAuthenticated, function(req, res) {
	var message = "\n\nAccess to restricted content !!!.\n\n"
		res.writeHead(200, { 'Content-Type': contentType_text_plain});
		res.end(message, 'utf-8');
});
//**********************************************************
app.post('/delete_metadata',middleware.ensureAuthenticated, function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");  
	var resultlog ;  
	const message_missing = "DELETE Bad Request missing "; 
	var Project= find_param(req.body.Source, req.query.Source); 
	if ( Project == undefined){  
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:"+message_missing+" Project.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
		return;	 
	} 
	
	var Source= find_param(req.body.Source, req.query.Source); 
	if ( Source == undefined){  
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:"+message_missing+" Source.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
		return;	 
	} 
	
	
	var DestPath= find_param(req.body.Path, req.query.Path); 
	if ( DestPath == undefined){  
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:"+message_missing+" Path.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
		return;	 
	} 
 
	var DestFileName = find_param(req.body.DestFileName, req.query.DestFileName); 
	if (DestFileName == undefined){  
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:"+message_missing+" DestFileName.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
		return;
	} 
	
	var result= MetadataModule.delete_filename_path_json(es_servername+":"+es_port,SERVERDB, Project, Source, DestFileName, DestPath); 
	result.then((resultResolve) => {
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200,req.connection.remoteAddress,resultResolve.text,currentdate,res.user); 
		fs.unlink(os.homedir()+ File_Server_Path + '/' + DestPath + '/' + DestFileName, function(err) {
			if (err) {
				res.writeHead(400, {"Content-Type": contentType_text_plain});
				res.end("Error when deleting the file: "+err+"\n", 'utf-8');
				return;
			}else{
				console.log('successfully file deleted');
				res.writeHead(resultResolve.code, {"Content-Type": contentType_text_plain});
				res.end(resultResolve.text+"\n", 'utf-8');
				return;
			}
		});
	},(resultReject)=> {
		res.writeHead(resultReject.code, {"Content-Type": contentType_text_plain});
		res.end(resultReject.text+"\n", 'utf-8');
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Delete Error",currentdate,res.user); 
		return;
	});// 
});
//**********************************************************
app.get('/verify_es_connection', function(req, res) {	
	var testhttp = require('http'); 
	testhttp.get('http://'+es_servername+':'+es_port+'/', function(rescode) { 
// 		var int_code= parseInt( rescode.statusCode, 10 ); 
		res.writeHead(rescode.statusCode, { 'Content-Type': contentType_text_plain });
		res.end(""+rescode.statusCode, 'utf-8');
	}).on('error', function(e) {
		console.error(e);
		res.writeHead(000, { 'Content-Type': contentType_text_plain });
		res.end("000", 'utf-8');		
	}); 
});
//**********************************************************
app.get('/drop_db', function(req, res) {
	"use strict";
	var resultlog ;
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	console.log("\n[LOG]: Deleting Database"); 
	console.log("   " +colours.FgYellow + colours.Bright + " request from IP:" + req.connection.remoteAddress + colours.Reset);
	if(( req.connection.remoteAddress!= ips[0] ) &&( req.connection.remoteAddress!=ips[1])&&( req.connection.remoteAddress!=ips[2])){
		console.log(" ACCESS DENIED from IP address: "+req.connection.remoteAddress);
		res.writeHead(403, {"Content-Type": contentType_text_plain});
		res.end("\n403: FORBIDDEN access from external IP.\n");		
		var messagea = "Deleting Database FORBIDDEN access from external IP.";
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 403,req.connection.remoteAddress,messagea,currentdate,""); 
		return ;
	}
	var searching = MetadataModule.drop_db(es_servername+":"+es_port,SERVERDB );
	searching.then((resultFind) => { 
		deleteFolderRecursive (os.homedir()+File_Server_Path) ;
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n"); 
// 		 we can not register nothing after delete the DB !!! 
	},(resultReject)=> {
		console.log("log: Bad Request: " + resultReject); 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request "+resultReject+"\n"); 
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultReject,currentdate,"");
	} );
});
//**********************************************************
app.get('/new_db', function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
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
	var searching = MetadataModule.new_db(es_servername+":"+es_port,SERVERDB );
	searching.then((resultFind) => {		
		var searchingb = MetadataModule.new_mapping(es_servername+":"+es_port,SERVERDB, "metadata", metadatamapping);
		searching.then((resultFindb) => {
			var searchingc = MetadataModule.new_mapping(es_servername+":"+es_port,SERVERDB, "users", usersmapping);
			searching.then((resultFindc) => {
				var searchingd = MetadataModule.new_mapping(es_servername+":"+es_port,SERVERDB, "tokens", tokensmapping);
				searching.then((resultFindd) => { 
					var searchinge = MetadataModule.new_mapping(es_servername+":"+es_port,SERVERDB, "logs", logsmapping);
					searching.then((resultFinde) => {
						res.writeHead(200, {"Content-Type": "application/json"});
						res.end(resultFinde+"\n"); 
						resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200,req.connection.remoteAddress,"DB successfully created",currentdate,""); 
					},(resultRejecte)=> { 
						res.writeHead(400, {"Content-Type": contentType_text_plain});
						res.end("\n400: Bad Request "+resultRejecte+"\n");
						resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"Bad Request "+resultRejectd,currentdate,"");
					} ); 
				},(resultRejectd)=> { 
					res.writeHead(400, {"Content-Type": contentType_text_plain});
					res.end("\n400: Bad Request "+resultRejectd+"\n");
					resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultRejectd,currentdate,"");
				} ); 
			},(resultRejectc)=> { 
				res.writeHead(400, {"Content-Type": contentType_text_plain});
				res.end("\n400: Bad Request "+resultRejectc+"\n");
				resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultRejectc,currentdate,"");
			} ); 
		},(resultRejectb)=> { 
			res.writeHead(400, {"Content-Type": contentType_text_plain});
			res.end("\n400: Bad Request "+resultRejectb+"\n");
			resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultRejectb,currentdate,"");
		} );
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request "+resultReject+"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultReject,currentdate,"");
	} );
});

//**********************************************************
app.get('/_flush', function(req, res) { 
	var verify_flush = my_flush(req );
	verify_flush.then((resolve_result) => {
		res.writeHead(resolve_result.code, {"Content-Type": contentType_text_plain});
		res.end(resolve_result.text+"\n", 'utf-8');
	},(reject_result)=> {
		res.writeHead(reject_result.code, {"Content-Type": contentType_text_plain}); 
		res.end(reject_result.text+"\n", 'utf-8'); 
	});
});
//****************************************************************************** 
app.get('/query_metadata',middleware.ensureAuthenticated, function(req, res) { 
	"use strict";   
	var pretty = find_param(req.body.pretty, req.query.pretty);
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	//***************************************
	var filepath =find_param(req.body.Path,req.query.Path);
	if (filepath != undefined)
		filepath=remove_quotation_marks(filepath); 
	//***************************************
	var filename =find_param(req.body.filename,req.query.filename);
	if (filename != undefined)
		filename=remove_quotation_marks(filename); 
	//***************************************
	var project =find_param(req.body.project,req.query.project);
	if (project != undefined) 
		project=remove_quotation_marks(project); 
	//***************************************
	var source =find_param(req.body.source,req.query.source);
	if (source != undefined) 
		source=remove_quotation_marks(source); 
	var query= componse_query(project,source,filepath, filename); 
	//1.1- find id of the existing doc for such path filename
	
	var searching = MetadataModule.query_metadata(es_servername+":"+es_port,SERVERDB,query, pretty);
	var resultlog="";
	searching.then((resultFind) => { 
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,200,req.connection.remoteAddress,"QUERY METADATA granted to query:"
			+JSON.stringify(query),currentdate,res.user);
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("querymetadata: Bad Request "+resultReject +"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"QUERY METADATA BAD Request on query:" 
			+JSON.stringify(query),currentdate,res.user); 
	}); 
});
//**********************************************************
app.get('/es_query_metadata', middleware.ensureAuthenticated, function(req, res) { 
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 		
	var QueryBody 	= find_param(req.body.QueryBody, req.query.QueryBody); 
	var pretty 		= find_param(req.body.pretty, req.query.pretty); 
	var mybody_obj	= JSON.parse( QueryBody);   
	//1.1- find id of the existing doc for such path filename JSON.stringify(
	var searching = MetadataModule.query_metadata(es_servername+":"+es_port,SERVERDB, mybody_obj, pretty); //.replace(/\//g, '\\/');
	var resultlog="";
	searching.then((resultFind) => { 
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,200,req.connection.remoteAddress,"ES-QUERY METADATA granted to query:" 
			+JSON.stringify(QueryBody),currentdate,res.user);
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("es_query: Bad Request "+resultReject +"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"ES-QUERY METADATA BAD Request on query:" 
			+JSON.stringify(QueryBody),currentdate,res.user); 
	}); 
}); 
//**********************************************************
//TODO: falta confirmar que los archivos existen
//si no existen en el curl parece que se queda esperando indefinidamente
app.post('/upload',middleware.ensureAuthenticated, function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");  
	var resultlog ; 
	if (!req.files){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end('No files were uploaded.'); 
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,'No files were uploaded.',currentdate,res.user);
		return;
	}  
	var RawJSON=  find_param(req.body.RawJSON, req.query.RawJSON);
 
	var message_no_path = "UPLOAD Bad Request missing Path";
	var DestPath=find_param(req.body.Path,req.query.Path);
	if (DestPath == undefined){ 
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:Bad Request, missing Path.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,message_no_path,currentdate,res.user); 
		return;
	} 

	var message_no_file = "UPLOAD Bad Request missing DestFileName";
	var DestFileName=find_param( req.body.DestFileName , req.query.DestFileName);
	if (DestFileName == undefined){  
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:Bad Request, missing DestFileName.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
		return;
	}
	
	
	
	// The name of the input field (i.e. "UploadFile") is used to retrieve the uploaded file
	let UploadFile = req.files.UploadFile; 	
	var jsontext="";
	//1.2- Not existing doc, just need to add
	// process the RAW JSON parameter: upload the info in the ElasticSearch server.
	if (RawJSON != undefined){
		jsontext = RawJSON;
	}else if (req.files.UploadJSON != undefined){
		jsontext=req.files.UploadJSON.data.toString('utf8'); 
 	//	if (jsontext.length > 0)
	//		jsontext = JSON.stringify(jsontext);
	} 
	var source_proj= get_source_project_json(jsontext);  
	jsontext=update_filename_path_on_json(jsontext, DestFileName, DestPath);
	var storage_path=source_proj.project+"/"+source_proj.source+"/"+DestPath;  
	var result= MetadataModule.register_update_filename_path_json(es_servername+":"+es_port,SERVERDB, jsontext, source_proj.project, source_proj.source, DestFileName, DestPath); 
	result.then((resultResolve) => {
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200,req.connection.remoteAddress,resultResolve.text,currentdate,res.user); 
		//after succeed on the upload of themetadata, we proceed to upload the file 
		var result_upload = upload_file(UploadFile, os.homedir(), File_Server_Path,
			storage_path,DestFileName, 
			res.user,req.connection.remoteAddress,currentdate,"false");//debug=false
		result_upload.then((resultResUp) => {
			res.writeHead(resultResUp.code, {"Content-Type": contentType_text_plain});
			res.end(resultResUp.text+"\n", 'utf-8');
			return;
		},(resultRejectUp)=> { 
			console.log("resultRejectUp.code" +resultRejectUp.code);
			res.writeHead(resultRejectUp.code, {"Content-Type": contentType_text_plain});
			res.end(resultRejectUp.text+"\n", 'utf-8');
			return;
		} );
	},(resultReject)=> {
		res.writeHead(resultReject.code, {"Content-Type": contentType_text_plain});
		res.end(resultReject.text+"\n", 'utf-8')
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"Upload Error",currentdate,res.user); 
		return;
	});//end   
});

//**********************************************************
app.get('/download',middleware.ensureAuthenticated, function(req, res) {
	var fs = require('fs');
	var path = require('path');
	var myPath = "";  
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	//******************************************* 
	var project= find_param(req.body.project, req.query.project);
	project= validate_parameter(project,"project",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (project.length == 0){ 
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"project"+".\n");
		return;}
	//******************************************* 
	var source= find_param(req.body.source, req.query.source);
	source= validate_parameter(source,"source",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (source.length == 0){ 
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"source"+".\n");
		return;}			
	//*******************************************
	var filepath= find_param(req.body.filepath, req.query.filepath);
	filepath= validate_parameter(filepath,"filepath",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (filepath.length == 0){ 
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"filepath"+".\n");
		return;}	
	//*******************************************
	var filename=  find_param(req.body.filename, req.query.filename);
	filename= validate_parameter(filename,"filename",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (filename.length == 0){ 
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"filename"+".\n");
		return;}
	//******************************************* 
	myPath = os.homedir()+ File_Server_Path + '/' + project +'/' + source +'/' + filepath + '/' + filename; 
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
				var resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200,req.connection.remoteAddress,"DONWLOAD granted to file: "+myPath,currentdate,res.user);
			}
		} else {
			returncode=404; 
		} 
	});
	if(returncode!=200){ 
		//res.setHeader(name.value); //only before writeHeader 
		res.writeHead(404, {"Content-Type": contentType_text_plain});
		res.write("\n404: Bad Request, file not found.\n");
		res.end("ERROR File does not exist: "+myPath+"\n");	
		varresultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,404,req.connection.remoteAddress,"DOWNLOAD error: File not found: "+myPath ,currentdate,res.user);
	}
});

//**********************************************************
//example:
// curl -H "Content-Type: text/plain" -XPOST http://localhost:8000/signup?name="bob"\&email="bob@abc.commm"\&pw="1234"
// app.post('/signup',ipfilter(ips, {mode: 'allow'}), function(req, res) {
app.post('/signup', function(req, res) {
	"use strict";
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var name= find_param(req.body.userid, req.query.userid);
	var email= find_param(req.body.email, req.query.email);
	var pw=find_param(req.body.pw, req.query.pw); 
	var resultlog ;
	if (pw == undefined){ 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: SIGNUP Bad Request, missing Passwd.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Passwd",currentdate,""); 
		return ;
	} 
	if (email == undefined){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	} 	     
	console.log("[LOG]: REGISTER USER+PW"); 
	console.log("   " +colours.FgYellow + colours.Bright + " user: " + colours.Reset + email );
	console.log("   " +colours.FgYellow + colours.Bright + " request from IP: " + req.connection.remoteAddress + colours.Reset);
	if(( req.connection.remoteAddress!= ips[0] ) &&( req.connection.remoteAddress!=ips[1])&&( req.connection.remoteAddress!=ips[2])){
		console.log(" ACCESS DENIED from IP address: "+req.connection.remoteAddress);
		var messagea = "REGISTER USER '"+ email + "' FORBIDDEN access from external IP";
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,403,req.connection.remoteAddress,messagea,currentdate,"");
		res.writeHead(403, {"Content-Type": contentType_text_plain});
		res.end("\n403: FORBIDDEN access from external IP.\n");
		return ;
	}
	var result = UsersModule.register_new_user(es_servername+":"+es_port,SERVERDB,  name, email, pw);
	result.then((resultreg) => {
		var messageb = "REGISTER USER '"+ email + "' GRANTED";
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,resultreg.code, req.connection.remoteAddress, messageb,currentdate,""); 
		var verify_flush = my_flush( req);
		verify_flush.then((resolve_result) => {
			res.writeHead(resultreg.code, {"Content-Type": contentType_text_plain});
			res.end("Succeed\n");	
		},(reject_result)=> {
			res.writeHead(reject_result.code, {"Content-Type": contentType_text_plain});
			res.end(reject_result.text+"ERROR FLUSH\n", 'utf-8');
			resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, reject_result.code, req.connection.remoteAddress, reject_result.text+"ERROR FLUSH",currentdate,"");
		});//
	},(resultReject)=> { 
		res.writeHead(resultReject.code, {"Content-Type": contentType_text_plain});
		res.end(resultReject.code+"Bad Request "+resultReject.text+"\n");
		var messagec = "REGISTER USER '"+ email + "' BAD REQUEST";
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, resultReject.code, req.connection.remoteAddress, messagec,currentdate,"");
	} ); 
});

//**********************************************************
//example:
// curl -H "Content-Type: text/plain" -XPOST http://localhost:8000/signup?name="bob"\&email="bob@abc.commm"\&pw="1234"
// app.post('/signup',ipfilter(ips, {mode: 'allow'}), function(req, res) {
app.post('/update_user', function(req, res) {
	"use strict";
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var name= find_param(req.body.userid, req.query.userid);
	var email= find_param(req.body.email, req.query.email);
	var pw=find_param(req.body.pw, req.query.pw); 
	if (pw == undefined){ 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: SIGNUP Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	} 
	if (email == undefined){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,""); 
		return ;
	}  
	if(( req.connection.remoteAddress!= ips[0] ) &&( req.connection.remoteAddress!=ips[1])&&( req.connection.remoteAddress!=ips[2])){ 
		var messagea = "REGISTER USER '"+ email + "' FORBIDDEN access from external IP";
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 403,req.connection.remoteAddress,messagea,currentdate,"");
		res.writeHead(403, {"Content-Type": contentType_text_plain});
		res.end("\n403: FORBIDDEN access from external IP.\n");
		return ;
	}	 
	var result = UsersModule.update_user(es_servername+":"+es_port,SERVERDB,  name, email, pw);
	result.then((resultreg) => { 
		var messageb = "UPDATE USER '"+ email + "' GRANTED";
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, resultreg.code, req.connection.remoteAddress, messageb,currentdate,""); 
		var verify_flush = my_flush( req);
		verify_flush.then((resolve_result) => {
			res.writeHead(resultreg.code, {"Content-Type": contentType_text_plain});
			res.end( "Succceed\n");
		},(reject_result)=> {
			res.writeHead(reject_result.code, {"Content-Type": contentType_text_plain});
			res.end(reject_result.text+"\n", 'utf-8');
		});//
	},(resultReject)=> { 
		res.writeHead(resultReject.code, {"Content-Type": contentType_text_plain});
		res.end("updateuser: Bad Request "+resultReject.text+"\n");
		var messagec = "UPDATE USER '"+ email + "' BAD REQUEST";
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, resultreg.code, req.connection.remoteAddress, messagec,currentdate,"");
	} ); 
});

//**********************************************************
//example:
// curl -H "Content-Type: text/plain" -XGET http://localhost:8000/login?email="bob"\&pw="1234" --output token.txt
app.get('/login', function(req, res) {
	"use strict";
	var resultlog ;
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var email= find_param(req.body.email, req.query.email);
	var pw=find_param(req.body.pw, req.query.pw); 	
	if (pw == undefined){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("400: Bad Request, missing Passwd\n"); 
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400, req.connection.remoteAddress, "400: Bad Request, missing Passwd",currentdate,"");
		return;
	}
	if (email == undefined){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("400: Bad Request, missing Email\n"); 
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400, req.connection.remoteAddress, "400: Bad Request, missing Email",currentdate,"");		
		return;
	}  
	var result = UsersModule.query_count_user_pw( es_servername+":"+es_port,SERVERDB,  email, pw); //returns the count of email-pw, if !=1 then we consider not registered.
	result.then((resultCount) => {
		if(resultCount==1){
			var mytoken= auth.emailLogin(email); 
			res.writeHead(200, {"Content-Type": contentType_text_plain});
			res.end(mytoken);
			resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200, req.connection.remoteAddress, "New token Generated",currentdate,"");
		}else{
			res.writeHead(401, {"Content-Type": contentType_text_plain});
			res.end("401 (Unauthorized) Autentication failed, incorrect user "+ email +" or passwd "+ pw +"\n"); 
			resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 401, req.connection.remoteAddress, 
				"401: Bad Request of Token, incorrect user or passwd "+email+"or passwd "+pw,currentdate,"");
		}
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request "+resultReject+"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400, req.connection.remoteAddress, 
				"400: Bad Token Request "+resultReject,currentdate,"");	
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

tryToOpenServer(SERVERPORT);
