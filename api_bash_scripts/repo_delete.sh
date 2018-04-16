#!/bin/bash
#Script for register a new user in the PHANTOM REPOSITORY.
#Author: J.M.Montañana HLRS 2018
#  If you find any bug, please notify to hpcjmont@hlrs.de

#Copyright (C) 2018 University of Stuttgart
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
# 
#      http://www.apache.org/licenses/LICENSE-2.0
# 
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

###################   Global Variables' Definition #############################
server="localhost"; 
repository_port="8000";
app=`basename $0`;
cd `dirname $0`;
source colors.sh;
################ Parse of the input parameters #################################  
src_file="";
json_file="";
dst_file="";
dst_path="";
if [ ! $# -eq 0 ]; then
	nuevo=true;
	last="";
	for i do
		if [ "$nuevo" = true ]; then
			if [ "$last" = "-s" ] || [ "$last" = "-S" ]; then
				server=$i;
				nuevo=false; 
			elif [ "$last" = "-port" ] || [ "$last" = "-PORT" ]; then
				repository_port=$i;
				nuevo=false;  
			elif [ "$last" = "-t" ] || [ "$last" = "-T" ]; then
				mytoken=$i;
				nuevo=false; 		
				
			elif [ "$last" = "-dp" ] || [ "$last" = "-DP" ]; then
				dst_file=$i;
				nuevo=false;
			elif [ "$last" = "-df" ] || [ "$last" = "-DF" ]; then
				dst_path=$i;
				nuevo=false;
			elif [ "$i" = "-h" ] || [ "$i" = "-H" ]; then
				echo -e "${yellow}Script for DELETING a FILE and its METADATA${reset}";
				echo -e "${yellow}Syntax ${app}:${reset}";
				echo -e "${yellow}   Required fields:${reset}";
				echo -e "${yellow}      authorization token  [-t f7vglñerghpq3ghwoghw] ${reset}";  
				echo -e "${yellow}      filename_at_the_repository [-df 1234] ${reset}\n"; # mypath/  dst_path
				echo -e "${yellow}      path_at_the_repository     [-dp 1234] ${reset}";   # main.h dst_file
				echo -e "${yellow}   Optional fields:${reset}";
				echo -e "${yellow}      Server [-s phantom.com] ${reset}";
				echo -e "${yellow}      Port [-port 8000] ${reset}";
				echo -e "${yellow}   Help [--help] to get this help.${reset}";
				echo -e "\n${yellow} Example of use:\n   ${app}  -t ${newtoken} -dp \"main.h\" -df \"mypath/\" ${reset}\n"; 
				exit 0;
			elif [ "$last" != "" ]; then
				echo "error de sintaxis" $last ".";
				exit 1;
			else
				last=$i;
			fi;
		else
			nuevo=true;
			last=$i;
		fi;
	done; 
fi;
 
if [ -z "${dst_file}" ]; then
    echo -e "Missing parameter Destination Filename: df\n";
    exit 1;
fi;
if [ -z "${dst_path}" ]; then
    echo -e "Missing parameter Destination Path: dp\n";
    exit 1;
fi; 
################### Testing connectivity with the PHANTOM Repository server: #############
	source verify_connectivity.sh -s ${server} -port ${repository_port};
	conectivity=$?;
	if [ ${conectivity} -eq 1 ]; then
		echo "[ERROR:] Server \"${server}\" is unreachable on port \"${repository_port}\".";
		exit 1;
	fi;
##### Testing if the PHANTOM Repository server can access to the Elasticsearch Server ####
	HTTP_STATUS=$(curl -s http://${server}:${repository_port}/verify_es_connection);
	if [[ ${HTTP_STATUS} != "200" ]]; then
		echo "PHANTOM Repository Doesn't get Response from the ElasticSearch Server. Aborting.";
		exit 1;
	fi; 
######## UPLOAD file and metadata ###################################################  
	resp=$(curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" --write-out "\n%{http_code}" -XPOST http://${server}:${repository_port}/delete_metadata?Project=demo\&Source=userDestFileName=${dst_file}\&Path=${dst_path});
 
	HTTP_STATUS="${resp##*$'\n'}";
	content="${resp%$'\n'*}";
	#We sync, because it may start the next command before this operation completes.
	curl -s -XGET ${server}:${repository_port}/_flush > /dev/null;
######## Screen report of the Result #####################################################
	if [[ ${HTTP_STATUS} == "200" ]]; then
			echo "${content}"; 			
	elif [[ ${HTTP_STATUS} == "409" ]]; then
			echo "[Error:]  HTTP_STATUS: ${HTTP_STATUS}, CONTENT: ${content}";
	else #this report is for the case we may get any other kind of response
			echo "[Log:] HTTP_STATUS: ${HTTP_STATUS}, CONTENT: ${content}";
	fi;
