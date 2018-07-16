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

var my_type = 'tasks' 

const CommonModule 		= require('./support-common');

module.exports = { 
	compose_query: function(project ){ 
	var mquery=undefined;
	if (project != undefined)
	if (project.length > 0){
		mquery=[{"match_phrase":{"project":project}},{"term":{"project_length":project.length}}];
	}  
// 	console.log("mquery is " +JSON.stringify(mquery));
	if(mquery!=undefined ){
		mquery={"query":{"bool":{"must": mquery }}};
	}else{ 
		mquery={"query":{"match_all": {} }};
	}
	return mquery;
},
register_json: function(es_server, my_index, body, remoteAddress) {
	return new Promise( (resolve,reject) => {
		var size =0;
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
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
				var verify_flush = CommonModule.my_flush( remoteAddress ,es_server, my_index);
				verify_flush.then((resolve_result) => {
					myres.code="200";
					myres.text="succeed ";
					resolve (myres); 
				},(reject_result)=> {
					myres.code=reject_result.code;
					myres.text=reject_result.text+response;
					reject (myres);  
				});
			}
		});
	}); 
}, //end register_json
//****************************************************
//This function is used to confirm that a project exists or not in the DataBase.
//We first counted if existence is >0
find_project_id: function(es_server, my_index, project){ 
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.search({
			index: my_index,
			type: my_type, 
			body: {
				"query":{"bool":{"must":[
						{"match_phrase":{"project": project }}, {"term":{"project_length": project.length}}
				]}}
			}
		}, function(error, response) {
			if (error) { 
				reject ("error: "+error);
			}else{
				resolve (CommonModule.remove_quotation_marks(JSON.stringify(response.hits.hits[0]._id))); 
			}
		});
	});
},
//****************************************************
//This function is used to confirm that a project exists or not in the DataBase.
//We first counted if existence is >0
find_project: function(es_server, my_index, project, pretty){ 
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		}); 
		if(project==undefined){
			resolve({});
		}else if(project.length==0){  
			client.search({
				index: my_index,
				type: my_type, 
				size: 10000,
				body:{"query":{"match_all": {} }}
			}, function(error, response) { 
				if (error){
					reject("search error: "+error)
				} else {
					var result="";
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
		}else{ 
			client.search({
				index: my_index,
				type: my_type, 
				body: {
					"query":{"bool":{"must":[
							{"match_phrase":{"project": project }}, {"term":{"project_length": project.length}}
					]}}
				}
			}, function(error, response) {
				if (error) { 
					reject ("error: "+error);
				}else{
					item = JSON.parse(JSON.stringify(response.hits.hits[0]._source));
					if((pretty=="true")||(pretty=="TRUE")){ 
						resolve(" "+(JSON.stringify(item, null, 4)));
					}else{ 
						resolve(" "+(JSON.stringify(item)));
					}
				}
			});
		}
	});
},	
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
query_count_project: function(es_server, my_index, project){ 
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		if(project==undefined){
			resolve(0);
		}else if(project.length==0){ 
			client.count({
				index: my_index,
				type: my_type, 
				body:{"query":{"match_all": {} }}
			}, function(error, response) {
				if (error) { 
					reject (error);
				}
				if (response.count !== undefined) {
					resolve (response.count);//size
				}else{
					resolve (0);//size
				} 
			});
		}else{
			client.count({
				index: my_index,
				type: my_type, 
				body: {
					"query":{"bool":{"must":[
							{"match_phrase":{"project": project }}, {"term":{"project_length": project.length}}
					]}}
				}
			}, function(error, response) {
				if (error) { 
					reject (error);
				}
				if (response.count !== undefined) {
					resolve (response.count);//size
				}else{
					resolve (0);//size
				} 
			});
		}
	});
}, //end query_count_project		
//**********************************************************
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
}//end get_metadata		
}//end module.exports
