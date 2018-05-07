//************************************************
module.exports = {
	//**********************************************************
	//This function is used to register log in the DB
	//example of use: 
	register_log: function(es_server,my_index,code,ip,message,date,user) { //date
		return new Promise( (resolve,reject) => {
			var myres = { code: "", text: "" };
			var elasticsearch = require('elasticsearch');
			var clientlog = new elasticsearch.Client({
				host: es_server,
				log: 'error'
			});  
			var error="";
			var response="";
			var myres = { code: "", text:  "" };
			clientlog.index({
				index: my_index,
				type: 'logs', 
				body: {
					"user":user,
					"code":code,
					"ip": ip,
					"message":message,
					"date":date
					}
			}, function(error, response) {
				if (error !== 'undefined') { 
					myres.code="409";
					myres.text=error;
					reject (myres); 
				} else {
					myres.code="400";
					myres.text="Could not register the log." ;
					reject (myres); 
					return;					
				}
			});//end query client.index   
			myres.code="200";
			myres.text="succeed";
			resolve(myres);
		});//end promise
	}  //end register  
}//end module.exports
 
// Example of use:
// 	var result LogsModule.register_log( 400,req.connection.remoteAddress,"MSG",currentdate,res.user);
// 	result.then((resultreg) => {
// 		....
// 	},(resultReject)=> { 
// 		....
// 	} ); 
