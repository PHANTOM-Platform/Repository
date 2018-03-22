var express = require('express'); 

function is_defined(variable) {
	return (typeof variable !== 'undefined');
}

var my_index = 'repository_db'
var my_type = 'users'
var mf_server = 'localhost:9400';



module.exports = { 
//**********************************************************
		//This function is used to verify the User and Password
	query_user_pw: function(email,pw){
		return new Promise( (resolve,reject) => {
			var size =0;
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
			client.count({
				index: my_index,
				type:  my_type, 
				body: {
					query: {bool:{must:[ 				
						{match:{"email":email}},
						{match:{"email_length":email.length}},
						{match:{"password":pw}}, 
						{match:{"password_length":pw.length}}
					] } }
				}
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
	},//end query_user_pw
//**********************************************************
	//This function is used to register new users
	//example of use: 
	register: function(email,pw,res) {
		return new Promise( (resolve,reject) => {
			var elasticsearch = require('elasticsearch');
			var clientb = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			}); 
			var resultCount="";
			var resultReject="";
			var error="";
			var response="";
			var myres = { code: "", text:  "" };
			var count_users = this.query_user(email);
			count_users.then((resultCount) => {  
				if(resultCount!=0){
// 					/*resolve */("Could not register an existing user.");
					var mres;
					myres.code="409";
					myres.text= "Could not register an existing user."+"\n";
					resolve(myres);
				}else{
					clientb.index({
						index: my_index,
						type: my_type, 
						body: {
							"email":email,
							"email_length": email.length,
							"password":pw,
							"password_length": pw.length
							}
					}, function(error, response) {
						if (error !== 'undefined') { 
							myres.code="409";
							myres.text=error ; 						
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
	query_user: function(email){ 
		return new Promise( (resolve,reject) => {
			var size =0;
			var elasticsearch = require('elasticsearch');
			var client = new elasticsearch.Client({
				host: mf_server,
				log: 'error'
			});
			client.count({
				index: my_index,
				type:  my_type, 
				body: {
					query:{bool:{must:[
							{match:{"email": email }},
							{match:{"email_length": email.length}}
					]}}
				}
			}, function(error, response) {
				if (error) {
					console.log(error);
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
	}//end query_user	
}//end module.exports
