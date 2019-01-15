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

################### Global Variables' Definition #############################
server="localhost"; 
repository_port="8000";
expectedserver="PHANTOM Repository";
resp="";
app=`basename $0`;
cd `dirname $0`;
source colors.sh;
################ Function Definitions #################################
verify_reponse()
{
	# $1 server
	# $2 port
	# $3 expectedserver
	echo "Checking Response on port ${2} ...";
	let "j=0";
	if [ "$#" -lt 3 ]; then
		echo "error missing parameters at function verify_response";
		exit 1;
	fi;
	HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" http://${1}:${2});
	while [[ ${HTTP_STATUS} != "200" ]] && [ ${j} -lt 1 ] ; do 
		let "j += 1 "; sleep 1;
		HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" http://${1}:${2});
	done; 
	if [[ ${HTTP_STATUS} != "200" ]]; then
		echo "> Server is unreachable on port ${2}. Aborting.";
		exit 1;
	fi;
	HTTP_STATUS=$(curl -s http://${1}:${2}/verify_es_connection);
	if [[ ${HTTP_STATUS} != "200" ]]; then
		echo "> Server has not connection with the ElasticSearch server. Aborting.";
		exit 1;
	fi;
	# Look which kind of server is listening
	SERVERNAME=$(curl --silent http://${1}:${2}/servername);
	if [[ ${SERVERNAME} != ${3} ]]; then
		echo " The server found is not a ${3} server. Aborting.";
		echo ${SERVERNAME} != ${3};
		exit 1;
	fi;
	echo -e "Done. Response successfully found on port ${2}.\n";
}

delete_file_and_metadata()
{
	#$1 is token
	#$2 is project
	#$3 is the source
	#$4 is the path
	#$5 is the filename
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${1}\" -H \"Content-Type: multipart/form-data\" -XPOST http://${server}:${repository_port}/delete_metadata?project=${2}\&source=${3}\&Path=${4}\&DestFileName=${5}";
	
	read -p $'Press [Enter] key to \033[1;37mDELETE METADATA\033[1;34m and \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -e "${NO_COLOUR}";

	resp=$(curl -s -H "Authorization: OAuth ${1}" -H "Content-Type: multipart/form-data" --write-out "\n%{http_code}" -XPOST http://${server}:${repository_port}/delete_metadata?project=${2}\&source=${3}\&Path=${4}\&DestFileName=${5});
}

delete_file_and_metadata_emptypath()
{
	#$1 is token
	#$2 is project
	#$3 is the source
	#$4 is the filename
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${1}\" -H \"Content-Type: multipart/form-data\" -XPOST http://${server}:${repository_port}/delete_metadata?project=${2}\&source=${3}\&Path=""\&DestFileName=${4}";
	
	read -p $'Press [Enter] key to \033[1;37mDELETE METADATA\033[1;34m and \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -e "${NO_COLOUR}";

	resp=$(curl -s -H "Authorization: OAuth ${1}" -H "Content-Type: multipart/form-data" --write-out "\n%{http_code}" -XPOST http://${server}:${repository_port}/delete_metadata?project=${2}\&source=${3}\&Path=""\&DestFileName=${4});
}
################ Parse of the input parameters #################################  
src_file="";
json_file="";
dst_file="";
dst_path="";
project="";
source="";
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
			elif [ "$last" = "-project" ] || [ "$last" = "-PROJECT" ]; then
				project=$i;
				nuevo=false;
			elif [ "$last" = "-source" ] || [ "$last" = "-SOURCE" ]; then
				source=$i;
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
				echo -e "${yellow}      authentication token  [-t f7vglñerghpq3ghwoghw] ${reset}";

				echo -e "${yellow}      project at the repo  [ -project 1234 ] ${reset}";
				echo -e "${yellow}      source at the repo   [ -source 1234 ] ${reset}";
				echo -e "${yellow}      path at the repo     [ -dp 1234 ] ${reset}";
				echo -e "${yellow}      filename at the repo [ -df 1234 ] ${reset}\n";

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

if [ -z "${project}" ]; then
	echo -e "Missing parameter Project: -project\n";
	exit 1;
fi;
if [ -z "${dst_file}" ]; then
	echo -e "Missing parameter Destination Filename: -df\n";
	exit 1;
fi;
if [ -z "${source}" ]; then
	echo -e "Missing parameter Source: -source\n";
	exit 1;
fi;
# if [ -z "${dst_path}" ]; then
# 	echo -e "Missing parameter Destination Path: -dp\n";
# 	exit 1;
# fi;
################### Testing connectivity with the PHANTOM Repository server: #############
	echo "Checking Repository server ...";
	verify_reponse ${server} ${repository_port} "${expectedserver}";
######## DELETE file and metadata ###################################################
	if [ -z "${dst_path}" ]; then
		delete_file_and_metadata_emptypath ${mytoken} ${project} ${source} ${dst_file};
	else
		delete_file_and_metadata ${mytoken} ${project} ${source} ${dst_path} ${dst_file};
	fi;
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
