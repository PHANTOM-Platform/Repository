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
process.title = 'PHANTOM-Resource-Manager-server';

//****************** VARIABLES OF THE REPOSITORY SERVER, MODIFY DEPENDING ON YOUR DEPLOYMENT *****
	const es_servername = 'localhost';
	const es_port = 9400;
	const ips = ['::ffff:127.0.0.1','127.0.0.1',"::1"];
	const SERVERNAMElong ="PHANTOM Resource Manager";
	const SERVERNAME ='PHANTOM Resource Manager';
	const SERVERPORT = 8600;
	const SERVERDB = "resource_db";
	
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
	const colours 		= require('./colours');
//********************* SUPPORT JS file, for DB functionalities *****
	const MetadataModule = require('./support-metadata'); 
	const UsersModule 	= require('./support-usersaccounts');
	const LogsModule 	= require('./support-logs');
	const CommonModule 	= require('./support-common');
	const supportmkdir 	= require('./mkdirfullpath'); 
	const TasksModule	= require('./support-tasks-man');
	const DeviceModule	= require('./support-devices-man');
	const ExecsModule	= require('./support-execs-man');
	//*********************** SUPPORT JS file, for TOKENS SUPPORT *******
	var bodyParser	= require('body-parser');
	var cors		= require('cors');
	var auth		= require('./token-auth');
	var middleware	= require('./token-middleware');
//*************************** MAPPING OF THE TABLES WHEN BEING CREATED, ADDITIONAL FIELDS WILL BE ADD ON DEMAND DURING RUNNING TIME **************
const devicemapping = {
	"devices": {
		"properties": {
			"device": {
				"type": "string",
				"index": "analyzed"
			},
			"device_length":{
				"type": "int"				
			},
			"device_length": { // this field is registered for quering purposes
				"type": "short"
			},
			"cpu_type": { 
				"type": "string",
				"index": "analyzed"
			},
			"cpu_cores": { //Example: 4
				"type": "short"
			},
			"ram_size_bytes": { //Example 1gb_ram 1073741824
				"type": "long"
			},
			"gpu_type": { 
				"type": "string", //Example: NA, "Nvidia GTX960"
				"index": "analyzed"
			},
			"gpu_ram": { 
				"type": "string", //Example: NA, "1GB"
				"index": "analyzed"
			},
			"fpga_type": { //Example NA, "Zynq 7020"
				"type": "string",
				"index": "analyzed"
			},
			"fpga_logic_gates": { 
				"type": "long"
			},
			"hide":{//Delete devices will be not allowed due to consistency in the DB, this field allow to hide the device when listing
				"type": "string", //Example "true" to hide in list, any other value will not hide the device
				"index": "not_analyzed"
			}
		} 
	}
};

const statusmapping = { //the idea is keep a single entry, the evolution of load will be stored in the Monitoring Server, because we wish the APP manager-DB be small and light
	"devices_status": {
		"properties": {
			"device_id":{
				"type": "string", //this is the id from the table devices
				"index": "not_analyzed"				
			},
			"device_id_length":{
				"type": "int"				
			},
			"cpu_load": { // the used percentage of the cpu 
				"type": "float"
			},
			"ram_load": {  // the used percentage of the available ram 
				"type": "float"
			},
			"swap_load": { // the used percentage of the available swap
				"type": "string",
				"index": "not_analyzed" //for avoid hacking when using incomplete pw.
			},
			"network_load": { // as b/s, an integer because the smallest unit is a byte
				"type": "long"
			},
			"io_load": { // as b/s, an integer because the smallest unit is a byte
				"type": "long"
			},
			"timestamp": { // 
				"type": "date",
				"store": "yes",
				"format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
				"index": "analyzed"
			}
		}
	}
};
const execsmapping = {
	"executions_status": {
		"properties": {
			"app": { // the used percentage of the cpu 
				"type": "string", //Example: NA, Nvidia GTX960
				"index": "analyzed"
			},
			"app_length":{
				"type": "int"				
			},
			"device": { // the used percentage of the cpu 
				"type": "string", //Example: NA, Nvidia GTX960
				"index": "analyzed"
			},
			"start_timestamp": { //  
				"type": "date",
				"store": "yes",
				"format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
				"index": "analyzed"
			},
			"end_timestamp": { //  
				"type": "date",
				"store": "yes",
				"format": "yyyy-MM-dd'T'HH:mm:ss.SSS",
				"index": "analyzed"
			},
			"energy": { // as J
				"type": "float"
			}		
		}
	}
};
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
};
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
};
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
};
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
} ; 

	var expressWs 		= require('express-ws')(app); 
	var app = expressWs.app;
//*******************************************************************
//********************  VARIABLES FOR WSockets **********************
	//*** STORAGE OF USERS
	const max_users=5; 
	var totalusers=0;
	var user_ids = new Array(max_users ); 
	var user_conn = new Array(max_users ); // the connetion of each user
	
	var user_address = new Array(max_users ); // the connetion of each user
	var user_index = new Array(max_users ); // the connetion of each user
	
//*** STORAGE OF PROJECT CONTENTS
	const max_projects= 10;
	const max_mensages=4;
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
	
	var total_device_suscriptions= [max_users]; //for each user
	for (var i = 0; i < max_users; i++) 
		total_device_suscriptions[i]=0;
	var DeviceSubscriptions = new Array(max_users,max_suscrip); //stack of "max_suscrip" proj suscr for each user
	
	var total_exec_suscriptions= [max_users]; //for each user
	for (var i = 0; i < max_users; i++) 
		total_exec_suscriptions[i]=0;
	var ExecSubscriptions = new Array(max_users,max_suscrip); //stack of "max_suscrip" proj suscr for each user
	

	var clients = [ ];// list of currently connected clients (users) 

//****************************************************
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
function update_filename_path_on_json(JSONstring, filename, path){ 
	var new_json = {  }  
	var jsonobj = JSON.parse(JSONstring);
	var keys = Object.keys(jsonobj); 
	new_json['path']		=path;
	new_json['path'+'_length']	=path.length; //label can not contain points '.' !
	new_json['filename']	=filename;
	new_json['filename'+'_length']=filename.length;	
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=label.toLowerCase();
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
	new_json['device']		=device;
	new_json['device_length']	=device.length; 	
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=label.toLowerCase();
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
	new_json['app']		=appname;
	new_json['app_length']	=appname.length; 	
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=label.toLowerCase();
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
		label=label.toLowerCase();
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
	new_json['project']		=projectname;
	new_json['project_length']	=projectname.length; 	
	for (var i = 0; i < keys.length; i++) {
		var label=Object.getOwnPropertyNames(jsonobj)[i];
		label=label.toLowerCase();
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
//********************************************************** 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use(fileUpload());


 
//**********************************************************
/* GET home page. */
app.get('/', function(req, res, next) {	
	var json = {};
	json.message = SERVERNAMElong + " server is up and running."
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
app.get('/appmanager.html', function(req, res) {
	var filePath = '../web/appmanager.html';
	retrieve_file(filePath,res);
});
//**********************************************************
app.get('/appmanager.css', function(req, res) {
	var filePath = '../web/appmanager.css';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/appmanager.js', function(req, res) {
	var filePath = '../web/appmanager.js';
	retrieve_file(filePath,res);
});


//*******************************
app.get('/phantom.gif', function(req, res) {
	var filePath = '../web/phantom.gif';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/app_new.html', function(req, res) {
	var filePath = '../web/app_new.html';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/app_update.html', function(req, res) {
	var filePath = '../web/app_update.html';
	retrieve_file(filePath,res);
}); 
//*******************************
app.get('/app_list.html', function(req, res) {
	var filePath = '../web/app_list.html';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/app_update1.json', function(req, res) {
	var filePath = '../web/app_update1.json';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/app_update2.json', function(req, res) {
	var filePath = '../web/app_update2.json';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/app_update3.json', function(req, res) {
	var filePath = '../web/app_update3.json';
	retrieve_file(filePath,res);
});




//*******************************
app.get('/devicemanager.html', function(req, res) {
	var filePath = '../web/devicemanager.html';
	retrieve_file(filePath,res);
}); 
//*******************************
app.get('/device_new.html', function(req, res) {
	var filePath = '../web/device_new.html';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/device_update.html', function(req, res) {
        var filePath = '../web/device_update.html';
        retrieve_file(filePath,res);
}); 
//*******************************
app.get('/device_list.html', function(req, res) {
	var filePath = '../web/device_list.html';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/device_update1.json', function(req, res) {
	var filePath = '../web/device_update1.json';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/device_update2.json', function(req, res) {
	var filePath = '../web/device_update2.json';
	retrieve_file(filePath,res);
});
//*******************************


app.get('/executionmanager.html', function(req, res) {
	var filePath = '../web/executionmanager.html';
	retrieve_file(filePath,res);
}); 
//*******************************
app.get('/exec_new.html', function(req, res) {
	var filePath = '../web/exec_new.html';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/exec_update.html', function(req, res) {
	var filePath = '../web/exec_update.html';
	retrieve_file(filePath,res);
}); 
//*******************************
app.get('/exec_list.html', function(req, res) {
	var filePath = '../web/exec_list.html';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/exec_update1.json', function(req, res) {
	var filePath = '../web/exec_update1.json';
	retrieve_file(filePath,res);
});
//*******************************
app.get('/exec_update2.json', function(req, res) {
	var filePath = '../web/exec_update2.json';
	retrieve_file(filePath,res);
});
//*******************************


app.get('/query_metadata.html', function(req, res) { 
	var filePath = 'web/query_metadata.html';
	retrieve_file(filePath,res);
}); 
//*******************************
app.get('/PleaseEnableJavascript.html', function(req, res) { 
	var filePath = 'web/PleaseEnableJavascript.html';
	retrieve_file(filePath,res);
}); 
//***********************************
// Path only accesible when Authenticated
app.get('/private',middleware.ensureAuthenticated, function(req, res) {
	var message = "\n\nAccess to restricted content !!!.\n\n"
		res.writeHead(200, { 'Content-Type': contentType_text_plain});
		res.end(message, 'utf-8');
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
	var searching = MetadataModule.drop_db(es_servername+":"+es_port, SERVERDB );
	searching.then((resultFind) => { 
		res.writeHead(200, {"Content-Type": contentType_text_plain});
		res.end("200: "+resultFind+"\n"); 
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
		var arr_labels = [ 'metadata', 'users', 'tokens', 'logs', 'devices_status', 'devices', 'executions_status' ];
		var arr_mappings = [ metadatamapping ,usersmapping, tokensmapping, logsmapping, statusmapping, devicemapping, execsmapping ];
		var create_new_mappings =register_next_mapping (arr_labels, arr_mappings, es_servername, es_port ); 
		create_new_mappings.then((resultFind_map) => { 
			res.writeHead(200, {"Content-Type": "application/json"});
			res.end(resultFind_map+"\n"); 
			var resultlog_map = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 200,req.connection.remoteAddress,"DB successfully created",currentdate,"");
		},(resultReject_map)=> { 
			res.writeHead(400, {"Content-Type": contentType_text_plain});
			res.end("\n400: Bad Request "+resultReject_map+"\n");
			var resultlogb = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultReject_map,currentdate,"");
		} );
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("\n400: Bad Request when creating DB "+resultReject+"\n");
		var resultlogc = LogsModule.register_log(es_servername+":"+es_port,SERVERDB, 400,req.connection.remoteAddress,"Bad Request "+resultReject,currentdate,"");
	} );
});
//**********************************************************
app.get('/_flush', function(req, res) { 
	var verify_flush = CommonModule.my_flush(req.connection.remoteAddress ,es_servername+':'+es_port, SERVERDB );
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
	var bodyquery= TasksModule.compose_query(project,source,filepath, filename); 
	//1.1- find id of the existing doc for such path filename
	//console.log("Qquery is "+JSON.stringify(bodyquery));
	var searching = TasksModule.query_metadata(es_servername+":"+es_port,SERVERDB,bodyquery, pretty);
	var resultlog="";
	searching.then((resultFind) => { 
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,200,req.connection.remoteAddress,"QUERY METADATA granted to query:"
			+JSON.stringify(bodyquery),currentdate,res.user);
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("querymetadata: Bad Request "+resultReject +"\n");
		resultlog = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"QUERY METADATA BAD Request on query:" 
			+JSON.stringify(bodyquery),currentdate,res.user); 
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
	var searching = TasksModule.query_metadata(es_servername+":"+es_port,SERVERDB, mybody_obj, pretty); //.replace(/\//g, '\\/');
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
function register_device(req, res,new_device){
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");  
	var message_bad_request = "UPLOAD Bad Request missing ";
	var resultlog ; 
	if (!req.files){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end('No files were uploaded.'); 
		resultlog = LogsModule.register_log(es_servername + ":" + es_port,SERVERDB, 400,req.connection.remoteAddress,'No files were uploaded.',currentdate,res.user);
		return;
	}  
	if (req.files.UploadJSON == undefined){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end('Error Json file not found.'); 
		resultlog = LogsModule.register_log(es_servername + ":" + es_port,SERVERDB, 400,req.connection.remoteAddress,'Error Json file not found.',currentdate,res.user);
		return;
	}
	//1 Parse the JSON and find the device name.
	//2 If not existing in the db, then we will just register the JSON content
	//3 if already exists, we need to merge with the existing entries, updating those fields redefined in the json
	var jsontext =req.files.UploadJSON.data.toString('utf8'); 	
	var devicename= get_value_json(jsontext,"device"); //(1) parsing the JSON
	devicename=devicename.value;   
	jsontext =update_device_length_on_json(jsontext, devicename); //this adds the field device.length 
	
// 	console.log("send_device_update_to_suscribers("+devicename+")");
	send_device_update_to_suscribers(devicename,jsontext);
	var result_count = DeviceModule.query_count_device(es_servername + ":" + es_port,SERVERDB, devicename);
	result_count.then((resultResolve) => {
		if(resultResolve==0){//new entry (2) we resister new entry  
			var result = DeviceModule.register_device_json(es_servername + ":" + es_port,SERVERDB, jsontext); 
			result.then((resultResolve) => {
				resultlog = LogsModule.register_log(es_servername + ":" + es_port,SERVERDB, 200,req.connection.remoteAddress,"Add task Succeed",currentdate,res.user);  
				res.writeHead(resultResolve.code, {"Content-Type": contentType_text_plain});
				res.end(resultResolve.text + "\n", 'utf-8');
			},(resultReject)=> {
				res.writeHead(resultReject.code, {"Content-Type": contentType_text_plain});
				res.end(resultReject.text + "\n", 'utf-8');
				resultlog = LogsModule.register_log( es_servername + ":" + es_port,SERVERDB,400,req.connection.remoteAddress,"Upload Error",currentdate,res.user); 
			});
			return;
		}else if (new_device==true){
			res.writeHead(400, {"Content-Type": contentType_text_plain});
			res.end("[ERROR] Can not register as new DEVICE, because there is an alredy registered DEVICE with that name\n", 'utf-8'); 
			return;
		}else{ //already existing, (3.1) first we get the registered json
			var result_id = DeviceModule.find_device_id(es_servername + ":" + es_port,SERVERDB, devicename); 
			result_id.then((result_idResolve) => {  
				var elasticsearch = require('elasticsearch');
				var clientb = new elasticsearch.Client({
					host: es_servername + ":" + es_port,
					log: 'error'
				});
				var algo= new Promise( (resolve,reject) => {
					var mergejson = JSON.parse(jsontext);  
					clientb.update({//index replaces the json in the DB with the new one
						index: SERVERDB,
						type: 'devices', 
						id: result_idResolve,
						body: {doc: mergejson}
					}, function(error, response) {
						if(error){
							reject (error);
						} else if(!error){
							var verify_flush = CommonModule.my_flush( req.connection.remoteAddress ,es_servername + ":" + es_port,SERVERDB);
							verify_flush.then((resolve_result) => { 
								resolve ("Succeed" ); 
							},(reject_result)=> { 
								reject ( );
							}); 
						}
					});//end query client.index
				});
				algo.then((resultResolve) => {
					res.writeHead(420, {"Content-Type": contentType_text_plain});
					res.end( "Succeed." , 'utf-8');
					return;
				},(resultReject)=> {
					res.writeHead(400, {"Content-Type": contentType_text_plain});
					res.end( "error: "+resultReject, 'utf-8');
					return;
				});
			},(result_idReject)=> {
				res.writeHead(400, {"Content-Type": contentType_text_plain});
				res.end( "error requesting id", 'utf-8');
				return;
			});
		}
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end(resultReject + "\n", 'utf-8'); //error counting projects in the DB
		resultlog = LogsModule.register_log( es_servername + ":" + es_port,SERVERDB,400,req.connection.remoteAddress,"ERROR on Update-register device",currentdate,res.user); 
		return;
	});  
}//register_device

//**********************************************************
//this function returns the device_id of the requested device name, if not exists then it is created a new register with the device name and not hide as only filled fields
function request_device_id(devicename){
	return new Promise( (resolve,reject) => {
		"use strict"; 
		var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
		var result_count = DeviceModule.query_count_device(es_servername + ":" + es_port,SERVERDB, devicename);
		result_count.then((resultResolve) => {
			if(resultResolve==0){//new entry (2) we resister new entry 
				var jsontext= {
					"device": devicename,
					"device_length":  devicename.length,
					"hide": "false"
				};
				var result = DeviceModule.register_device_json(es_servername + ":" + es_port,SERVERDB, jsontext); 
				result.then((resultResolve) => {
					var result_id = DeviceModule.find_device_id(es_servername + ":" + es_port,SERVERDB, devicename); 
					result_id.then((result_idResolve) => {
						resolve (result_idResolve);
					},(result_idReject)=> {//error finding the device id 
						reject("error requesting id");
					}); 
				},(resultReject)=> {//error regsiterning the new devicename
					reject (resultReject.text ); 
				});
			}else{ 
				var result_id = DeviceModule.find_device_id(es_servername + ":" + es_port,SERVERDB, devicename); 
				result_id.then((result_idResolve) => { 
					resolve(result_idResolve);
				},(result_idReject)=> {//error finding the device id
					reject( "error requesting id" );
				});
			}
		},(resultReject)=> { //error looking for devicename
			reject(resultReject ); 
		});  
	});
}//request_device_id 
//**********************************************************
//this function returns the device_id of the requested device name, if not exists then it is created a new register with the device name and not hide as only filled fields
function request_device_status_id(device_id){
	return new Promise( (resolve,reject) => {
		"use strict"; 
		var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
		var result_count = DeviceModule.query_count_device_status(es_servername + ":" + es_port,SERVERDB, device_id); 
		result_count.then((resultResolve) => {
			if(resultResolve==0){//new entry (2) we resister new entry 
				var jsontext= {
					"device_id": device_id
					//"timestamp": "yyyy-MM-dd'T'HH:mm:ss.SSS"
				};
				var result = DeviceModule.register_device_status_json(es_servername + ":" + es_port,SERVERDB, jsontext, "");//missing remoteAddress 
				result.then((resultResolve) => {
					var result_id = DeviceModule.find_device_status_id(es_servername + ":" + es_port,SERVERDB, device_id); 
					result_id.then((result_idResolve) => { 
						resolve (result_idResolve);
					},(result_idReject)=> {//error finding the device id 
						reject("error requesting status id");
					}); 
				},(resultReject)=> {//error regsiterning the new device_id
					reject (resultReject.text ); 
				});
			}else{ 
				var result_id = DeviceModule.find_device_status_id(es_servername + ":" + es_port,SERVERDB, device_id); 
				result_id.then((result_idResolve) => {  
					resolve(result_idResolve);
				},(result_idReject)=> {//error finding the device id
					reject( "error requesting status id" );
				});
			}
		},(resultReject)=> { //error looking for device_id
			reject(resultReject ); 
		});  
	});
}//request_device_id 
//********************************************************** 
function register_device_status(req, res,new_device){
	"use strict";  
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");  
	var message_bad_request = "UPLOAD Bad Request missing ";
	var resultlog ; 
	if (!req.files){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end('No files were uploaded.');
		resultlog = LogsModule.register_log(es_servername + ":" + es_port,SERVERDB, 400,req.connection.remoteAddress,'No files were uploaded.',currentdate,res.user);
		return;
	}  
	if (req.files.UploadJSON == undefined){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end('Error Json file not found.'); 
		resultlog = LogsModule.register_log(es_servername + ":" + es_port,SERVERDB, 400,req.connection.remoteAddress,'Error Json file not found.',currentdate,res.user);
		return;
	}
	//1 Parse the JSON and find the device name.
	//2 If not existing in the db, then we will just register the JSON content
	//3 if already exists, we need to merge with the existing entries, updating those fields redefined in the json
	var jsontext =req.files.UploadJSON.data.toString('utf8'); 	
	var devicename= get_value_json(jsontext,"device"); //(1) parsing the JSON
	devicename=devicename.value;
	jsontext =update_device_length_on_json(jsontext, devicename); //this adds the field device.length	
	
// 	console.log("send_device_update_to_suscribers("+devicename+")");
	send_device_update_to_suscribers(devicename,jsontext);	
	var result_id =request_device_id(devicename);//if there is not such device, will register as new one
	result_id.then((device_id) => { 
		var result_status_id =request_device_status_id(device_id);//if there is not such device status, will register as new one
		result_status_id.then((resultFind_id) => { 
			//we have the device_status_id, now is the time to add the new json -> jsontext
			
			var result_update = DeviceModule.update_device_status_json(es_servername + ":" + es_port,SERVERDB, jsontext, resultFind_id); 
			result_update.then((resultResolve) => {
				resultlog = LogsModule.register_log(es_servername + ":" + es_port,SERVERDB, 200,req.connection.remoteAddress,"Add task Succeed",currentdate,res.user);  
				res.writeHead(200, {"Content-Type": contentType_text_plain});
				res.end(resultResolve  + "\n", 'utf-8');
			},(resultReject)=> {
				res.writeHead(400, {"Content-Type": contentType_text_plain});
				res.end(resultReject + "\n", 'utf-8');
				resultlog = LogsModule.register_log( es_servername + ":" + es_port,SERVERDB,400,req.connection.remoteAddress,"Upload Error",currentdate,res.user); 
			});
			
		},(resultReject)=> {
			res.writeHead(400, {"Content-Type": contentType_text_plain});
			res.end("register_device_status: Bad Request "+resultReject +"\n");
			var resultlogb = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress," BAD Request on query:"
				+JSON.stringify(mybody_obj),currentdate,res.user);
		});
	},(resultReject)=> {
		res.writeHead(resultReject.code, {"Content-Type": contentType_text_plain});
		res.end(resultReject.text + "\n", 'utf-8');
		resultlog = LogsModule.register_log( es_servername + ":" + es_port,SERVERDB,400,req.connection.remoteAddress,"register_device_status Error",currentdate,res.user);
	});
}//register_device_status
//********************************************************** 
app.post('/register_new_device',middleware.ensureAuthenticated, function(req, res) { //this is for the table devices, all the info is in a JSON file
	register_device(req, res,true);
});
//********************************************************** 
app.post('/update_device',middleware.ensureAuthenticated, function(req, res) { //this is for the table devices, all the info is in a JSON file, will update and merge with existing fields
	register_device(req, res,false);
});
//********************************************************** 
app.post('/update_device_status',middleware.ensureAuthenticated, function(req, res) { //this is for the table devices_status
	register_device_status(req, res,false);
});
//********************************************************** 
app.get('/get_device_list', function(req, res) {
	"use strict"; 
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");  
	var message_bad_request = "UPLOAD Bad Request missing "; 
	var pretty		= find_param(req.body.pretty, req.query.pretty);
	var devicename	= CommonModule.remove_quotation_marks(find_param(req.body.device, req.query.device));

	if (devicename==undefined) devicename=""; 
	var result_count = DeviceModule.query_count_device(es_servername + ":" + es_port,SERVERDB, devicename);
	result_count.then((resultResolve) => { 
		if(resultResolve!=0){//new entry (2) we resister new entry
			var result_id = DeviceModule.find_device(es_servername + ":" + es_port,SERVERDB, devicename,pretty); 
			result_id.then((result_json) => { 
				res.writeHead(200, {"Content-Type": contentType_text_plain});   
				res.end(result_json); 
				return; 
			},(result_idReject)=> {
				res.writeHead(400, {"Content-Type": contentType_text_plain});
				res.end("error requesting list of Devices", 'utf-8');
				return;
			});  
		}else{
			res.writeHead(430, {"Content-Type": contentType_text_plain});	//not put 200 then webpage works
			if(devicename.length==0){
				res.end("Empty list of Devices" ); 
			}else{
				res.end("Device \""+devicename+"\" not found");
			}
			return;
		}
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end(resultReject + "\n", 'utf-8'); //error counting projects in the DB
		var resultlog = LogsModule.register_log( es_servername + ":" + es_port,SERVERDB,400,req.connection.remoteAddress,"ERROR on requesting list of Devices",currentdate,res.user); 
		return;
	});
});
//**********************************************************
app.get('/query_device',middleware.ensureAuthenticated, function(req, res) {  
	var currentdate	= dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var pretty 		= find_param(req.body.pretty, req.query.pretty);
	var devicename	= find_param(req.body.device, req.query.device);
	devicename= validate_parameter(devicename,"device",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined
	if(devicename==undefined) devicename="";
	if (devicename.length == 0){  
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing " + "device" + ".\n");
		return;} 
	//*******************************************  
	var result_count = DeviceModule.query_count_device(es_servername + ":" + es_port,SERVERDB, devicename);
	result_count.then((resultResolve) => { 
		if(resultResolve==0){//new entry (2) we resister new entry
			res.writeHead(200, {"Content-Type": contentType_text_plain});
			res.end("Not entries found for the device: " + devicename+ "\n", 'utf-8'); 
			return;
		}else{ 
			var result_id = DeviceModule.find_device_id(es_servername + ":" + es_port,SERVERDB, devicename, pretty); 
			result_id.then((result_idResolve) => {
				
				var mybody_obj= DeviceModule.compose_query_id(result_idResolve); 
				var searching = DeviceModule.query_device(es_servername+":"+es_port,SERVERDB, mybody_obj, pretty); //.replace(/\//g, '\\/');
				searching.then((resultFind) => {
					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(resultFind+"\n");
					var resultloga = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,200,req.connection.remoteAddress,"ES-QUERY DEVICE granted to query:"
						+JSON.stringify(mybody_obj),currentdate,res.user);
				},(resultReject)=> {
					res.writeHead(400, {"Content-Type": contentType_text_plain});
					res.end("es_query: Bad Request "+resultReject +"\n");
					var resultlogb = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"ES-QUERY DEVICE BAD Request on query:"
						+JSON.stringify(mybody_obj),currentdate,res.user);
				});
				return;
			},(result_idReject)=> {
				res.writeHead(400, {"Content-Type": contentType_text_plain});
				res.end( "error requesting device", 'utf-8');
				return;
			});
		}
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end(resultReject + "\n", 'utf-8'); //error counting projects in the DB
		resultlog = LogsModule.register_log( es_servername + ":" + es_port,SERVERDB,400,req.connection.remoteAddress,"ERROR on Update-register device",currentdate,res.user); 
		return;
	});
});
//**********************************************************
app.get('/query_device_status',middleware.ensureAuthenticated, function(req, res) {  
	var currentdate	= dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l"); 
	var pretty 		= find_param(req.body.pretty, req.query.pretty);
	var devicename	= find_param(req.body.device, req.query.device);
	devicename= validate_parameter(devicename,"device",currentdate,res.user, req.connection.remoteAddress);//generates the error log if not defined 
	if(devicename==undefined) devicename="";
	if (devicename.length == 0){
		res.writeHead(400, { 'Content-Type': contentType_text_plain });
		res.end("\n400: Bad Request, missing " + "device" + ".\n");
		return;} 
	//*******************************************  
	var result_count = DeviceModule.query_count_device(es_servername + ":" + es_port,SERVERDB, devicename);
	result_count.then((resultResolve) => { 
		if(resultResolve==0){//new entry (2) we resister new entry
			res.writeHead(200, {"Content-Type": contentType_text_plain});
			res.end("Not entries found for the device: " + devicename+ "\n", 'utf-8'); 
			return;
		}else{ 
			var result_id = DeviceModule.find_device_id(es_servername + ":" + es_port,SERVERDB, devicename, pretty); 
			result_id.then((result_idResolve) => {// result_idResolve is the device_id in the table devices 
				var searching = DeviceModule.query_device_status(es_servername+":"+es_port,SERVERDB, result_idResolve, pretty); //.replace(/\//g, '\\/');
				searching.then((resultFind) => {
					//resultFind is the json of the info in the devices+devices_status table. 
					res.writeHead(200, {"Content-Type": "application/json"});
					res.end(resultFind+"\n");
					var resultloga = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,200,req.connection.remoteAddress,"ES-QUERY DEVICE granted to query"
						,currentdate,res.user);
					
				},(resultReject)=> {
					res.writeHead(400, {"Content-Type": contentType_text_plain});
					res.end("es_query: Bad Request "+resultReject +"\n");
					var resultlogb = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"ES-QUERY DEVICE BAD Request on query"
						,currentdate,res.user);
				});
				return;
			},(result_idReject)=> {
				res.writeHead(400, {"Content-Type": contentType_text_plain});
				res.end( "error requesting device", 'utf-8');
				return;
			});
		}
	},(resultReject)=> { 
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end(resultReject + "\n", 'utf-8'); //error counting projects in the DB
		resultlog = LogsModule.register_log( es_servername + ":" + es_port,SERVERDB,400,req.connection.remoteAddress,"ERROR on Update-register device",currentdate,res.user); 
		return;
	});
});
//**********************************************************
app.get('/es_query_device', middleware.ensureAuthenticated, function(req, res) {
	"use strict";
	var currentdate = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.l");
	var QueryBody 	= find_param(req.body.QueryBody, req.query.QueryBody);
	var pretty 		= find_param(req.body.pretty, req.query.pretty);
	var mybody_obj	= JSON.parse(QueryBody);
	//*************************************** 
// 	var devicename =find_param(req.body.device,req.query.device);
// 	if (device != undefined) device=remove_quotation_marks(device);  
// 	var mybody_obj= DeviceModule.compose_query(device);
	//1.1- find id of the existing doc for such path filename JSON.stringify(
	var searching = DeviceModule.query_device(es_servername+":"+es_port,SERVERDB, mybody_obj, pretty); //.replace(/\//g, '\\/');
	searching.then((resultFind) => {
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(resultFind+"\n");
		var resultloga = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,200,req.connection.remoteAddress,"ES-QUERY DEVICE granted to query:"
			+JSON.stringify(QueryBody),currentdate,res.user);
	},(resultReject)=> {
		res.writeHead(400, {"Content-Type": contentType_text_plain});
		res.end("es_query: Bad Request "+resultReject +"\n");
		var resultlogb = LogsModule.register_log(es_servername+":"+es_port,SERVERDB,400,req.connection.remoteAddress,"ES-QUERY DEVICE BAD Request on query:"
			+JSON.stringify(QueryBody),currentdate,res.user);
	});
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
	var myres = { user: "", project:  "" , device:  "" , execution:  ""};
	for (var i = 0; i < keys.length; i++) {
		var labeltxt=Object.getOwnPropertyNames(jsonobj)[i];
		if(labeltxt.toLowerCase() == 'user') {
			myres.user = jsonobj[keys[i]]; 
		}else if(labeltxt.toLowerCase() == 'project') {
			myres.project = jsonobj[keys[i]]; 
		}else if(labeltxt.toLowerCase() == 'device') {
			myres.device = jsonobj[keys[i]]; 
		}else if(labeltxt.toLowerCase() == 'execution') {
			myres.execution = jsonobj[keys[i]]; 
		}
	}
	return myres;
};

function send_project_update_to_suscribers(projectname,jsontext){
	//*******************************************************************
	if(projectname != undefined){ 
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
				//user_conn[u].send("{\"project modified \":\""+projectname+"\"  }"); 
				user_conn[u].send(jsontext);
			}
		}   
	}  
};

function send_device_update_to_suscribers(devicename,jsontext){
	//*******************************************************************
	if(devicename != undefined){ 
		//Now we find the suscribed users and we send copy
		for (var u = 0; u < max_users; u++) {
			var found_sucrip=false;
			var i=0; 
			while(i< total_device_suscriptions[u] && found_sucrip==false){ 
				if(DeviceSubscriptions[u,i]==devicename){  
					found_sucrip=true;
				}else{
					i++;
				}
			}
			if(found_sucrip==true){ 
				//we send the copy because we found the SUSCRIPTION
				console.log("Forwarding to suscribed user: "+user_ids[u] + " Device: "+ devicename);
				//user_conn[u].send("{\"project modified \":\""+devicename+"\"  }"); 
				user_conn[u].send(jsontext);
			}
		}   
	}  
};

function send_exec_update_to_suscribers(execname,jsontext){
	//*******************************************************************
	if(execname != undefined){ 
		//Now we find the suscribed users and we send copy
		for (var u = 0; u < max_users; u++) {
			var found_sucrip=false;
			var i=0; 
			while(i< total_exec_suscriptions[u] && found_sucrip==false){ 
				if(ExecSubscriptions[u,i]==execname){ 
					found_sucrip=true;
				}else{
					i++;
				}
			}
			if(found_sucrip==true){ 
				//we send the copy because we found the SUSCRIPTION
				console.log("Forwarding to suscribed user: "+user_ids[u] + " Execution: "+ execname);
				//user_conn[u].send("{\"project modified \":\""+execname+"\"  }"); 
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
	var user_id = max_users;  //no valid value to represent not defined
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
		update_suscription_msg["user"]= user_input.user ; 
		if(user_input.project != undefined)
		if(user_input.project.length > 0){ 
			update_suscription_msg ["suscribed_to_project"] = user_input.project ;
		} 
		if(user_input.device != undefined)
		if(user_input.device.length > 0){ 
			update_suscription_msg["suscribed_to_device"] = user_input.device ; 
		} 		
		if(user_input.execution != undefined)
		if(user_input.execution.length > 0){ 
			update_suscription_msg ["suscribed_to_execution"] = user_input.execution ; 
		} 				 
		
		console.log(JSON.stringify(update_suscription_msg));
		
		ws_connection.send(JSON.stringify( update_suscription_msg)); 
// 		console.log((new Date()) + ' Received Suscription from ' + user_input.user + ': ' + message );   
		//****************************************************** 
		//first we need find if the user_id already suscribed, if not then we add the new suscription
		//**********************************************************************
		//adding suscriptoin on PROJECTS:
		var found_susc=false; 
		if(user_input.project.length > 0)
		if(user_input.project!=undefined){
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
		//adding suscriptoin on DEVICES:
		found_susc=false; 
		if(user_input.device.length > 0)
		if(user_input.device!=undefined){
			for (var i = 0; i < total_device_suscriptions[user_id]; i++)  
				if(DeviceSubscriptions[user_id,i]==user_input.device) {
					found_susc=true; 
// 					console.log("found previous suscription adding at "+user_id+" "+i);
				}
			if(found_susc==false){
				console.log("not found previous device suscription adding at "+user_id+" "+total_device_suscriptions[user_id]+ ": "+user_input.device);
				DeviceSubscriptions[user_id,total_device_suscriptions[user_id]]=user_input.device;
				total_device_suscriptions[user_id]=total_device_suscriptions[user_id]+1;
			}
		} 
		//**********************************************************************
		//adding suscriptoin on EXECs:
		found_susc=false; 
		if(user_input.execution.length > 0)
		if(user_input.execution!=undefined){
			for (var i = 0; i < total_exec_suscriptions[user_id]; i++)  
				if(ExecSubscriptions[user_id,i]==user_input.execution) {
					found_susc=true; 
// 					console.log("found previous suscription adding at "+user_id+" "+i);
				}
			if(found_susc==false){
				console.log("not found previous exec suscription adding at "+user_id+" "+total_exec_suscriptions[user_id]+ ": "+user_input.execution);
				ExecSubscriptions[user_id,total_exec_suscriptions[user_id]]=user_input.execution;
				total_exec_suscriptions[user_id]=total_exec_suscriptions[user_id]+1;
			}
		}
		user_input.project=undefined;
		user_input.device=undefined;
		user_input.execution=undefined;
	});
	// user disconnected
	ws_connection.on('close', function(reasonCode, description) {
// 		console.log((new Date()) + ' Peer: ' + client_address + ' disconnected.'+ 'user is: '+ user_input.user);
		var i=find_pos_user_address(client_address);
		if(i<totalusers) { 
			user_address[i]=undefined;
			total_project_suscriptions[i]=0;
			total_device_suscriptions[i]=0;
			total_exec_suscriptions[i]=0;
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
        console.error(err);
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send(err.stack);
    }
}
app.use(errorHandler);

// app.use(function (err, req, res) {
//     log.error('Error on path %s\n%s\n', req.url, err.stack);
//     res.status(500).send((process.env.NODE_ENV == 'production') ? 'Internal Server Error' : err.stack.replace(/(?:\r\n|\r|\n)/g, '<br />'));
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
