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
################ Fancy colors #################################
		BLUE="\033[0;34m";
	LIGHT_GRAY="\033[0;37m";
LIGHT_GREEN="\033[1;32m";
	LIGHT_BLUE="\033[1;34m";
	LIGHT_CYAN="\033[1;36m";
		yellow="\033[1;33m";
		WHITE="\033[1;37m";
		RED="\033[0;31m";
		marron="\033[2;33m";
	NO_COLOUR="\033[0m";
		white="\033[0;0m";
	nyellow=$'\E[1;33m';
		cyan=$'\E[36m';
		reset=$'\E[0m';
	BC=$'\e[4m'; #underline
	EC=$'\e[0m'; #not underline 

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
			if [ "$last" = "-s" ] || [ "$last" = "-S" ]; then  #server
				server=$i;
				nuevo=false;
			elif [ "$last" = "-port" ] || [ "$last" = "-PORT" ]; then
				repository_port=$i;
				nuevo=false;
			elif [ "$last" = "-t" ] || [ "$last" = "-T" ]; then #token
				mytoken=$i;
				nuevo=false;
			elif [ "$last" = "-sdp" ] || [ "$last" = "-SDP" ]; then #source path
				src_dir=$i;
				nuevo=false;
			elif [ "$last" = "-sjp" ] || [ "$last" = "-SJP" ]; then #JSON common file
				json_file=$i;
				nuevo=false;
			elif [ "$last" = "-pr" ] || [ "$last" = "-PR" ]; then #project
				project=$i;
				nuevo=false;
			elif [ "$last" = "-sr" ] || [ "$last" = "-SR" ]; then #first folder 
				source=$i;
				nuevo=false;
			elif [ "$last" = "-dp" ] || [ "$last" = "-DP" ]; then #other level folders
				dst_path=$i;
				nuevo=false;
			elif [ "$i" = "-h" ] || [ "$i" = "-H" ]; then
				echo -e "${yellow}Script for UPLOADING a DIRECTORY plus METADATA${reset}";
				echo -e "${yellow}Syntax ${app}:${reset}";
				echo -e "${yellow}   Required fields:${reset}";
				echo -e "${yellow}      authentication token  [-t f7vglñerghpq3ghwoghw] ${reset}";
				echo -e "${yellow}      source_dir_path      [-sdp 1234] ${reset}"; # ../web/example.h      src_file
				echo -e "${yellow}      source_json_path     [-sjp 1234] ${reset}"; # ../web/exampleh.json  json_file

				echo -e "${yellow}      project              [-pr 1234] ${reset}"; # project
				echo -e "${yellow}      source               [-sr 1234] ${reset}"; # source
				echo -e "${yellow}      destination_path     [-dp 1234] ${reset}"; # main.h dst_file

				echo -e "${yellow}   Optional fields:${reset}";
				echo -e "${yellow}      Server [-s phantom.com] ${reset}";
				echo -e "${yellow}      Port [-port 8000] ${reset}"	;
				echo -e "${yellow}   Help [--help] to get this help.${reset}" ;
				echo -e "\n${yellow} Example of use:\n     ${app}  -t ${newtoken}  -sdp \"../web/\" -sjp \"demo.json\" -pr \"phantom_tools_demo\" -sr \"development\" -df \"mypath\" ${reset}\n";
				echo -e "\n NOTICE: The \"path\" if defined in the JSON MUST will be REPLACED by the MANDATORY input parameters \"destination_path\"";
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

if [ -z "${src_dir}" ]; then
	echo -e "Missing parameter Input File: sdp\n";
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
	if [ ! -e ${src_dir} ]; then
		echo "error, src-file \"${src_file}\" not found!!";
		exit 1;
	fi;
	if [ ! -e ${json_file} ]; then
		echo "error, json-file \"${json_file}\" not found!!";
		exit 1;
	fi;
	echo "";
	
#$1 is the recursing path
#$2 is the prefix to cut
recurse() {
for i in "$1"/*;do
	if [ -d "$i" ];then
#         echo "dir: $i";
		recurse "$i" $2;
	elif [ -f "$i" ]; then
		echo -e "\nProcessing file: $i";
		file_name=${i#$1/};
		subpath=${i#$2/};
		subpath=${subpath%/$file_name};
		echo -e " uploading: source="development" source_file=$i dest_path=${dst_path}/${subpath} filename=${file_name};\n";
		curl -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" --write-out "\n%{http_code}" -XPOST -F "UploadFile=@${i}" -F "UploadJSON=@${json_file}" http://${server}:${repository_port}/upload?project=${project}\&source=${source}\&Path=${dst_path}/${subpath}\&DestFileName=${file_name};
	fi;
done;
}

recurse ${src_dir} ${src_dir};
