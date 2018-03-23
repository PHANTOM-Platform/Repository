var express = require('express'); 

function is_defined(variable) {
	return (typeof variable !== 'undefined');
}

var my_index = 'repository_db'
var my_type = 'logs'
var mf_server = 'localhost:9400';

module.exports = {  
//**********************************************************
	//This function is used to register log in the DB
	//example of use: 
	register_log: function(code,ip,message,date,user) { //date 
		var elasticsearch = require('elasticsearch');
		var clientlog = new elasticsearch.Client({
			host: mf_server,
			log: 'error'
		});  
		var error="";
		var response="";
		var myres = { code: "", text:  "" };
		clientlog.index({
			index: my_index,
			type: my_type, 
			body: {
				"user":user,
				"code":code,
				"ip": ip,
				"message":message,
				"date":date
				}
		}, function(error, response) {
			if (error !== 'undefined') { 
// 				myres.code="409:" +error ;   
				return;
			} else {
// 				myres.code="409:Could not register the user/pw." ;
				return;					
			}
		});//end query client.index   
	}  //end register  
}//end module.exports
