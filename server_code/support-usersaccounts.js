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

var my_index = 'repository_db'
var my_type = 'users'
var mf_server = 'localhost:9400';

module.exports = { 
//**********************************************************
	//This function is used to verify the User and Password is registered
	query_count_user_pw: function(email,pw){
		return new Promise( (resolve,reject) => {
			var size =0;
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
			var count_query ={
				query: {bool:{must:[
					{match_phrase:{"email":email}},
					{term:{"email_length":email.length}},
					{match_phrase:{"password":pw}}, 
					{term:{"password_length":pw.length}}
				] } }}; 
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
	},//end query_count_user_pw
//**********************************************************
	//This function is used to register new users
	//example of use: 
	register: function(name, email,pw,res) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var clientb = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			}); 
			var resultCount=0;
			var resultReject="";
			var error="";
			var response="";
			var myres = { code: "", text: "" };
			var count_users = this.query_count_user(email);
			count_users.then((resultCount) => {
				if(resultCount!=0){
					var mres;
					myres.code="409";
					myres.text= "Could not register an existing user."+"\n";
					reject(myres);
				}else{
					clientb.index({
						index: my_index,
						type: my_type, 
						body: {
							"name":name,
							"email":email,
							"email_length": email.length,
							"password":pw,
							"password_length": pw.length
							}
					}, function(error, response) {
						if (error !== 'undefined') { 
							myres.code="400";
							myres.text=error;
							reject (myres); 
						} else {
							myres.code="420";
							myres.text="Could not register the user/pw." ;
							reject (myres);
						}
					});//end query client.index
					myres.code="200";
					myres.text="succeed";
					resolve(myres); 
				}				
			},(resultReject)=> {
					myres.code="418";
					myres.text= resultReject; 
					reject (myres);
			});//end count_users 
		});//end promise
	}, //end register 	
//****************************************************
	//This function is used to register new users
	//example of use: 
	update_user: function(name, email,pw,res) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var clientb = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			}); 
			var resultCount=0; 
			var resultReject="";
			var error="";
			var response=""; 
			var myres = { code: "", text: "" };
			var count_users = this.query_count_user(email);
			count_users.then((resultCount) => { 
				if(resultCount==0){
					myres.code="409";
					myres.text= "User don't found."+"\n";
					reject(myres); 
				}else{ 
					var id_users = this.find_user_id(email);
					id_users.then((user_id) => { 
						clientb.index({
							index: my_index,
							type: my_type, 
							id: user_id,
							body: {
								"email":email,
								"email_length": email.length,
								"password":pw,
								"password_length": pw.length
								}
						}, function(error, response) {
							if (error !== 'undefined') { 
								myres.code="409";
								myres.text=error;
								reject (myres); 
							} else {
								myres.code="409";
								myres.text="Could not register the user/pw." ;
								reject (myres);
							}
						});//end query client.index
						myres.code="200";
						myres.text="succeed";
						resolve(myres); 
					},(resultReject)=> {
						myres.code="409";
						myres.text= resultReject; 
						reject (myres);
					});//end find id_users
				}
			},(resultReject)=> { 
					myres.code="409";
					myres.text= resultReject; 
					reject (myres);
			});//end count_users
		});//end promise
	}, //end register 	
//****************************************************
	//This function is used to confirm that an user exists or not in the DataBase.
	find_user_id: function(email){ 
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
							{"match_phrase":{"email": email }},
							{"term":{"email_length": email.length}}
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
//****************************************************
	//This function is used to confirm that an user exists or not in the DataBase.
	query_count_user: function(email){ 
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
				body: {
					"query":{"bool":{"must":[
							{"match_phrase":{"email": email }},
							{"term":{"email_length": email.length}}
					]}}
				}
			}, function(error, response) {
				if (error) { 
					reject (error);
				}
				if (response.count !== undefined) {
					size=response.count;
				}else{
					size=0;
				}
				resolve (size); 
			});
		});
	}//end query_count_user	
}//end module.exports
