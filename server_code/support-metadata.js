// Author: J.M.Montañana HLRS 2018
// If you find any bug, please notify to hpcjmont@hlrs.de
//
// Copyright (C) 2018 University of Stuttgart
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var my_type = 'metadata';

function add_query_term(mquery, mylabel, value){
	const key = 'must';
	if (value != undefined) {
		if(mquery==undefined ){
			var mquery = {} // empty Object
			mquery[key] = []; // empty Array, which you can push() values into
		}
		if (value.length > 0){
			var tquery ={};
				tquery[mylabel]=value;
			var xquery ={};
				xquery["match_phrase"] = tquery;
	// 		var secondlabel = mylabel +"_length";
				mquery[key].push(xquery);
		}
		mylabel = mylabel +"_length";
		var tquery ={};
			tquery[mylabel]=value.length;
		var xquery ={};
			xquery["term"] = tquery;
		mquery[key].push(xquery);
	}
	return mquery;
}

module.exports = {
compose_query: function(project, source, filepath, filename){
	var mquery=undefined;
	mquery = add_query_term(mquery,"project",project );
	mquery = add_query_term(mquery,"source",source );
	mquery = add_query_term(mquery,"path",filepath );
	mquery = add_query_term(mquery,"filename",filename );
	if(mquery!=undefined ){
		mquery= { query: { bool: mquery } };
	}else{
		mquery= { query: { "match_all": {} }};
	}
// 	console.log("query is: "+JSON.stringify(mquery));
	return mquery;
},
//**********************************************************
register_json: function(es_server, my_index, body) {
	return new Promise( (resolve,reject) => {
		var size =0;
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		
		console.log("json is "+JSON.stringify(body));
		var myres = { code: "", text: "" };
		client.index({
			index: my_index,
			type: my_type,
			body: body // contains the json
		}, function(error, response) {
			if(error){
				myres.code="400";
				myres.text="Could not register the json."+error+"\n json: "+JSON.stringify(body);
				reject (myres);
			} else if(!error){
				myres.code="200";
				myres.text="succeed "+response;
				resolve (myres);
			}
		});
	});
}, //end register_metadata_json
//**********************************************************	
//report on the screen the list of fields, and values
get_value_json: function (JSONstring,label){
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
}, 
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
find_metadata_id: function(es_server ,my_index, project,source,filename,path){ 
	return new Promise( (resolve,reject) => {
		var size =0;
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		var search_query = this.compose_query(project,source, path, filename);
		client.search({
			index: my_index,
			type: my_type,
			body: search_query
		}, function(error, response){
			if (error){
				reject (error);
			}
			resolve (response.hits.hits[0]._id);
		});
	});
},

//**********************************************************
//This function is used to verify if a filename-path is registered
query_count_filename_path: function(es_server, my_index, project, source, path, filename){
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		var count_query = this.compose_query(project,source, path, filename);
// 			console.log("query is: "+JSON.stringify(count_query)); 
		client.count({
			index: my_index,
			type: my_type,
			body: count_query
		}, function(error, response) {
			if (error) {
				reject (error);
			}
			if (response.count !== undefined) {
				resolve(response.count); //size
			}else{
				resolve(0);//size
			}
		});
	});
},//end query_count_filename_path

//This function is used to register new entries or replace existing one
//example of use:
register_update_filename_path_json: function(es_server, my_index, body, project,source, filename, path) {
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var clientb = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		//we need to find the fields filename, filename_length, path, path_length in the body
		//if there, then we remove them
		//and update with new fields from the variables filename, path 
// 			var myobj = get_value_json(body,"filename");
// 			if(myobj.value!= undefined)
// 				delete body.filename;
// 			myobj = get_value_json(body,"filename_length");
// 			if(myobj.value!= undefined)
// 				delete body.filename_length;
// 			myobj = get_value_json(body,"path");
// 			if(myobj.value!= undefined)
// 				delete body.path;
// 			myobj = get_value_json(body,"path_length");
// 			if(myobj.value!= undefined)
// 				delete body.path_length;
		var myres = { code: "", text: "" };
		var count_metadata = this.query_count_filename_path(es_server, my_index, project, source, path, filename);
		count_metadata.then((resultCount) => {
			if(resultCount==0){ //File+path don't found, proceed to register new entry.
				var new_reg = this.register_json(es_server, my_index, body);
				new_reg.then((resultReg) => {
					myres.code="200";
					myres.text="succeed, new register";
					resolve(myres);
				},(resultReject)=> {
					myres.code="420";
					myres.text="Could not register the filename/path.\n"+body+"\n"+resultReject.text;
					reject (myres);
				});//end new_reg
			}else{
				var id_metadata = this.find_metadata_id(es_server, my_index,project,source, filename,path);
				id_metadata.then((resultId) => {
					clientb.index({
						index: my_index,
						type: my_type,
						id: resultId,
						body: body // contains the json
					}, function(error, response) {
						if (error !== 'undefined') {
							myres.code="409";
							myres.text=error;
							reject (myres);
						} else {
							myres.code="409";
							myres.text="Could not update the filename/path.";
							reject (myres);
						}
					});//end query client.index
					myres.code="200";
					myres.text="updated succeed";
					resolve(myres);
				},(resultReject)=> {
					myres.code="409";
					myres.text= "error finding id "+resultReject;
					reject (myres);
				});//end find id_metadata
			}
		},(resultReject)=> {
				myres.code="409";
				myres.text= "error counting "+ resultReject;
				reject (myres);
		});//end count_metadata
	});//end promise
}, //end register_update_filename_path_json
//**********************************************************
//This function is used to register new entries or replace existing one
//example of use:
delete_filename_path_json: function(es_server, my_index, project, source, path, filename) {
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var clientb = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		var myres = { code: "", text: "" };
		var count_metadata = this.query_count_filename_path(es_server, my_index, project,source,path,filename);
		count_metadata.then((resultCount) => {
			if(resultCount==0){ //File+path don't found, proceed to register new entry.
				myres.code="420";
				myres.text="Could not DELETE an not existing register.\n";
				reject (myres);
			}else{
				var id_metadata = this.find_metadata_id(es_server, my_index, project, source, filename,path);
				id_metadata.then((resultId) => {
					clientb.delete({
						index: my_index,
						type: my_type,
						id: resultId
					}, function(error, response) {
						if (error !== 'undefined') {
							myres.code="409";
							myres.text=error;
							reject (myres);
						} else {
							myres.code="409";
							myres.text="Could not delete the filename/path.";
							reject (myres);
						}
					});//end query client.index
					myres.code="200";
					myres.text="deleted succeed";
					resolve(myres);
				},(resultReject)=> {
					myres.code="409";
					myres.text= "error finding id "+resultReject;
					reject (myres);
				});//end find id_metadata
			}
		},(resultReject)=> {
			myres.code="409";
			myres.text= "error counting "+ resultReject;
			reject (myres);
		});//end count_metadata
	});//end promise
}, //end delete_filename_path_json
//****************************************************
//seems not working correctly !!!
// 	delete_json: function(es_server, my_index, path,filename,id){ // for ES 2.x, for ES 5.x may need a different plugin-function
// 		return new Promise( (resolve,reject) => {
// 			var elasticsearch = require('elasticsearch');
// 			var client = new elasticsearch.Client({
// 				host: es_server,
// 				log: 'error'
// 				//plugins: [ deleteByQuery ]
// 			});
// 			client.deleteByQuery({
// 				index: my_index,
// 				type: my_type,
// 				body: {
// 					query: {
// 						match: { _id: 'id' }
// 					}
// 				}
// 			}, function(error, response) {
// 				//response ={"found":true,"_index":"repository_db","_type":"metadata","_id":"AWIAfT2KfLZhK4r7Ht3I","_version":2,"_shards":{"total":2,"successful":1,"failed":0}}
// 				if (error !== 'undefined') {
// 					reject("error");
// 				} else {
// 					resolve(response._shards.successful);
// 				}
// 			});
// 			resolve( "succeed");
// 		});
// 	}, //end delete_json
//****************************************************
// count_file: function(es_server, my_index, bodyquery){
// 	return new Promise( (resolve,reject) => {
// 		var size =0;
// 		var elasticsearch = require('elasticsearch');
// 		var client = new elasticsearch.Client({
// 			host: es_server,
// 			log: 'error'
// 		});
// 			client.count({
// 				index: my_index,
// 				type: my_type,
// 				body: bodyquery
// 		}, function(error, response) {
// 			if (error) { 
// 				reject (error);
// 			}
// 			if (response.count !== undefined) {
// 				size = response.count;
// 			}else{
// 				size=0;
// 			}
// 			resolve (size); 
// 		});
// 	});
// },//end count_file

//**************************************************
// 	get_metadata: function(es_server,my_index,bodyquery,pretty) {
// 		return new Promise( (resolve,reject) => {
// 			var elasticsearch = require('elasticsearch');
// 			var client = new elasticsearch.Client({
// 				host: es_server,
// 				log: 'error'
// 			});
// 			var item = "";
// 			client.search({
// 				index: my_index,
// 				type: my_type,
//				size: 1,
// 				body: bodyquery
// 			},function (error, response,status) {
// 				if (error){
// 					reject("search error: "+error)
// 				} else { 
// 					var keys = Object.keys(response.hits.hits);
// 					keys.forEach(function(key) { //at most we have one key, because size=1
// 						item = JSON.parse(JSON.stringify(response.hits.hits[key]._source));
// 						//console.log("item "+item);
// 					});
// 					resolve(JSON.stringify(item, null, 4 ));
// 				};
// 			});
// 		});
// 	},//end get_metadata
//**************************************************
drop_db: function( es_server, my_index) {
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.indices.delete({
			index: my_index
		},function (error, response,status) {
			if (error){
				reject("dropping error: "+error)
			} else {
				var result =" "+(JSON.stringify(response));
				resolve(result);
			}
		});
	});
},//end drop_db
//**************************************************
new_db: function(es_server, my_index) {
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.indices.create({
			index: my_index
		},function (error, response,status) {
			if (error){
				reject("creation error: "+error)
			} else {
				var result =" "+(JSON.stringify(response));
				resolve(result);
			}
		});
	});
},//end new_db
//**************************************************
new_mapping: function(es_server, my_index, mytype, mytypemapping ) {
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.indices.putMapping({
			index: my_index,
			type : mytype,
			body: mytypemapping
		},function (error, response,status) {
			if (error){
				reject("mapping error: "+error)
			} else {
				var result =" "+(JSON.stringify(response));
				resolve(result);
			}
		});
	});
},//end new_db
// find_file: function(es_server, my_index, path,filename) {
// 	return new Promise( (resolve,reject) => {
// 	var elasticsearch = require('elasticsearch');
// 	var client = new elasticsearch.Client({
// 		host: es_server,
// 		log: 'error'
// 	});
// 	var item = "";
// 	search_query= this.compose_query(project,source, path, filename);
// 	client.search({
// 		index: my_index,
// 		type: my_type,
// 		size: 1,
// 		body: search_query
// 	},function (error, response,status) {
// 		if (error){
// 			reject("search error: "+error)
// 		} else {
// 			//var result="";
// 			//result.write("--- Response ---\n") ;
// 			//result.write( response);
// 			//result.write( "\n--- Hits ---\n");
// 			//response.hits.hits.forEach(function(hit){
// 			//		result.write(hit);
// 			//});
// 			//result.end;
// 			//result= response.toString();
// 			//result= new JSONObject(response); 
// 			var keys = Object.keys(response.hits.hits);
// 			keys.forEach(function(key) { //at most we have one key, because size=1
// 				item = JSON.parse(JSON.stringify(response.hits.hits[key]._id));
// 				//console.log("item "+item);
// 			});
// 			resolve(item);
// 			//for debuging:
// 			//	resolve(JSON.stringify(response.hits.hits));
// 			//	the at the calling side can print as: console.log("searching ...:\n"+resultFind)
// 		};
// 	});
// 	});
// },//end find_file
//**************************************************
query_metadata: function(es_server, my_index, bodyquery, pretty) {
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		var result="";
		var item = "";
		client.search({
			index: my_index,
			type: my_type,
			size: 100,
			body: bodyquery
		},function (error, response, status) {
			if (error){
				reject("search error: "+error)
			} else {
				var keys = Object.keys(response.hits.hits);
				keys.forEach(function(key) {
					item = JSON.parse(JSON.stringify(response.hits.hits[key]._source));
					if(result!=""){
						result+=",";
					}
					if((pretty=="true")||(pretty=="TRUE")){
						result+=" "+(JSON.stringify(item, null, 4));
					}else{
						result+=" "+(JSON.stringify(item));
					}
				});
			};
			resolve("{\"hits\" :["+result+"]}");
		});
	});
}//end get_metadata
//**************************************************
}//end module.exports
