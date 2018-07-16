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

const CommonModule 	= require('./support-common');

module.exports = { 
compose_query: function(app ){ 
	var mquery=undefined;
	if (app != undefined)
	if (app.length > 0){
		mquery=[{"match_phrase":{"app":app}},{"term":{"app_length":app.length}}];
	}
	if(mquery!=undefined ){
		mquery={"query":{"bool":{"must": mquery }}};
	}else{ 
		mquery={"query":{"match_all": {} }};
	}
	return mquery;
},
compose_query_id: function(id_string ){ 
	var mquery;
	if (id_string != undefined) {
		mquery={"query":{"match":{"_id":id_string}}};
	}else{ 
		mquery={"query":{"match_all": {} }};
	}
	return mquery;
}, 
register_json: function(es_server, my_index, body, remoteAddress, my_type) {
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
//This function is used to confirm that a app exists or not in the DataBase.
//We first counted if existence is >0
find_exec: function(es_server, my_index, app, pretty){ 
	const my_type = 'executions_status' ;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		}); 
		if(app==undefined){
			resolve({});
		}else if(app.length==0){  
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
							{"match_phrase":{"app": app }}, {"term":{"app_length": app.length}}
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
//***************************************************
register_exec_json: function(es_server, my_index, body, remoteAddress) {
	const my_type = 'executions_status' ; 
	return new Promise( (resolve,reject) => {
	var result =  this.register_json (es_server, my_index, body, remoteAddress, my_type) ;
	result.then((resultResolve) => {
		resolve (resultResolve); 
	},(resultReject)=> {
		reject (resultReject);  
	}); 
	});
}, //end register_exec_json 
//***************************************************  
//This function is used to confirm that a app exists or not in the DataBase.
//We first counted if existence is >0
find_exec_id: function(es_server, my_index, app){
	const my_type = 'executions_status' ;
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
					{"match_phrase":{"app": app }}, {"term":{"app_length": app.length}}
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
},//find_exec_id

//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
get_user_defined_metrics: function(es_server,  appid, execfile, experimentid){
	const my_index = appid+'_'+ execfile;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.search({
			index: my_index,
			body: {
				"query": {
					"terms": {
						"type" : ["user_defined"]
					}
				} 
			}
		}, function(error, response) {
			if (error) {
				reject ("error"+error+"\n for index "+my_index);
			}
			if (response !== undefined) {
				resolve(JSON.stringify( response.hits, null, 4));
			}else{
				resolve ("unexpected error, for index "+my_index);//size
			}
		});
	});
}, //end get_user_defined_metrics
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
get_component_timing: function(es_server,  appid, execfile, experimentid){
	const my_index = appid+'_'+ execfile;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.search({
			index: my_index,
			body: {
				"query": {
					"exists" : { "field" : "component_duration" }
				}
			}
		}, function(error, response) {
			if (error) {
				reject ("error"+error+"\n for index "+my_index);
			}
			if (response !== undefined) {
				resolve(JSON.stringify( response.hits, null, 4));
			}else{
				resolve ("unexpected error, for index "+my_index);//size
			}
		});
	});
}, //end get_component_timing 
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
get_exp_stats: function(es_server,  appid, execfile, experimentid){
	const my_index = appid+'_'+ execfile;
	const my_type = experimentid;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.search({
			index: my_index,
			body: {
				"query": {
					"terms": {
						"_type": [my_type ]
					}
				},
				"aggs": {
					"cpu_load_average": {
					"avg": {
						"field": "CPU_usage_rate"
					} },
					"cpu_load_count": {
					"value_count": {
						"field": "CPU_usage_rate"
					} },
					"cpu_load_max": {
					"max": {
						"field": "CPU_usage_rate"
					} },
					"cpu_load_min": {
					"min": {
						"field": "CPU_usage_rate"
					} },
					"RAM_load_average": {
					"avg": {
						"field": "RAM_usage_rate"
					} },
					"swap_load_average": {
					"avg": {
						"field": "swap_usage_rate"
					} },
					"disk_read_average": {
					"avg": {
						"field": "disk_read"
					} },
					"average_disk_write": {
					"avg": {
						"field": "disk_write"
					} },
					"disk_throughput_average": {
					"avg": {
						"field": "disk_throughput"
					} },
					"example_of_undefined_value": {
					"avg": {
						"field": "undefined"
					} }
				},
				"size": 0
			}
		}, function(error, response) {
			if (error) {
				reject ("error"+error+"\n for index "+my_index);
			}
			if (response !== undefined) {
				resolve(JSON.stringify( response.aggregations , null, 4));
			}else{
				resolve ("unexpected error, for index "+my_index);//size
			}
		});
	});
}, //end get_exp_stats

//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
count_exp_metrics: function(es_server,  appid, execfile, experimentid){
	const my_index = appid+'_'+ execfile;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.search({
			index: my_index,
			body: {
				"aggs": {
					"typesAgg": {
						"terms": {
							"field": "_type",
							"size": 200
				}	},
				"count":{
					"cardinality": {
					"field": "_type"
					}
				}
				},
				"size": 0
			}
		}, function(error, response) {
			if (error) {
				reject ("error"+error+"\n for index "+my_index);
			}
			if (response !== undefined) {
				resolve(JSON.stringify( response.aggregations.count.value, null, 4));
			}else{
				resolve ("unexpected error, for index "+my_index);//size
			}
		});
	});
}, //end count_exp_metrics
//****************************************************

//This function is used to confirm that an user exists or not in the DataBase.
count_search_agg_id: function(es_server,  appid, execfile){
	const my_index = appid+'_'+ execfile;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.search({
			index: my_index,
			body: {
				"aggs": {
					"typesAgg": {
						"terms": {
							"field": "_type",
							"size": 200
				}	},
				"count":{
					"cardinality": {
					"field": "_type"
					}
				}
				},
				"size": 0
			}
		}, function(error, response) {
			if (error) {
				reject ("error"+error+"\n for index "+my_index);
			}
			if (response !== undefined) {
				resolve(JSON.stringify( response.aggregations.count.value, null, 4));
			}else{
				resolve ("unexpected error, for index "+my_index);//size
			}
		});
	});
}, //end query_count_exec_id
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
query_search_agg_id: function(es_server,  appid, exec_id){
	const my_index = appid+'_'+ exec_id;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		client.search({
			index: my_index,
			body: {
				"aggs": {
					"typesAgg": {
						"terms": {
							"field": "_type",
							"size": 200
				}	}	},
				"size": 0
			}
		}, function(error, response) {
			if (error) {
				reject ("error"+error+"\n for index "+my_index);
			}
			if (response !== undefined) {
				resolve(JSON.stringify( response.aggregations.typesAgg.buckets, null, 4));
			}else{
				resolve ("unexpected error, for index "+my_index);//size
			}
		});
	});
}, //end query_count_exec_id
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
query_count_exec_id: function(es_server, my_index, exec_id){ 
	const my_type = 'executions_status' ;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		if(exec_id==undefined){
			resolve(0);
		}else{
			client.count({
				index: my_index,
				type: my_type, 
				body: {
					"query":{"bool":{"must":[
						{"match_phrase":{"_id": exec_id }} 
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
}, //end query_count_exec_id
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
query_count_exec: function(es_server, my_index, app){ 
	const my_type = 'executions_status' ;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		if(app==undefined){
			resolve(0);
		}else if(app.length==0){ 
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
						{"match_phrase":{"app": app }}, {"term":{"app_length": app.length}}
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
}, //end query_count_exec
//**************************************************** 
query_exec: function(es_server, my_index, bodyquery, pretty) {
	const my_type = 'executions_status';
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
}//end query_exec 
	
}//end module.exports
