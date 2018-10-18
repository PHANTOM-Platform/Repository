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
process.title = 'PHANTOM-Repository-server';

//****************** VARIABLES OF THE REPOSITORY SERVER, MODIFY DEPENDING ON YOUR DEPLOYMENT *****
	const es_servername = 'localhost';
	const es_port = 9400;
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
	const CommonModule 		= require('./support-common');
	const supportmkdir 		= require('./mkdirfullpath'); 
//*********************** SUPPORT JS file, for TOKENS SUPPORT *******
	var bodyParser	= require('body-parser');
	var cors		= require('cors');
	var auth		= require('./token-auth');
var middleware	= require('./token-middleware');
//*************************** MAPPING OF THE TABLES **************	
const metadatamapping = {
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
const usersmapping = {			 
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
const tokensmapping = { 
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
const logsmapping = { 
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
	var expressWs 		= require('express-ws')(app);
	var app = expressWs.app;
//*******************************************************************
//********************  VARIABLES FOR WSockets **********************
	//*** STORAGE OF USERS
	const max_users=50;
	var totalusers=0;
	var user_ids = new Array(max_users );
	var user_conn = new Array(max_users ); // the connetion of each user
	
	var user_address = new Array(max_users ); // the connetion of each user
	var user_index = new Array(max_users ); // the connetion of each user
	
//*** STORAGE OF PROJECT CONTENTS
	const max_projects= 100;
	const max_mensages=40;
	var totalmensages= [max_projects];
	for (var i = 0; i < max_projects; i++) 
		totalmensages[i]=0;
	var ProjectContents = new Array(max_projects,max_mensages); //10 projects,  stack of max_mensages contents
	
//*** STORAGE OF SUSCRIPTIONS
	const max_suscrip=6;

	var total_project_suscriptions= [max_users]; //for each user
	for (var i = 0; i < max_users; i++)
		total_project_suscriptions[i]=0;
	var ProjectSubscriptions = new Array(max_users,max_suscrip); //stack of "max_suscrip" proj suscr for each user
	
	var total_source_suscriptions= [max_users]; //for each user
	for (var i = 0; i < max_users; i++)
		total_source_suscriptions[i]=0;
	var SourceSubscriptions = new Array(max_users,max_suscrip); //stack of "max_suscrip" proj suscr for each user

	var clients = [ ];// list of currently connected clients (users)
//****************************************************
var zip = require('express-easy-zip');
//**********************************************************
//This function removes double quotation marks if present at the beginning and the end of the input string
function remove_quotation_marks(input_string){
	if(input_string!=undefined){
	if(input_string.charAt(0) === '"') {
		input_string = input_string.substr(1);
	}
	if(input_string.length>0){
	if(input_string.charAt(input_string.length-1) === '"') {
		input_string = input_string.substring(0, input_string.length - 1); 
	}}}
	return (input_string);
}	


function lowercase(input_string){
	var result=""; 
	for (var j = 0; j < input_string.length; j++) {
// 		input_string.replaceAt(j, character.toLowerCase());
        var charCode = input_string.charCodeAt(j);
        if (charCode < 65 || charCode > 90) {
            // NOT an uppercase ASCII character
            // Append the original character
            result += input_string.substr(j, 1);
        } else {
            // Character in the ['A'..'Z'] range
            // Append the lowercase character
            result += String.fromCharCode(charCode + 32);
        }
	} 
	return (result);
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
function update_filename_path_on_json(JSONstring, filename, path){
	var new_json = {  }
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj);
	if (path == undefined) path="";
	if (filename == undefined) filename="";	
	new_json['path']		=path;
	new_json['path'+'_length']	=path.length; //label can not contain points '.' !
	new_json['filename']	=filename;
	new_json['filename'+'_length']=filename.length;	
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=lowercase(label);
		if((label != 'path') && (label != 'filename') && (label != 'path_length') && (label != 'filename_length'))
			new_json[label]=jsonobj[keys[i]];	//add one property
		if( typeof jsonobj[keys[i]] == 'string'){
			new_json[label+'_length']=jsonobj[keys[i]].length;
		}
	} 
	new_json=(JSON.stringify(new_json));
	return new_json;
}

function update_device_length_on_json(JSONstring, device){ 
	var new_json = {  } 
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj);
	if (device == undefined) device="";
	new_json['device']		=device;
	new_json['device_length']	=device.length; 	
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=lowercase(label);
		if((label != 'device') && (label != 'device_length'))
		new_json[label]=jsonobj[keys[i]];	//add one property
		if( typeof jsonobj[keys[i]] == 'string'){
			new_json[label+'_length']=jsonobj[keys[i]].length;
		}
	}
	new_json=(JSON.stringify(new_json));
	return new_json;
}

function update_app_length_on_json(JSONstring, appname){
	var new_json = {  }
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj);
	if (appname== undefined) appname="";
	new_json['app']		=appname;
	new_json['app_length']	=appname.length;
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=lowercase(label);
		if((label != 'app') && (label != 'app_length'))
		new_json[label]=jsonobj[keys[i]];	//add one property
		if( typeof jsonobj[keys[i]] == 'string'){
			new_json[label+'_length']=jsonobj[keys[i]].length;
		}
	}
	new_json=(JSON.stringify(new_json));
	return new_json;
}

function get_source_project_json(JSONstring){
	var myres = { source: "", project: "" };
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj);
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=lowercase(label);
		if(label == 'source')
			myres.source=jsonobj[keys[i]];
		if(label == 'project')
			myres.project=jsonobj[keys[i]];
	} 
	return myres;
}
//*********************************************************************	
// function generate_json_example(){ 
// 	var Employee = {
// 		firstname: "Pedro",
// 		lastname: "Picapiedra"
// 	} 
// 	console.log(Employee);
// 	delete Employee.firstname; //delete one property
// 	var label='age';
// 	Employee[label]="32";		//add one property
// 	console.log(Employee);
// }
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


function update_projectname_length_on_json(JSONstring, projectname){
	var new_json = {  }
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj);
	if(projectname==undefined) projectname="";
	new_json['project']		=projectname;
	new_json['project_length']	=projectname.length;
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=lowercase(label);
		if((label != 'project') && (label != 'project_length'))
		new_json[label]=jsonobj[keys[i]];	//add one property
		if( typeof jsonobj[keys[i]] == 'string'){
			new_json[label+'_length']=jsonobj[keys[i]].length;
		}
	}
	new_json=(JSON.stringify(new_json));
	return new_json;
}
//**********************************************************
function validate_parameter(parameter,label,currentdate,user,address){
	var message_error = "DOWNLOAD Bad Request missing "+label;  
	if (parameter != undefined){  
		parameter = remove_quotation_marks(parameter);
		if (parameter.length > 0)
			return(parameter);
	}
	resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,address,message_error,currentdate, user );
	return undefined;
}

//*********************************************************
function retrieve_file(filePath,res){
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
app.use(zip());

//**********************************************************
/* GET home page. */
app.get('/', function(req, res, next) {	
	var json = {};
	json.message = SERVERNAME + " server is up and running."
	json.release = req.app.get('version');
	json.versions = [ 'v1' ];
	json.current_time = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	res.json(json);
});
//**********************************************************
app.get('/servername', function(req, res, next) {
	res.end(SERVERNAME);
});
//**********************************************************
app.get('/upload_file.html', function(req, res) {
	var filePath = '../web/upload_file.html';
	retrieve_file(filePath,res);
});
//**********************************************************
app.get('/upload_file.html', function(req, res) { 
	var filePath = '../web/upload_file.html';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/download_file.html', function(req, res) { 
	var filePath = '../web/download_file.html';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/examplec.json', function(req, res) { 
	var filePath = '../web/examplec.json';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/query_metadata.html', function(req, res) { 
	var filePath = '../web/query_metadata.html';
	retrieve_file(filePath,res);
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
	var resultlog;
	const message_missing = "DELETE Bad Request missing ";
	var project= find_param(req.body.project, req.query.project);
	if (project == undefined){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:"+message_missing+" Project.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user);
		return;
	}else if(project.length == 0){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400: Empty Project.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user);
		return;
	}

	var source= find_param(req.body.source, req.query.source);
	if ( source == undefined){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:"+message_missing+" source.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user);
		return;
	}else if ( source.length == 0){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400: Empty source.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user);
		return;
	}

	var DestPath= find_param(req.body.Path, req.query.Path);
	if ( DestPath == undefined){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:"+message_missing+" Path.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user);
		return;
	}else if ( DestPath.length == 0){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400: Empty Path.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,message_no_path,currentdate,res.user);
		return;
	}

	var DestFileName = find_param(req.body.DestFileName, req.query.DestFileName);
	if (DestFileName == undefined){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400:"+message_missing+" DestFileName.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port, SERVERDB, 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
		return;
	}else if (DestFileName.length == 0){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("400: Empty DestFileName.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port, SERVERDB, 400,req.connection.remoteAddress,message_no_file,currentdate,res.user);
		return;
	}

	var result= MetadataModule.delete_filename_path_json(es_servername+":"+es_port,SERVERDB, project, source, DestFileName, DestPath);
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
// 		console.error(e); //if not reply is expected an ECONNREFUSED ERROR, we return 503 as not available service
		res.writeHead(503, { 'Content-Type': contentType_text_plain });
		res.end("503", 'utf-8');
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
		//not register log here, because we can not register nothing after delete the DB !!! 
	},(resultReject)=> {
// 		console.log("log: Bad Request: " + resultReject); 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request "+resultReject+"\n"); 
		//not register log here, because the error can be due not existing DB to be drop.
	} );
});
//this function registers a list of mappings with a recursive set of promises
function register_next_mapping (arr_labels, arr_mappings, es_servername, es_port){
	return new Promise( (resolve,reject) => {
		var create_new_map = MetadataModule.new_mapping(es_servername+":"+es_port,SERVERDB, arr_labels[0], arr_mappings[0] );
		create_new_map.then((resultFind) => {
			arr_labels.shift(); //removes the first element of the array
			arr_mappings.shift(); //removes the first element of the array
			var next_result;
			if(arr_labels.length >0 ){
				next_result= register_next_mapping (arr_labels, arr_mappings, es_servername, es_port );
				next_result.then((next_resultFind) => {
					resolve(next_resultFind);
				},(next_resultReject)=> { 
					reject(next_resultReject);
				} ); 
			}else{
				resolve(resultFind);
			} 
		},(resultReject)=> { 
			reject(resultReject);
		} ); 
	});//end of promise
};
//**********************************************************
app.get('/new_db', function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var create_new_db = MetadataModule.new_db(es_servername+":"+es_port,SERVERDB );
	create_new_db.then((resultFind) => {
		var arr_labels = [ 'metadata', 'users', 'tokens', 'logs' ];
		var arr_mappings = [ metadatamapping ,usersmapping, tokensmapping, logsmapping ];
		var create_new_mappings =register_next_mapping (arr_labels, arr_mappings, es_servername, es_port ); 
		create_new_mappings.then((resultFindb) => { 
			res.writeHead(200, {"Content-Type": "application/json"});
			res.end(resultFindb+"\n"); 
			var resultloga = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200,req.connection.remoteAddress,"DB successfully created",currentdate,"");  
		},(resultRejectb)=> { 
			res.writeHead(400, {"Content-Type": contentType_text_plain});
			res.end("\n400: Bad Request "+resultRejectb+"\n");
			var resultlogb = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultRejectb,currentdate,"");
		} );
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request when creating DB "+resultReject+"\n");
		var  resultlogc = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultReject,currentdate,"");
	} );
});
//**********************************************************
app.get('/_flush', function(req, res) { 
	var verify_flush = CommonModule.my_flush(req.connection.remoteAddress,es_servername+':'+es_port, SERVERDB );
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
	var query= MetadataModule.compose_query(project,source,filepath, filename); 
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
function list_of_files(myPath){
	var path = path || require('path');
	var fs = fs || require('fs');
	var filelist = "";
	files = fs.readdirSync(myPath);
	files.forEach(function(file) {
		if (fs.statSync(path.join(myPath, file)).isDirectory()) {
			filelist= filelist+list_of_files(path.join(myPath, file));
		}else{
			filelist= filelist+path.join(myPath, file)+"\n";
		}
	});
	return(filelist);
}

function list_of_files_metadata(project,source, filepath, filename){
	var path = path || require('path');
	var fs = fs || require('fs');
	var filelist = "";
	files = fs.readdirSync(myPath);
	files.forEach(function(file) {
		if (fs.statSync(path.join(myPath, file)).isDirectory()) {
			filelist= filelist+list_of_files(path.join(myPath, file));
		}else{
			filelist= filelist+path.join(myPath, file)+"\n";
		}
	});
	return(filelist);
}//list_of_files_metadata

//**********************************************************
function json_list_of_files(myPath,filelist){
	var path = path || require('path');
	var fs = fs || require('fs');
	files = fs.readdirSync(myPath);
	filelist= "{\"path\": \"" + myPath +"\", \"name\": \""+ myPath + "\" }" ;
// 	files.forEach(function(file) {
// 		if (fs.statSync(path.join(myPath, file)).isDirectory()) {
// 			filelist= filelist+json_list_of_files(path.join(myPath, file),filelist);
// 		}else{
// 			if(registered_path==false){
// 			console.log(" path " + myPath + " file "+file);
// 			if(filelist!=undefined ){
// 				filelist= filelist + ", {\"path\": \"" + myPath + "\" , \"name\": \""+ file +"\" }" ;
// 			}else{
// 				filelist= "{\"path\": \"" + myPath +"\", \"name\": \""+ file+ "\" }" ;
// 			}
// 			console.log("xxx "+ filelist );}
// 		}
// 	});
	return(filelist);
}
//**********************************************************
//TODO: falta confirmar que los archivos existen
//si no existen en el curl parece que se queda esperando indefinidamente
app.post('/upload',middleware.ensureAuthenticated, function(req, res) {
	"use strict";
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	var message_bad_request = "UPLOAD Bad Request missing ";
	var resultlog ;
	if (!req.files){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end('No files were uploaded.');
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,'No files were uploaded.',currentdate,res.user);
		return;
	}
	var RawJSON= find_param(req.body.RawJSON, req.query.RawJSON);

	var DestPath=find_param(req.body.Path,req.query.Path);
	if (DestPath == undefined){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("400:Bad Request, missing Path.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,message_bad_request+"Path",currentdate,res.user);
		return;
	}

	var DestFileName=find_param( req.body.DestFileName , req.query.DestFileName);
	if (DestFileName == undefined){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("400:Bad Request, missing DestFileName.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,message_bad_request+"DestFileName",currentdate,res.user);
		return;
	}else if (DestFileName.length == 0){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("400:Bad Request, Empty DestFileName.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,message_bad_request+"DestFileName",currentdate,res.user);
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
	jsontext=update_filename_path_on_json(jsontext, DestFileName, DestPath); //this adds the field
// 	console.log("send_repo_update_to_suscribers("+source_proj.project + " "+ source_proj.source+")"+jsontext);
	send_repo_update_to_suscribers(source_proj.project, source_proj.source,jsontext);

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
	//var pretty = find_param(req.body.pretty, req.query.pretty);//only used in the sec case
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	//*******************************************
	var project= find_param(req.body.project, req.query.project);
	project= validate_parameter(project,"project",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (project == undefined) project = "";
	if (project.length == 0){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"project"+".\n");
		return;}
	//*******************************************
	var source= find_param(req.body.source, req.query.source);
	source= validate_parameter(source,"source",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (source == undefined) source = "";
	if (source.length == 0){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"source"+".\n");
		return;}
	//*******************************************
	var filepath= find_param(req.body.filepath, req.query.filepath);
	filepath= validate_parameter(filepath,"filepath",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (filepath == undefined) filepath = "";
	if (filepath.length == 0){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"filepath"+".\n");
		return;}
	//*******************************************
	var filename= find_param(req.body.filename, req.query.filename);
	filename= validate_parameter(filename,"filename",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (filename == undefined) filename = "";
	if (filename.length == 0){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"filename"+".\n");
		return;}
	//******************************************* 
	var myPath = os.homedir()+ File_Server_Path + '/' + project +'/' + source +'/' + filepath + '/' + filename;

// START ADDTIONAL FOR SECURED VERSION
// 	// look for NGAC policy here, then decide if continue or not !!	
// 	var query= MetadataModule.compose_query(project,source,filepath, filename);
// 	//1.1- find id of the existing doc for such path filename
// 	var searching = MetadataModule.query_metadata(es_servername+":"+es_port,SERVERDB,query, pretty);
// 	searching.then((resultFind) => {
// 		var domain =findomainjson_first(resultFind);
// 		if(domain.length==0){
// 			domain= 'domain_public';
// 			var label_domain = "not defined domain";
// 		}else{
// 			var label_domain = domain;
// 		}
// 		var permission = request_user_domain_permission(res.user, 'r', domain,0);
// 		permission.then((resultFind) => {
// 			var rescode=0; 
// 			if( resultFind.body == "permit"){
// 				try{
// END ADDTIONAL FOR SECURED VERSION
					// Check if file specified by the filePath exists
					fs.stat(myPath, function(err, stat) {
						if(err == null) {
// 							console.log('File exists');
// 							console.log("myPath "+myPath);
							// Content-type is very interesting part that guarantee that
							// Web browser will handle response in an appropriate manner.
							//fs.createReadStream(myPath).pipe(response);
							var resolvedBase = path.resolve(myPath);
							var stream = fs.createReadStream(resolvedBase);
							//stream.setEncoding('UTF8');
							// Handle non-existent file
							stream.on('error', function(error) {
								console.log("Stream error: "+error);
								res.writeHead(404, {"Content-Type": contentType_text_plain});
								res.write("\n400: stream error.\n");
								res.end("path: "+myPath+"\n");
								return;
							});
							// File exists, stream it to user
							res.writeHead(200, {
								"Content-Type": "application/octet-stream",
								"Content-Disposition": "attachment; filename=" + filename
							});
							stream.pipe(res);
							var resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200,req.connection.remoteAddress,"DONWLOAD granted to file: "+myPath,currentdate,res.user);
							return;
						} else if(err.code == 'ENOENT') {
				// 			console.log('file does not exist\n');
							varresultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,404,req.connection.remoteAddress,"DOWNLOAD error: File not found: "+myPath ,currentdate,res.user);
							//res.setHeader(name.value); //only before writeHeader
							res.writeHead(404, {"Content-Type": contentType_text_plain});
							res.write("\n404: Bad Request, file not found.\n");
							res.end("ERROR File does not exist: "+myPath+"\n");	
							return;
						} else {
				// 			console.log('Some other error: ', err.code);
							res.writeHead(404, {"Content-Type": contentType_text_plain});
							res.write("\n404: Bad Request, file not found.\n");
							res.end("ERROR File does not exist: "+myPath+"\n");
							return;
						}
// START ADDTIONAL FOR SECURED VERSION
// 					});
// 				}catch(e){
// 					console.log("Stream error: "+e);
// 					res.writeHead(404, {"Content-Type": contentType_text_plain});
// 					res.write("\n400: stream e.\n");
// 					res.end("path: "+myPath+"\n");
// 					return;
// 				}
// 			}else {
// 				var rescode=400;
// 				var resend="unexpected error "+resultFind.body;
// 				if( resultFind.body == "deny"){
// 					rescode=403;
// 					resend="Access denied";
// 				}
// 				res.writeHead(rescode, {'Content-Type': contentType_text_plain });
// 				res.write("    The userid is: "+res.user+"\n");
// 				res.write("    The domain of the file is: "+label_domain+" \n");
// 				res.write("    The access to the file is: "+resultFind.body+"\n");
// 				res.end("    "+rescode+": "+resend);
// 			}
// 		},(resultReject)=> {
// 			res.writeHead(400, {'Content-Type': contentType_text_plain });
// 			res.end("400 unexpected error "+resultReject);
// 		} );
// // 		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,200,req.connection.remoteAddress,"QUERY METADATA granted to query:"
// // 			+JSON.stringify(query),currentdate,res.user);
// 	},(resultReject)=> {
// 		res.writeHead(400, {"Content-Type": contentType_text_plain});
// 		res.end("querymetadata: Bad Request "+resultReject +"\n");
// // 		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"QUERY METADATA BAD Request on query:" 
// // 			+JSON.stringify(query),currentdate,res.user);
// END SECURED VERSION
	});
});

//*****
// quiero que de la lista de los dominios de cada fichero en la lista
// si no tiene dominio imprimimos dominio_public
// si no tiene metadata imprimimos dominio_public
//**********************************************************
app.get('/downloadlist',middleware.ensureAuthenticated, function(req, res) {
	var fs = require('fs');
	var path = require('path');
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	var filename = undefined;
	var filepath = undefined;
	//******************************************* 
	var project= find_param(req.body.project, req.query.project);
	project= validate_parameter(project,"project",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (project != undefined)
	if (project.length == 0){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"project"+".\n");
		return;}
	var myPath = os.homedir()+ File_Server_Path + '/' + project ;
	//******************************************* 
	var source= find_param(req.body.source, req.query.source);
	source= validate_parameter(source,"source",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (source != undefined)
	if (source.length != 0){
		myPath = os.homedir()+ File_Server_Path + '/' + project +'/' + source ;
		//*******************************************
		filepath= find_param(req.body.filepath, req.query.filepath);
		filepath= validate_parameter(filepath,"filepath",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
		if (filepath != undefined)
		if (filepath.length != 0){
			myPath = os.homedir()+ File_Server_Path + '/' + project +'/' + source +'/' + filepath ;
			//*******************************************
			filename= find_param(req.body.filename, req.query.filename);
			filename= validate_parameter(filename,"filename",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
		}
	}

//Maybe look for NGAC policy here, then decide if continue or not !!

	// Check if file specified by the filePath exists
	fs.stat(myPath, function(err, stat) {
		if(err == null) {
			res.end(list_of_files(myPath));
// 			res.end(list_of_files_metadata(project,source, filepath, filename));
		} else if(err.code == 'ENOENT') {
			// file does not exist
			varresultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,404,req.connection.remoteAddress,"DOWNLOAD-LIST error: File not found: "+myPath ,currentdate,res.user);
			//res.setHeader(name.value); //only before writeHeader
			res.writeHead(404, {"Content-Type": contentType_text_plain});
			res.write("\n404: Bad Request, file not found.\n");
			res.end("ERROR File does not exist: "+myPath+"\n");
			return;
		} else {
			res.writeHead(404, {"Content-Type": contentType_text_plain});
			res.write("\n404: Bad Request, file not found.\n");
			res.end("ERROR File does not exist: "+myPath+"\n");
			return;
		}
	});
});

//**********************************************************
app.get('/downloadzip',middleware.ensureAuthenticated, function(req, res) {
	var fs = require('fs');
	var path = require('path');
// 	var pretty = find_param(req.body.pretty, req.query.pretty);
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	var filepath=undefined;
	var filename=undefined;
	//******************************************* 
	var project= find_param(req.body.project, req.query.project);
	project= validate_parameter(project,"project",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (project != undefined)
	if (project.length == 0){
		res.writeHead(400, {'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing "+"project"+".\n");
		return;}
	var myPath = os.homedir()+ File_Server_Path + '/' + project ;
	var myDest = project ;
	//******************************************* 
	var source= find_param(req.body.source, req.query.source);
	source= validate_parameter(source,"source",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if (source != undefined)
	if (source.length != 0){
		myPath = os.homedir()+ File_Server_Path + '/' + project +'/' + source ;
		myDest = project +'/' + source ;
		//*******************************************
		filepath= find_param(req.body.filepath, req.query.filepath);
		filepath= validate_parameter(filepath,"filepath",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
		if (filepath != undefined)
		if (filepath.length != 0){
			myPath = os.homedir()+ File_Server_Path + '/' + project +'/' + source +'/' + filepath ;
			myDest = project +'/' + source +'/' + filepath;
			//*******************************************
			filename= find_param(req.body.filename, req.query.filename);
			filename= validate_parameter(filename,"filename",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
		}
	}
// console.log("pretty "+pretty);
// console.log("project "+project);
// console.log("myPath "+myPath);
// console.log("source "+source);
// console.log("filepath "+filepath);
// console.log("myDest "+myDest);
// console.log("filename "+filename);
// console.log("res.user "+res.user);
// project example7
// myPath /nas_home//hpcjmont/phantom_servers/phantom_repository/example7/user
// source user
// filepath undefined
// myDest example7/user
// filename undefined
// res.user gtzanettis@wings-ict-solutions.eu

//	//START OF SECURED VERSION CODE	
// 	var query_permission =request_permission(res.user,pretty, project,source,filepath, filename);
// 	query_permission.then((result) => {
// 		for (var j = 0; j < result.totalkeys; j++) {
// 			console.log("permission "+j+" "+result.permission[j]);
// 			if(result.permission[j] == "deny"){//permision denied
// 				res.writeHead(403, {"Content-Type": contentType_text_plain});
// 				res.end("Access DENY: You may not have permission to download some file in the folder\n");
// 			}else if (result.permission[j] != "permit"){//error procesing the request
// 				res.writeHead(400, {"Content-Type": contentType_text_plain});
// 				res.end("ERROR processing the permissions\n");
// 				return;
// 			}
// 		}
// 	//END OF SECURED VERSION CODE
		var zipfile ="download_repo_zip";
		// Check if file specified by the filePath exists
		try{
			fs.stat(myPath, function(err, stat) {
				if(err == null) {
					var filelist=undefined;
		// 			filelist=json_list_of_files(myPath,filelist);
					var path = path || require('path');
					var fs = fs || require('fs');
					files = fs.readdirSync(myPath);
					filelist= "{\"path\": \"" + myPath +"\", \"name\": \""+ myDest + "\" }";
	// 				console.log(JSON.stringify(JSON.parse("[" + filelist+ "]"), null, 4 ));
					if(filelist!=undefined ){
// 						var algo= new Promise( (resolve,reject) => {
								try{
		// 							res.zip({
		// 								files: [
		// 									{content: 'content',
		// 									name: 'description.txt',
		// 									mode: 0755,
		// 									comment: 'File-Downloaded-From-Repository',
		// 									date: new Date(),
		// 									type: 'file' },
		// 								filelist],
		// 								filename: zipfile+'.zip'
		// 							})
									res.zip({
										files: [
											filelist],
										filename: zipfile+'.zip'
									})
									.then(function(obj){
										resolve(" succeeed");//if zip failed
		// 								var zipFileSizeInBytes = obj.size;
		// 								var ignoredFileArray = obj.ignored;
									})
									.catch(function(err){
										reject (err ); //if zip failed
									});
								}catch(eb){
									reject("Stream-2 error: "+eb);
								}
// 						});
// 						algo.then((resultResolve) => {
// 							console.log(resultResolve);
							return;
// 						},(resultReject)=> {
// 							res.writeHead(400, {"Content-Type": contentType_text_plain});
// 							res.write( "[Error]: "+resultReject, 'utf-8');
// 							res.end("path: "+myPath+"\n"+zipfile+'.zip'+"\n");
// 							return;
// 						});
					}else{
						res.end("files not found in that directory");
						return;
					}
				} else if(err.code == 'ENOENT') {
					// file does not exist 
					varresultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,404,req.connection.remoteAddress,"DOWNLOAD-LIST error: File not found: "+myPath ,currentdate,res.user);
					//res.setHeader(name.value); //only before writeHeader
					res.writeHead(404, {"Content-Type": contentType_text_plain});
					res.write("\n404: Bad Request, file not found.\n");
					res.end("ERROR File does not exist: "+myPath+"\n");
					return;
				} else {
					res.writeHead(404, {"Content-Type": contentType_text_plain});
					res.write("\n404: Bad Request, file not found.\n");
					res.end("ERROR File does not exist: "+myPath+"\n");
					return;
				}
			});
		}catch(e){
			console.log("Stream-2 error: "+e);
			res.writeHead(404, {"Content-Type": contentType_text_plain});
			res.write("\n400: stream-2: "+e+" \n");
			res.end("path: "+myPath+"\n");
			return;
		}

// //START OF SECURED CODE
// 	},(resultReject)=> {
// 		res.writeHead(400, {"Content-Type": contentType_text_plain});
// 		res.end("ERROR: "+resultReject+"\n");
// 		return;
// 	});
// //END OF SECURED CODE
		
	//*******************************************
// 	res.zip({files: [ {content: 'downloaded from the PHANTOM REPOSITORY', name: 'test-file', mode: 0755, comment: zipfile, date: new Date(), type: 'file' },
// 			{path: myPath, name: 'uploads' } ], filename: zipfile+'.zip' });
// 	res.zip({
// 		files: [
// 			{path: myPath, name: zipfile }
// 		],
// 		filename: zipfile+'.zip'
// 	});
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
	}else if(pw.length == 0){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: SIGNUP Bad Request, empty Passwd.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"SIGNUP Bad Request, Empty Passwd",currentdate,"");
		return ;
	}
	if (email == undefined){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,"");
		return ;
	}else if (email.length == 0){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request, Empty Email.\n");
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"SIGNUP Bad Request, Empty Email",currentdate,"");
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
	var result = UsersModule.register_new_user(es_servername+":"+es_port,SERVERDB, name, email, pw);
	result.then((resultreg) => {
		var messageb = "REGISTER USER '"+ email + "' GRANTED";
		resultlog = LogsModule.register_log( es_servername+":"+es_port,SERVERDB,resultreg.code, req.connection.remoteAddress, messageb,currentdate,"");
		var verify_flush = CommonModule.my_flush( req.connection.remoteAddress,es_servername+':'+es_port, SERVERDB);
		verify_flush.then((resolve_result) => {
			res.writeHead(resultreg.code, {"Content-Type": contentType_text_plain});
			res.end("Succeed\n");
		},(reject_result)=> {
			res.writeHead(reject_result.code, {"Content-Type": contentType_text_plain});
			res.end(reject_result.text+": ERROR FLUSH\n", 'utf-8');
			resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, reject_result.code, req.connection.remoteAddress, reject_result.text+"ERROR FLUSH",currentdate,"");
		});//
	},(resultReject)=> {
		res.writeHead(resultReject.code, {"Content-Type": contentType_text_plain});
		res.end(resultReject.code+": Bad Request "+resultReject.text+"\n");
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
	}else if (pw.length == 0){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: SIGNUP Bad Request, Empty Email.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"SIGNUP Bad Request, Empty Email",currentdate,"");
		return ;
	}
	if (email == undefined){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request, missing Email.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"SIGNUP Bad Request, missing Email",currentdate,"");
		return ;
	}else if (email.length == 0){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request, Empty Email.\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"SIGNUP Bad Request, Empty Email",currentdate,"");
		return ;
	}
	if(( req.connection.remoteAddress!= ips[0] ) &&( req.connection.remoteAddress!=ips[1])&&( req.connection.remoteAddress!=ips[2])){
		var messagea = "REGISTER USER '"+ email + "' FORBIDDEN access from external IP";
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 403,req.connection.remoteAddress,messagea,currentdate,"");
		res.writeHead(403, {"Content-Type": contentType_text_plain});
		res.end("\n403: FORBIDDEN access from external IP.\n");
		return ;
	}
	var result = UsersModule.update_user(es_servername+":"+es_port,SERVERDB, name, email, pw);
	result.then((resultreg) => {
		var messageb = "UPDATE USER '"+ email + "' GRANTED";
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, resultreg.code, req.connection.remoteAddress, messageb,currentdate,"");
		var verify_flush = CommonModule.my_flush( req.connection.remoteAddress,es_servername+':'+es_port, SERVERDB);
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
	}else if (pw.length == 0){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("400: Bad Request, Empty Passwd\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400, req.connection.remoteAddress, "400: Bad Request, Empty Passwd",currentdate,"");
		return;
	}
	if (email == undefined){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("400: Bad Request, missing Email\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400, req.connection.remoteAddress, "400: Bad Request, missing Email",currentdate,"");
		return;
	}else if (email.lenth == 0){
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("400: Bad Request, Empty Email\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400, req.connection.remoteAddress, "400: Bad Request, Empty Email",currentdate,"");
		return;
	}
	var result = UsersModule.query_count_user_pw( es_servername+":"+es_port,SERVERDB, email, pw); //returns the count of email-pw, if !=1 then we consider not registered.
	result.then((resultCount) => {
		if(resultCount==1){
			var mytoken= auth.emailLogin(email); 
			res.writeHead(200, {"Content-Type": contentType_text_plain});
			res.end(mytoken);
			resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200, req.connection.remoteAddress, "New token Generated",currentdate,"");
		}else{
			res.writeHead(401, {"Content-Type": contentType_text_plain});
			res.end("401 (Unauthorized) Autentication failed, incorrect user " +" or passwd " +"\n"); 
			resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 401, req.connection.remoteAddress,
				"401: Bad Request of Token, incorrect user or passwd "+email+"or passwd ",currentdate,"");
		}
	},(resultReject)=> {
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request "+resultReject+"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400, req.connection.remoteAddress, 
				"400: Bad Token Request "+resultReject,currentdate,"");	
	} );
}); // login
function originIsAllowed(origin) {
	// put logic here to detect whether the specified origin is allowed.
	return true;
};

//report on the screen the list of fields, and values
function consolelogjsonws(JSONstring ){
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj);
	var myres = { user: "", project: "" , source: ""};
	for (var i = 0; i < keys.length; i++) {
		var labeltxt=Object.getOwnPropertyNames(jsonobj)[i];
		labeltxt=lowercase(labeltxt);
		if(labeltxt == 'user') {
			myres.user = jsonobj[keys[i]];
		}else if(labeltxt == 'project') {
			myres.project = jsonobj[keys[i]];
		}else if(labeltxt == 'source') {
			myres.source = jsonobj[keys[i]];
		}
	}
	return myres;
};

function send_repo_update_to_suscribers(projectname,sourcename, jsontext){
	//*******************************************************************
	if(projectname != undefined)
	if(projectname.length > 0){
		//Now we find the suscribed users and we send copy
		for (var u = 0; u < max_users; u++) {
			var found_sucrip=false;
			var i=0;
			while(i< total_project_suscriptions[u] && found_sucrip==false){
				if(ProjectSubscriptions[u,i]==projectname){
					found_sucrip=true;
				}else{
					i++;
				}
			}
			if(found_sucrip==true){
				//we send the copy because we found the SUSCRIPTION
				console.log("Forwarding to suscribed user: "+user_ids[u] + " Project: "+ projectname);
				//user_conn[u].send("{\"project modified \":\""+projectname+"\" }");
				user_conn[u].send(jsontext);
				return;//then not send the the json two times, in case user also suscribed to the sourcename
			}
		}
	}

	if(sourcename != undefined)
	if(sourcename.length > 0){
		//Now we find the suscribed users and we send copy
		for (var u = 0; u < max_users; u++) {
			var found_sucrip=false;
			var i=0;
			while(i< total_source_suscriptions[u] && found_sucrip==false){
				if(SourceSubscriptions[u,i]==sourcename){
					found_sucrip=true;
				}else{
					i++;
				}
			}
			if(found_sucrip==true){
				//we send the copy because we found the SUSCRIPTION
				console.log("Forwarding to suscribed user: "+user_ids[u] + " Source: "+ sourcename);
				//user_conn[u].send("{\"project modified \":\""+sourcename+"\" }");
				user_conn[u].send(jsontext);
			}
		}
	}
};

function find_pos_user_address(client_address){
	var i=0;
	while (i<totalusers && user_address[i] != client_address){
		i=i+1;
	}
	return i;
}

app.ws('/', function(ws_connection, req) {
	var client_address = ws_connection._socket.remoteAddress + ":" + ws_connection._socket.remotePort;
	var user_input;
	if(!originIsAllowed(ws_connection._socket.remoteAddress)) {
		// Make sure we only accept requests from an allowed origin
		req.reject();
		console.log((new Date()) + ' Connection rejected from origin '+ client_address);
		return;
	}
	console.log((new Date()) + ' Connection accepted from ' + client_address);
	// we need to know client index to remove them on 'close' event
	var index = clients.push(ws_connection) - 1;
	var user_id = max_users; //no valid value to represent not defined
	//******************************************
	// received a message from the user 
	ws_connection.on('message', function(message) { //received message is message
		user_input = consolelogjsonws( message );
		user_id=find_pos_user_address(client_address);
		if(user_id==totalusers){//address not registered, we add it at the end of the list
			user_id=0;
			//we look if there is any position was free in the list before the last used
			while(user_id<totalusers && user_address[user_id]!= undefined ){
				user_id=user_id+1;
			}
			if(user_id==totalusers && totalusers<max_users){//we don't found such free position, then the list increases in one position
				totalusers=totalusers+1;
			}
		}
		if(user_id==max_users){
			console.log("error, list of suscriptions full, we can not register new one");
			return;
		}
		user_address[user_id]=client_address;
		user_index[user_id]=index;
		user_ids[user_id]=user_input.user;//only for debuging
		user_conn[user_id]=ws_connection;
		//compose the message describing the update of suscription
		var update_suscription_msg = {};
		update_suscription_msg["user"]= user_input.user;
		if(user_input.project != undefined)
		if(user_input.project.length > 0){
			update_suscription_msg ["suscribed_to_project"] = user_input.project;
		}
		if(user_input.source != undefined)
		if(user_input.source.length > 0){
			update_suscription_msg["suscribed_to_source"] = user_input.source;
		}
		console.log(JSON.stringify(update_suscription_msg));
		ws_connection.send(JSON.stringify(update_suscription_msg));
// 		console.log((new Date()) + ' Received Suscription from ' + user_input.user + ': ' + message );
		//**********************************************************************
		//first we need find if the user_id already suscribed, if not then we add the new suscription
		//**********************************************************************
		//adding suscriptoin on PROJECTS:
		var found_susc=false;
		if(user_input.project!=undefined)
		if(user_input.project.length > 0){
			for (var i = 0; i < total_project_suscriptions[user_id]; i++)
				if(ProjectSubscriptions[user_id,i]==user_input.project) {
					found_susc=true;
// 					console.log("found previous suscription adding at "+user_id+" "+i);
				}
			if(found_susc==false){
				console.log("not found previous project suscription adding at "+user_id+" "+total_project_suscriptions[user_id]+ ": "+user_input.project);
				ProjectSubscriptions[user_id,total_project_suscriptions[user_id]]=user_input.project;
				total_project_suscriptions[user_id]=total_project_suscriptions[user_id]+1;
			}
		}
		//**********************************************************************
		//adding suscriptoin on SOURCEs:
		found_susc=false;
		if(user_input.source!=undefined)
		if(user_input.source.length > 0){
			for (var i = 0; i < total_source_suscriptions[user_id]; i++)
				if(SourceSubscriptions[user_id,i]==user_input.source) {
					found_susc=true;
// 					console.log("found previous suscription adding at "+user_id+" "+i);
				}
			if(found_susc==false){
				console.log("not found previous source suscription adding at "+user_id+" "+total_source_suscriptions[user_id]+ ": "+user_input.source);
				SourceSubscriptions[user_id,total_source_suscriptions[user_id]]=user_input.source;
				total_source_suscriptions[user_id]=total_source_suscriptions[user_id]+1;
			}
		}
		user_input.project=undefined;
		user_input.source=undefined;
	});
	
	// EPIPE means that writing of (presumably) the HTTP request failed
	// because the other end closed the connection.
	ws_connection.on('error', function(e){
		console.log("socket error:"+ e);
	});

	// user disconnected
	ws_connection.on('close', function(reasonCode, description) {
// 		console.log((new Date()) + ' Peer: ' + client_address + ' disconnected.'+ 'user is: '+ user_input.user);
		var i=find_pos_user_address(client_address);
		if(i<totalusers) {
			user_address[i]=undefined;
			total_project_suscriptions[i]=0;
			total_source_suscriptions[i]=0;
			// remove user from the list of connected clients
			clients.splice(user_index[i], 1);
		}
	});
});

// set up error handler
function errorHandler (err, req, res, next) {
	if(req.ws){
		console.error("ERROR from WS route - ", err);
	} else {
		console.error("ERROR from WS: " +err);
		res.setHeader('Content-Type', 'text/plain');
		res.status(500).send(err.stack);
	}
}
app.use(errorHandler);

// app.use(function (err, req, res) {
//	log.error('Error on path %s\n%s\n', req.url, err.stack);
//	res.status(500).send((process.env.NODE_ENV == 'production') ? 'Internal Server Error' : err.stack.replace(/(?:\r\n|\r|\n)/g, '<br />'));
// });
//**********************************************************
app.all("*", function(req, res) {
	const url = require('url');
	res.writeHead(400, {"Content-Type": contentType_text_plain});
	//req.method  used for indentify the request method GET, PUT, POST, DELETE
	res.end("[ERROR]: the requested path: \""+ url.parse(req.url).pathname +"\" for the method \""+ req.method +"\" is not implemented in the current version.\n", 'utf-8');
	return;
});
//**********************************************************
var tryToOpenServer = function(port)
{
	console.log('trying to Open port: ' + port);
	console.log('we will get an error IF there is other server running on the same port');
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
