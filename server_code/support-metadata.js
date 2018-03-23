// Author: J.M.Montañana HLRS 2018
//   If you find any bug, please notify to hpcjmont@hlrs.de
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

var my_index = 'repository_db'
var my_type = 'metadata'
var mf_server = 'localhost:9400';

module.exports = {
//**********************************************************
	register_json: function(body) {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: mf_server,
			log: 'error'
		}); 
		client.index({
			index: my_index,
			type: my_type, 
			body: body  // contains the json
		}, function(error, response) {
			if (error !== 'undefined') {
				return "error"; 
			} else {
				return "Could not register the json.";
			} 
		});
		return "succeed";
	}, //end register_json
  
//**********************************************************
	update_json: function(body,id) {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: mf_server,
			log: 'error'
		}); 
// 		console.log("body" + body);
		client.update({
			index: my_index,
			type: my_type, 
			_id: id,
			body:  body   // contains the json
		}, function(error, response) {
			if (error !== 'undefined') {
				return "error"; 
			} else {
				return "Could not register the json.";
			} 
		});
		return "succeed";
	}, //end register_json
//**********************************************************
	//seems not working correctly !!!
	delete_json: function(path,filename,id){  // for  ES 2.x,  for ES 5.x may need a different plugin-function
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error' 
				//plugins: [ deleteByQuery ]
			}); 
			client.deleteByQuery({
				index: my_index,
				type: my_type, 
				body: {
					query: {
						match: { _id: 'id' }
					}
				}
			}, function(error, response) {
				//response ={"found":true,"_index":"repository_db","_type":"metadata","_id":"AWIAfT2KfLZhK4r7Ht3I","_version":2,"_shards":{"total":2,"successful":1,"failed":0}}
				if (error !== 'undefined') {
					reject("error"); 
				} else {
					resolve(response._shards.successful);
				} 
			});
			resolve( "succeed");
		});
	}, //end delete_json
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
//  				size: 1,
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
	drop_db: function(   ) {
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
				result+=" "+(JSON.stringify(response  ));  
				resolve(result);
				}
			});
		});
	},//end new_db	
//**************************************************
	new_db: function(   ) {
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
				result+=" "+(JSON.stringify(response  ));  
				resolve(result);
				}
			});
		});
	},//end new_db	
//**************************************************
	new_mapping: function(  mytype, mytypemapping ) {
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
                body:   mytypemapping  
			},function (error, response,status) {
				if (error){
					reject("mapping error: "+error)
				} else { 
				result+=" "+(JSON.stringify(response  ));  
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
// 			console.log("query is "+JSON.stringify(bodyquery));
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
							result+=" "+(JSON.stringify(item, null, 4 ));
						}else{ 
							result+=" "+(JSON.stringify(item  ));
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
		client.search({
			index: my_index,
			type: my_type,
			size: 1,
			body: {
				query: { bool: { must: [ { match: { "path": path } } , { match: { "filename" : filename } } ] } }
			}
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
