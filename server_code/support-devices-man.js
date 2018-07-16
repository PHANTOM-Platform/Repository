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
compose_query: function(device ){ 
	var mquery=undefined;
	if (device != undefined)
	if (device.length > 0){
		mquery=[{"match_phrase":{"device":device}},{"term":{"device_length":device.length}}];
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
compose_query_status_id: function(id_string ){ 
	var mquery;
	if (id_string != undefined) {
		mquery={"query":{"match":{"device_id":id_string}}};
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

//***************************************************
register_device_json: function(es_server, my_index, body, remoteAddress) {
	const my_type = 'devices' ; 
	return new Promise( (resolve,reject) => {
	var result =  this.register_json (es_server, my_index, body, remoteAddress, my_type) ;
	result.then((resultResolve) => {
		resolve (resultResolve); 
	},(resultReject)=> {
		reject (resultReject);  
	}); 
	});
}, //end register_device_json
//***************************************************
register_device_status_json: function(es_server, my_index, body, remoteAddress) {
	const my_type = 'devices_status' ;
	return new Promise( (resolve,reject) => {
	var result = this.register_json (es_server, my_index, body, remoteAddress, my_type) ; 
	result.then((resultResolve) => {
		resolve (resultResolve); 
	},(resultReject)=> {
		reject (resultReject);  
	});
	});
}, //end register_device_status_json
//***************************************************
update_device_status_json: function(es_server, my_index, body, status_id, remoteAddress) {
	const my_type = 'devices_status' ;
	return new Promise( (resolve,reject) => {  
		var elasticsearch = require('elasticsearch');
		var clientb = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		}); 
		var mergejson = JSON.parse(body);  
		clientb.update({//index replaces the json in the DB with the new one
			index: my_index,
			type: my_type, 
			id: status_id,
			body: {doc: mergejson}
		}, function(error, response) {
			if(error){
				reject (error);
			} else if(!error){
				var verify_flush = CommonModule.my_flush(remoteAddress ,es_server,my_index);
				verify_flush.then((resolve_result) => { 
					resolve ("Succeed" ); 
				},(reject_result)=> { 
					reject ("Flush error" );
				}); 
			}
		});//end query client.index 
	});
}, //end register_device_status_json
//****************************************************
//This function is used to confirm that a device exists or not in the DataBase.
//We first counted if existence is >0
find_device_id: function(es_server, my_index, device){
	const my_type = 'devices' ;
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
					{"match_phrase":{"device": device }}, {"term":{"device_length": device.length}}
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
//This function is used to confirm that a device exists or not in the DataBase.
//We first counted if existence is >0
find_device_status_id: function(es_server, my_index, device_id){ 
	const my_type = 'devices_status' ;
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
					{"match_phrase":{"device_id": device_id }} 
				]}}
			}
		}, function(error, response) {
			if (error) { 
				reject ("error: "+error);
			}else{
				console.log(JSON.stringify(response));//si total ==0 entonces tendremos error
				resolve (CommonModule.remove_quotation_marks(JSON.stringify(response.hits.hits[0]._id))); 
			}
		});
	});
},
//****************************************************
//This function is used to confirm that a device exists or not in the DataBase.
//We first counted if existence is >0
find_device: function(es_server, my_index, device, pretty){ 
	const my_type = 'devices' ;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});  
		if(device==undefined){
			resolve({});
		}else if(device.length==0){  
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
							{"match_phrase":{"device": device }}, {"term":{"device_length": device.length}}
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
query_count_device_id: function(es_server, my_index, device_id){ 
	const my_type = 'devices' ;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		if(device_id==undefined){
			resolve(0);
		}else{
			client.count({
				index: my_index,
				type: my_type, 
				body: {
					"query":{"bool":{"must":[
						{"match_phrase":{"_id": device_id }} 
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
}, //end query_count_device_id
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
query_count_device: function(es_server, my_index, device){ 
	const my_type = 'devices' ;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		if(device==undefined){
			resolve(0);
		}else if(device.length==0){ 
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
						{"match_phrase":{"device": device }}, {"term":{"device_length": device.length}}
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
}, //end query_count_device
//****************************************************
//This function is used to confirm that an user exists or not in the DataBase.
query_count_device_status: function(es_server, my_index, device_id){ 
	const my_type = 'devices_status' ;
	return new Promise( (resolve,reject) => {
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});
		if(device_id==undefined){
			resolve(0);
		}else{
			client.count({
				index: my_index,
				type: my_type, 
				body: {
					"query":{"match":{"device_id": device_id }}
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
}, //end query_count_device_status
//**********************************************************
query_device: function(es_server, my_index, bodyquery, pretty) {
	const my_type = 'devices';
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
},//end query_device
//**********************************************************
query_device_status: function(es_server, my_index, device_id, pretty) { 
	return new Promise( (resolve,reject) => {
		var bodyquery= this.compose_query_id(device_id); 
		var elasticsearch = require('elasticsearch');
		var client = new elasticsearch.Client({
			host: es_server,
			log: 'error'
		});		
		
		var item = ""; 
		
		var algo= new Promise( (resolve,reject) => {
			var resulta="";
			client.search({
				index: my_index,
				type: 'devices',
				size: 10,
				body: bodyquery
			},function (error, response,status) {
				if (error){
					reject("search error: "+error)
				} else { 
					var keys = Object.keys(response.hits.hits);
					keys.forEach(function(key) {
						item = JSON.parse(JSON.stringify(response.hits.hits[key]._source));
						if(resulta!=""){
							resulta+=",";
						}
						if((pretty=="true")||(pretty=="TRUE")){ 
							resulta+=" "+(JSON.stringify(item, null, 4));
						}else{ 
							resulta+=" "+(JSON.stringify(item));
						}
					});
					resolve(resulta);
				};				
			});			
		});
		algo.then((resultResolve) => {
			var newalgo= new Promise( (resolve,reject) => {
					var resultb=resultResolve;
					bodyquery= this.compose_query_status_id(device_id);   
					client.search({
						index: my_index,
						type: 'devices_status',
						size: 10,
						body: bodyquery
					},function (error, response,status) {
						if (error){
							reject("search error: "+error)
						} else { 
							var keys = Object.keys(response.hits.hits);
							keys.forEach(function(key) { 
								item = JSON.parse(JSON.stringify(response.hits.hits[key]._source));
								if(resultb!=""){
									resultb+=",";
								}
								if((pretty=="true")||(pretty=="TRUE")){ 
									resultb+=" "+(JSON.stringify(item, null, 4));
								}else{
									resultb+=" "+(JSON.stringify(item));
								}
							});
							resolve(resultb);
						};
					});			
			});
			newalgo.then((resultResolve) => { 
// 				resolve("{\"hits\" :["+resultResolve+"]}");	
				resolve(resultResolve);	
			},(resultReject)=> {
				reject("error: "+resultReject);
			});
		},(resultReject)=> {
			reject("error: "+resultReject);
		}); 
		
	});
}//end query_device_status
	
	
}//end module.exports
