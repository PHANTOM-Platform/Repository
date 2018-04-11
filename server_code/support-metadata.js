// Author: J.M.Montañana HLRS 2018
// If you find any bug, please notify to hpcjmont@hlrs.de
// 
// Copyright (C) 2018 University of Stuttgart
// 
//     Licensed under the Apache License, Version 2.0 (the "License");
//     you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//  
//      http://www.apache.org/licenses/LICENSE-2.0
//  
//     Unless required by applicable law or agreed to in writing, software
//     distributed under the License is distributed on an "AS IS" BASIS,
//     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
//     limitations under the License.

var express = require('express'); 

function is_defined(variable) {
	return (typeof variable !== 'undefined');
}

var my_index = 'repository_db';
var my_type = 'metadata';
var mf_server = 'localhost:9400';

module.exports = {
//**********************************************************
	register_metadata_json: function(body) {
		return new Promise( (resolve,reject) => {
			var size =0;
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			}); 
			var myres = { code: "", text: "" };
			client.index({
				index: my_index,
				type: my_type, 
				body: body // contains the json
			}, function(error, response) {
				if(error){
					myres.code="400";
					myres.text="Could not register the json."+error;
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
	},
	
	mreport: function(body){
	console.log("bodyzzzz is "+body);	
	},
	
	//This function is used to register new entries or replace existing one
	//example of use: 	
	register_update_filename_path_json: function(body, filename, path) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var clientb = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			}); 
			//we need to find the fields filename, filename_length, path, path_length in the body
			//if there, then we remove them
			//and update with new fields from the variables filename, path
// 			console.log("bodyyyyy is "+body);
// 			var myobj = get_value_json(body,"filename");
// 			if(myobj.value!= undefined){
// 				delete body.filename;
// 			}
// 			myobj = get_value_json(body,"filename_length");
// 			if(myobj.value!= undefined){
// 				delete body.filename_length;
// 			}
// 			myobj = get_value_json(body,"path");
// 			if(myobj.value!= undefined){
// 				delete body.path;
// 			}
// 			myobj = get_value_json(body,"path_length");
// 			if(myobj.value!= undefined){
// 				delete body.path_length;
// 			}			
// 				
// 			mreport(body);
			
			
			var resultCount=0; 
			var resultReject="";
			var error="";
			var resultReg="";
			var response=""; 
			var myres = { code: "", text: "" };
			var count_metadata = this.query_count_filename_path(filename,path);
			count_metadata.then((resultCount) => { 
				if(resultCount==0){ //File+path don't found, proceed to register new entry.
					var new_reg = this.register_metadata_json(body);
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
					var id_metadata = this.find_metadata_id(filename,path);
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
//****************************************************
	//This function is used to confirm that an user exists or not in the DataBase.
	find_metadata_id: function(project,source,filename,path){ 
		return new Promise( (resolve,reject) => {
			var size =0;
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
			client.search({
				index: my_index,
				type: my_type, 
				body: {
					"query":{"bool":{"must":[
							{"match_phrase":{"project": project }},
							{"term":{"project_length": project.length}},
							{"match_phrase":{"source": source }},
							{"term":{"source_length": source.length}},
							{"match_phrase":{"path": path }},
							{"term":{"path_length": path.length}},
							{"match_phrase":{"filename": filename }},
							{"term":{"filename_length": filename.length}},
					]}}
				}
			}, function(error, response) {
				if (error) { 
					reject (error);
				} 
				resolve (response.hits.hits[0]._id); 
			});
		});
	},	
//**********************************************************
	//This function is used to register new entries or replace existing one
	//example of use: 	
	delete_filename_path_json: function( filename, path) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var clientb = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});   
			var resultCount=0; 
			var resultReject="";
			var error="";
			var resultReg="";
			var response=""; 
			var myres = { code: "", text: "" };
			var count_metadata = this.query_count_filename_path(filename,path);
			count_metadata.then((resultCount) => { 
				if(resultCount==0){ //File+path don't found, proceed to register new entry. 
					myres.code="420";
					myres.text="Could not DELETE an not existing register.\n";
					reject (myres); 
				}else{ 
					var id_metadata = this.find_metadata_id(filename,path);
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
// 	delete_json: function(path,filename,id){ // for ES 2.x, for ES 5.x may need a different plugin-function
// 		return new Promise( (resolve,reject) => {
// 			var elasticsearch = require('elasticsearch');
// 			var client = new elasticsearch.Client({
// 				host: mf_server,
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
	count_file: function(bodyquery){
		return new Promise( (resolve,reject) => {
			var size =0;
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
				client.count({
					index: my_index,
					type: my_type,
					body: bodyquery
			}, function(error, response) {
				if (error) { 
					reject (error);
				}
				if (response.count !== undefined) {
					size = response.count;
				}else{
					size=0;
				}
				resolve (size); 
			});
		});
	},//end count_file
	
	//**********************************************************
	//This function is used to verify if a filename-path is registered
	query_count_filename_path: function(filename,path){
		return new Promise( (resolve,reject) => {
			var size =0;
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			}); 
			console.log(" path is "+String(path));
			var count_query ={
					query: {"bool":{"must":[
						{"match_phrase":{"path":String(path)}}, 
						{"term":{"filename_length":String(filename).length}},
						{"match_phrase":{"filename":String(filename)}},
						{"term":{"path_length":String(path).length}}
					] } }}; 
			console.log("query is: "+JSON.stringify(count_query));
			client.count({
				index: my_index,
				type: my_type, 
				body: count_query 
			}, function(error, response) {
				if (error) { 
					reject (error);
				}
				if (response.count !== undefined) {
					size = response.count;
				}else{
					size=0;
				} 
				resolve (size); 
			});
		});
	},//end query_count_filename_path
	
//**************************************************
// 	get_metadata: function(bodyquery,pretty) {
// 		return new Promise( (resolve,reject) => {
// 			var elasticsearch = require('elasticsearch');
// 			var client = new elasticsearch.Client({
// 				host: mf_server,
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
	drop_db: function( ) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
			var result="";
			var item = ""; 
			client.indices.delete({
				index: my_index 
			},function (error, response,status) {
				if (error){
					reject("dropping error: "+error)
				} else { 
				result+=" "+(JSON.stringify(response));
				resolve(result);
				}
			});
		});
	},//end drop_db	
//**************************************************
	new_db: function( ) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
			var result="";
			var item = ""; 
			client.indices.create({
				index: my_index 
			},function (error, response,status) {
				if (error){
					reject("creation error: "+error)
				} else { 
				result+=" "+(JSON.stringify(response));
				resolve(result);
				}
			});
		});
	},//end new_db	
//**************************************************
	new_mapping: function(mytype, mytypemapping ) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
			var result="";
			var item = ""; 
			client.indices.putMapping({
				index: my_index,
				type : mytype,
				body: mytypemapping
			},function (error, response,status) {
				if (error){
					reject("mapping error: "+error)
				} else { 
				result+=" "+(JSON.stringify(response));
				resolve(result);
				}
			});
		});
	},//end new_db	
//**************************************************
	query_metadata: function( bodyquery, pretty) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
			var result="";
			var item = "";
 			console.log("query is "+JSON.stringify(bodyquery));
			client.search({
				index: my_index,
				type: my_type,
				size: 10,
				body: bodyquery
			},function (error, response,status) {
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
	},//end get_metadata	
//**************************************************
	find_file: function(path,filename) {
		return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: mf_server,
			log: 'error'
		});
		var item = "";
		search_query= { query: { bool: { must: [ 
										{"match_phrase":{"path": filepath }},
										{"term":{"path_length": filepath.length}},
										{"match_phrase":{"filename": filename }},
										{"term":{"filename_length": filename.length}} 
										] } } };		
		client.search({
			index: my_index,
			type: my_type,
			size: 1,
			body: search_query
		},function (error, response,status) {
			if (error){
				reject("search error: "+error)
			} else {
				//var result="";
				//result.write("--- Response ---\n") ;
				//result.write( response);
				//result.write( "\n--- Hits ---\n");
				//response.hits.hits.forEach(function(hit){
				//		result.write(hit);
				//});
				//result.end;
				//result= response.toString();
				//result= new JSONObject(response); 
				var keys = Object.keys(response.hits.hits);
				keys.forEach(function(key) { //at most we have one key, because size=1
					item = JSON.parse(JSON.stringify(response.hits.hits[key]._id));
					//console.log("item "+item);
				});
				resolve(item);
				//for debuging:
				//	resolve(JSON.stringify(response.hits.hits));
				//	the at the calling side can print as: console.log("searching ...:\n"+resultFind)
			};
		});
		});
	}//end find_file
}//end module.exports
