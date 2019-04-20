var imported = document.createElement("script");
imported.src = "phantom.js";
document.getElementsByTagName("head")[0].appendChild(imported);

/**
* Returns the host and port (if defined) for building the url
* @returns {String} beginning of the url
*/
function build_repo_path(){
	var url="";
	if(typeof reposerver!== 'undefined'){ // Any scope
		if(reposerver){
		if(reposerver.length>0){
			url=url+"http://"+reposerver;
			if(typeof repoport!== 'undefined') {// Any scope
				if ((repoport) && repoport.lenght>0){
					url=url+":"+repoport;
	}	}	}	}}
	return url;
}

function repo_logout() {
	sessionStorage.setItem('token', '');
	request_share_session_storage();
// 	checktoken();//already called at the end of request_share_session_storage
	window.location = 'repository.html';
	return false;
}

function repo_load_menu_login(){
	var menu_login = document.getElementById("menu_login");
	if(menu_login){
	var menuhtml="<H1 id=\"title_login\" style=\"overflow-wrap:break-word; max-width:80%; word-break:break-all;\"><b>LOGIN into REPOSITORY-Server</b></H1>";
	menuhtml+="<form";
	menuhtml+="	id='requestToken'";
	menuhtml+="	method='get'";
	menuhtml+="	name=\"myForm\" autocomplete=\"on\">";
// <!-- 		encType="multipart/form-data"> //for post not for get-->
	menuhtml+="	<div class=\"center\">";
	menuhtml+="		User: <input type=\"text\" name=\"user\" id=\"user\" value=\"\"><br>";
	menuhtml+="		Password: <input type=\"password\" name=\"password\" id=\"password\" value=\"\" autocomplete=\"off\"> <br>";
	menuhtml+="		<input type=\"hidden\" name=\"pretty\" value=\"true\" />";
	menuhtml+="		<input type=\"submit\" onclick=\" repo_login(document.getElementById('user').value, document.getElementById('password').value); return false;\" value=\"LOGIN\" />";
	menuhtml+="	</div>";
	menuhtml+="</form>";
	menu_login.innerHTML = menuhtml;
	return true;
	}else{
		return false;
	}
}


function repo_load_header(){
	var menu_phantom = document.getElementById("menu_phantom");
	if(menu_phantom){
	var menuhtml="<ul class=\"menuphantom\">";
	menuhtml+="	<li class=\"menuphantom\"><a href=\"query_metadata.html\">Query metadata</a></li>";
	menuhtml+="	<li class=\"menuphantom\"><a href=\"file_list.html\">List files</a></li>";
	menuhtml+="	<li class=\"menuphantom\"><a href=\"upload_file.html\">Register new file</a></li>";
	menuhtml+="	<li class=\"menuphantom\"><a href=\"download_file.html\">Download a file</a></li>";
	menuhtml+="	<li class=\"menuphantom\"><a href=\"download_zip.html\">Download a zip file</a></li>";
	menuhtml+="	<li class=\"menuphantom\"><a href=\"examplec.json\">Download JSON example</a></li>";
	menuhtml+="	<li class=\"menuphantom\"><a href=\"log_list.html\">List of logs</a></li>";
	menuhtml+="	<li class=\"menuphantom\"><input type=\"button\" value=\"Night mode\" onclick=\"switchnightmode()\"></a></li>";

// 	class="active"
	menuhtml+="	<li class=\"phantomlogo\" style=\"float:right\">";
	menuhtml+="	<img src=\"phantom.gif\" alt=\"PHANTOM\" height=\"32\" style=\"background-color:white;\">";
	menuhtml+="	</li>";
	menuhtml+="	<li class=\"menuphantomR\">";
	menuhtml+="		<p><a onClick=\"repo_logout();return false;\" href=\"PleaseEnableJavascript.html\">LogOut</a></p></li>";
	menuhtml+="</ul>";
	menu_phantom.innerHTML = menuhtml;
	}
}



function repo_load_header_footer(){
	repo_load_header();
	repo_load_menu_login();
	load_footer();
	checktoken();
}


function repo_login(user,password){
	var demoreplaceb = document.getElementById("demoreplaceb");
	var debug_phantom = document.getElementById("debug_phantom");
	var menu_login = document.getElementById("menu_login");
	var menu_phantom = document.getElementById("menu_phantom"); //top menu
	var url=build_repo_path()+"/login?email="+user+"\&pw="+password+"";//?pretty='true'";
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onreadystatechange = function() {
		if (xhr.status == 200) {
			var serverResponse = xhr.responseText;
			savetoken(serverResponse);
			checktoken();
			var menuhtml="<H1 style=\"overflow-wrap:break-word; max-width:80%; word-break:break-all;\"><b>Choose one option from the top menu</b></H1>";
			if(menu_login) menu_login.innerHTML = menuhtml;
			if(menu_login) menu_login.style.display = "block";
		}else{
			repo_logout();
// 			checktoken();
			repo_load_menu_login();
			if(menu_login) menu_login.style.display = "block";
			var serverResponse = xhr.responseText;
			if(menu_phantom) menu_phantom.style.display = "none";
			if(demoreplaceb) demoreplaceb.innerHTML = "<pre>Error: "+ serverResponse+ "</pre>";
			if(debug_phantom) debug_phantom.style.display = "block";
		}
	};
	xhr.send(null);
	return false;
}


function jsontotable_repo_logs_brief(myjson,count,first,level,lastwascoma,mtitle,filtered_fields){
	var html ="";
	var i;
// 	if(first==true){ html ="{"; }
	var mainc=mtitle;
	if(first==true){
		html += "<div><table style='border:1px solid black' id=\"table_results\">\n";// style='width:100%'>";
		html += "<th><strong> _id </strong> </th>\n";
		html += "<td><strong> &nbsp;Code&nbsp; </strong></td>\n";
		html += "<td><strong> &nbsp;User&nbsp; </strong></td>\n";
		html += "<td><strong> &nbsp;Ip&nbsp; </strong></td>\n";
		html += "<td><strong> &nbsp;Message&nbsp; </strong></td>\n";
		html += "<td><strong> &nbsp;Date&nbsp;</strong></td>\n";
		count++;
	}
	first=false;
	var countseries=0;
	myjson.forEach(function(val) {
// 		if (count != 1 && lastwascoma==false) {
// 			html += (countseries==0) ? ",<br>" : "<br>},{<br>";
// 		};//this is not the first element
		lastwascoma=true;
		var keys = Object.keys(val);
		keys.forEach(function(key) {
			if (getType(val[key]) == "string" || getType(val[key]) == "other" ){
				var tobefiltered=false;
				for (i=0;i< filtered_fields.length;i++){
					if (key.endsWith(filtered_fields[i], key.length)== true) {
						tobefiltered=true;
					}
				}
				if (tobefiltered== false) {//it is stored the length of the strings, not need to show
// 					if (count != 1 && lastwascoma==false) html += ',<br>';
// 					for (i = 0; i < level; i++) {
// 						if (count != 1) html += '&emsp;';
// 					}
					if(mtitle==true){
						if(count>1){
							html += "</tr>\n<tr>";
// 							html += "</table></div></td><br>\n";
// 							html += "<div><table style='border:1px solid black'>\n";// style='width:100%'>";
						}
						html += "<td> " + val['_id'] +" </td>\n";
						//source
						if(val['_source'] !=undefined){
							if(val['_source']['code']==undefined){
								html += "<td></td>\n";
							}else if((val['_source']['code']>="200")&&(val['_source']['code']<"300")){//green 2xx-correct,3xx-redirections
								html += "<td bgcolor=\"#00ff00\"> <font color=\"black\">" + val['_source']['code'] +"</font> </td>\n";
							}else if((val['_source']['code']>="400") && (val['_source']['code']<"600")) {//red 4xx-client-error 5xx-server-error
								html += "<td bgcolor=\"#ff3e29\"> <font color=\"black\">" + val['_source']['code'] +"</font> </td>\n";
							}else if((val['_source']['code']>="100")&&(val['_source']['code']<"200")){ //yellow-information
								html += "<td bgcolor=\"#f3ff3a\"> <font color=\"black\">" + val['_source']['code'] +"</font></td>\n";
								
	// 						}else if(val['_source']['code']=="cancelled"){//red
	// 							html += "<td bgcolor=\"#ff3e29\"> " + val['_source']['code'] +" </td>\n";
	// 						}else if(val['_source']['code']=="started"){//green
	// 							html += "<td bgcolor=\"#00FF00/*\*/">" + val['_source']['code'] +"</td>\n";
	// 						}else{
	// // 						html += "<td> " + val['_source']['code'] +"</td>\n";
							}
							html += (val['_source']['user']==undefined)? "<td></td>\n" : 
								"<td> " + val['_source']['user'] +" </td>\n";
							html += (val['_source']['ip']==undefined)? "<td></td>\n" : 
								"<td> " + val['_source']['ip'] +" </td>\n";
							html += (val['_source']['message']==undefined)? "<td></td>\n" :
								"<td> " + val['_source']['message'] +" </td>\n";
							html += (val['_source']['date']==undefined)? "<td></td>\n" :
								"<td> " + val['_source']['date'] +" </td>\n";
						}else{
							html += "<td></td>\n";
							html += "<td></td>\n";
							html += "<td></td>\n";
							html += "<td></td>\n";
							html += "<td></td>\n";
						}
						mtitle=false;
						count++;
						lastwascoma=false;
					}
// 					if((key=="rejection_reason")){
// 						if(val['req_status']=="rejected"){
// 							html += "<td><strong>\"" + key +"\"</strong>: \"" + val[key] +"\"</td>\n";
// 							count++;
// 							lastwascoma=false;
// 						}
// 					}else if((key!="req_status")&&(key!="energy")&&(key!="execution_id")&&(key!="app")&&(key!="device")){
// 						html += "<td><strong>\"" + key +"\"</strong>: \"" + val[key] +"\"</td>\n";
// 						count++;
// 						lastwascoma=false;
				}
			}else if (getType(val[key]) == "array" || getType(val[key]) == "object" ) {
// 				if(key!= "component_stats"){
// // 					if (count != 1) html += ',<br>';
// // 					for (i = 0; i < level; i++) {
// // 						if (count != 1) html += '&emsp;';
// // 					}
// 					if(mtitle==true){
// 						if(count>1){
// 							html += "</table></div></td><br>\n";
// 							html += "<div><table style='border:1px solid black'>\n";// style='width:100%'>";
// 						}
// 						html += "<tr><th><strong>\"" + key + "\"</strong>: </th>\n";
// 						
// 						mtitle=false;
// 					}else{
// 						html += "<tr><td><strong>\"" + key + "\"</strong>: </td>\n";
// 					}
// 					count++;
// 					lastwascoma=false;
// 					html += "<td><div><table style='width:100%; border:0px solid black'>\n";// style='width:100%'>";
					html += jsontotable_repo_logs_brief( ([ val[key] ]), count, first, level+1 ,lastwascoma,mtitle,filtered_fields);
// 					html += "</table></div></td>\n";
// 				}
// // 			}else if (getType(val[key]) == "object" ) {
// // 				html += jsontotable( ([ val[key] ]), count, false, level+1,lastwascoma,mtitle,filtered_fields);
			};
		});
// 		mtitle=true;
		countseries++;
	});
// 	if(first==true){ html += "<br>}"; }
// 	if(mainc==true)
// 		html += "</table></div>\n";
	return html;
}//jsontotable_repo_logs_brief

function download_file_repo(project, source,filepath, filename){
	var url = build_repo_path() + "/download?project=\""+project+"\"\&source=\""+source+"\"\&filepath=\""+filepath+"\"\&filename=\""+filename+"\"";//?pretty='true'";
	request_download(url, "", 'text/plain');
	return false;
}

function download_metadata_repo(project,source,filepath, filename){
	var url = build_repo_path() + "/query_metadata?project=\""+project+"\"\&source=\""+source+"\"\&filepath=\""+filepath+"\"\&filename=\""+filename+"\"";//?pretty='true'";
	request_download(url, "", 'text/plain');
	return false;
}

function downloadzip_file_repo(project, source, filepath, filename){
	if(project == undefined){
		return false;
	}else if(project.length==0){
		return false;
	}
	var url = build_repo_path() + "/downloadzip?project=\""+project+"\"";
	if(source !== undefined){
		if(source.length>0) {
			url +="\&source=\""+source+"\"";
			if(filepath !== undefined){
				if(filepath.length>0) {
					url +="\&filepath=\""+filepath+"\"";
					if(filename !== undefined){
						if(filename.length>0) {
							url +="\&filename=\""+filename+"\"";
						}
					}
				}
			}
		}
	}
	request_downloadzip(url, "output.zip", "application/zip");
	return false;
}


function list_repo_logs(mytype,user){
	var url = build_repo_path() + "/get_log_list?pretty='true'";
	list_results(mytype,url,["host"],["_length","_index","_type","_score","sort"]);
	return false;
}

function request_downloadzip(url, outputfile, type){
	var demoreplaceb = document.getElementById("demoreplaceb");
	var debug_phantom = document.getElementById("debug_phantom");
	var phantom_operation = document.getElementById("phantom_operation");
	var xhr = new XMLHttpRequest();
	console.log("url is "+url);
	xhr.open("GET", url, true);
	xhr.processData= false;
	xhr.setRequestHeader("Content-Type", type);
	if(sessionStorage.token !== undefined){
		if(sessionStorage.token.length>0) {
			xhr.setRequestHeader("Authorization", "JWT " + sessionStorage.token);
	}}
	xhr.responseType = 'arraybuffer';
	xhr.addEventListener('load', function() {
		if (xhr.readyState === 4 && xhr.status == 200) {
// 			var responseObject = [ xhr.response ];
			if(outputfile.length>0)
				download_file(xhr.response, outputfile, type);
			if (demoreplaceb) demoreplaceb.innerHTML = "Downloaded file."; //+responseObject + " status: " +xhr.status;
			if (debug_phantom) debug_phantom.style.display = "block";
			if(phantom_operation) phantom_operation.style.display="none";
		}
	});
	xhr.send(null);
	return false;
}

function submitform_file_list(project, source,filepath){
// 	if(project == undefined){
// 		return false;
// 	}else if(project.length==0){
// 		return false;
// 	}
	var url = build_repo_path() + "/downloadlist";
	
	if(project !== undefined){
		if(project.length>0) {
			url += "?project=\""+project+"\"";
			if(source !== undefined){
				if(source.length>0) {
					url +="\&source=\""+source+"\"";
					if(filepath !== undefined){
						if(filepath.length>0) {
							url +="\&filepath=\""+filepath+"\"";
						}
					}
				}
			}
		}
	}
	submitform(url, 'GET', '');
	return false;
}

function submitform_qr_metatada(e, frm) {
	var filepath = document.getElementById("Path").value;
	var filename = document.getElementById("filename").value;
	var project= document.getElementById("project").value;
	var source = document.getElementById("source").value;
	var url = "query_metadata?project=" + project + "&source=" + source + "&filepath=" + filepath + "&filename=" + filename;
	submitform(url, 'GET', 'metadata.json');
	return false;
}

function submitform_qr_metatada_es(e, frm) {
	var QueryBody = document.getElementById("QueryBody").value;
	var url = "es_query_metadata?QueryBody=" + QueryBody;
	submitform(url, 'GET', 'metadata.json');
	return false;
}

function request_download(url, outputfile, type){
	var demoreplaceb = document.getElementById("demoreplaceb");
	var debug_phantom = document.getElementById("debug_phantom");
	var phantom_operation = document.getElementById("phantom_operation");
	var xhr = new XMLHttpRequest();
	console.log("url is "+url);
	xhr.open("GET", url, true);
	xhr.processData= false;	
	xhr.setRequestHeader("Content-Type", type);
	if(sessionStorage.token !== undefined){
		if(sessionStorage.token.length>0) {
			xhr.setRequestHeader("Authorization", "JWT " + sessionStorage.token);
	}}
	xhr.addEventListener('load', function() {
// 	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status == 200) {
			var responseObject = [ xhr.responseText ];
			if(outputfile.length>0)
				download_file(xhr.response, outputfile, type);
			if (demoreplaceb) demoreplaceb.innerHTML = "<pre>" + responseObject+ "</pre>"; // + " status: " +xhr.status;
			if (debug_phantom) debug_phantom.style.display = "block";
			if(phantom_operation) phantom_operation.style.display="none";
		}else{
			if (demoreplaceb) demoreplaceb.innerHTML = "<pre>"+responseObject + " status: " +xhr.status + "</pre>";
			if (debug_phantom) debug_phantom.style.display = "block";
		}
	});
	xhr.send(null);
	return false;
}
