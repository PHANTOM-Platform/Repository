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
# 			elif [ "$last" = "-js" ] || [ "$last" = "-JS" ]; then  #json_string format
# 				src_json=$i;
# 				nuevo=false;
			elif [ "$last" = "-sfp" ] || [ "$last" = "-SFP" ]; then
				src_file=$i;
				nuevo=false;
			elif [ "$last" = "-sjp" ] || [ "$last" = "-SJP" ]; then
				json_file=$i;
				nuevo=false;
			elif [ "$last" = "-pr" ] || [ "$last" = "-PR" ]; then
				project=$i;
				nuevo=false;
			elif [ "$last" = "-sr" ] || [ "$last" = "-SR" ]; then
				source=$i;
				nuevo=false;
			elif [ "$last" = "-dp" ] || [ "$last" = "-DP" ]; then
				dst_path=$i;
				nuevo=false;
			elif [ "$last" = "-df" ] || [ "$last" = "-DF" ]; then
				dst_file=$i;
				nuevo=false;

			elif [ "$i" = "-h" ] || [ "$i" = "-H" ]; then
				echo -e "${yellow}Script for UPLOADING a new FILE plus METADATA${reset}";
				echo -e "${yellow}Syntax ${app}:${reset}";
				echo -e "${yellow}   Required fields:${reset}";
				echo -e "${yellow}      authentication token  [-t f7vglñerghpq3ghwoghw] ${reset}";
				echo -e "${yellow}      source_file_path     [-sfp 1234] ${reset}"; # ../web/example.h      src_file
				echo -e "${yellow}      source_json_path     [-sjp 1234] ${reset}"; # ../web/exampleh.json  json_file
# 				echo -e "${yellow}      json_string          [-js 1234] ${reset}"; #  .....   src_json

				echo -e "${yellow}      project              [-pr 1234] ${reset}"; # project
				echo -e "${yellow}      source               [-sr 1234] ${reset}"; # source
				echo -e "${yellow}      destination_path     [-dp 1234] ${reset}"; # main.h dst_file
				echo -e "${yellow}      destination_filename [-df 1234] ${reset}"; # mypath/  dst_path

				echo -e "${yellow}   Optional fields:${reset}";
				echo -e "${yellow}      Server [-s phantom.com] ${reset}";
				echo -e "${yellow}      Port [-port 8000] ${reset}"	;
				echo -e "${yellow}   Help [--help] to get this help.${reset}" ;
				echo -e "\n${yellow} Example of use:\n     ${app}  -t ${newtoken}  -sfp \"../web/example.h\" -sjp \"../web/exampleh.json\" -pr \"phantom_tools_on_HPC\" -sr \"user\" -df \"mypath/\" -dp \"main.h\" ${reset}\n";
				echo -e "\n NOTICE: The \"destination_filename\" is the renamed name of the uploaded file";
# 				echo -e "\n NOTICE: Specify only json_string or source_json_path";
				echo -e "\n NOTICE: The \"path\" and \"filename\" if defined in the JSON MUST will be REPLACED by the MANDATORY input parameters \"destination_path\" and \"destination_filename\"";
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

if [ -z "${src_file}" ]; then
    echo -e "Missing parameter Input File: sfp\n";
    exit 1;
fi;
if [ -z "${json_file}" ]; then
    echo -e "Missing parameter Input JSON: sjp\n";
    exit 1;
fi;
if [ -z "${project}" ]; then
	echo -e "Missing parameter Project: pr\n";
    exit 1;
fi;
if [ -z "${source}" ]; then
	echo -e "Missing parameter Source: sr\n";
    exit 1;
fi;
if [ -z "${dst_path}" ]; then
	echo -e "Missing parameter Destination Path: dp\n";
    exit 1;
fi;
if [ -z "${dst_file}" ]; then
    echo -e "Missing parameter Destination Filename: df\n";
	dst_file=$(basename ${src_file});
	echo -e "We define the destination filename as the same input filename: \"${dst_file}\"\n";
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
# Look which kind of server is listening
	SERVERNAME=$(curl --silent http://${server}:${repository_port}/servername);
	if [[ ${SERVERNAME} != "PHANTOM Repository" ]]; then
		echo " The server found is not a PHANTOM Repository server. Aborting.";
		echo ${SERVERNAME};
		exit 1;
	fi;
######## UPLOAD file and metadata ###################################################
	if [ ! -e ${src_file} ]; then
		echo "error, src-file \"${src_file}\" not found!!";
		exit 1;
	fi;
	if [ ! -e ${json_file} ]; then
		echo "error, json-file \"${json_file}\" not found!!";
		exit 1;
	fi;

curl -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" --write-out "\n%{http_code}" -XPOST -F "UploadFile=@${src_file}" -F "UploadJSON=@${json_file}" http://${server}:${repository_port}/upload?project=${project}\&source=${source}\&DestFileName=${dst_file}\&Path=${dst_path}

exit
	resp=$(curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" --write-out "\n%{http_code}" -XPOST -F "UploadFile=@${src_file}" -F "UploadJSON=@${json_file}" http://${server}:${repository_port}/upload?project=${project}\&source=${source}\&DestFileName=${dst_file}\&Path=${dst_path});
	
	HTTP_STATUS="${resp##*$'\n'}";
	content="${resp%$'\n'*}";
	#We sync, because it may start the next command before this operation completes.
	curl -s -XGET ${server}:${repository_port}/_flush > /dev/null;
######## Screen report of the Result #####################################################
	if [[ ${HTTP_STATUS} == "200" ]]; then
			echo "${content}";
	elif [[ ${HTTP_STATUS} == "409" ]]; then
			echo "[Error:]  HTTP_STATUS: ${HTTP_STATUS}, CONTENT: ${content}";
			echo "response is ${resp}";
	else #this report is for the case we may get any other kind of response
			echo "[Log:] HTTP_STATUS: ${HTTP_STATUS}, CONTENT: ${content}";
			echo "response is ${resp}";
	fi;
