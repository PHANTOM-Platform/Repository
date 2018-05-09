#!/bin/bash
# Script demostration of the USE of the PHANTOM REPOSITORY from the command line using curl
#Author: J.M.Montañana HLRS 2018
#  If you find any bug, please notify to hpcjmont@hlrs.de

#  Copyright (C) 2018 University of Stuttgart
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License. 
 
#0. ########## GLOBAL VARIABLES ###################################
	BASE_DIR=`pwd`;
	server="localhost"; 
	repository_port="8000";
	app=`basename $0`;
	cd `dirname $0`;
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
#0. #### Function Scripts definition ################################
	verify_reponse()
	{ 
		# $1 server
		# $2 port
		echo "Checking Response on port ${2} ...";
		let "j=0"; 
		HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" http://${1}:${2});
		while [[ ${HTTP_STATUS} != "200" ]] && [ ${j} -lt 1 ] ; do 
			let "j += 1 ";  sleep 1; 
			HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" http://${1}:${2});
		done; 
		if [[ ${HTTP_STATUS} != "200" ]]; then
			echo "> Server is unreachable on port ${2}. Aborting."
			exit 1;
		fi;
		echo "Done. Response successfully found on port ${2}.";
		echo ;
	}
# 1. #################  CHECK if Respository server is running ###############
	echo "Checking Repository server ...";
	verify_reponse ${server} ${repository_port};  
# 2. ##################  CHECK if Elasticsearch is running ###############
	echo "Checking ElasticSearch ...";
	HTTP_STATUS=$(curl -s http://${server}:${repository_port}/verify_es_connection);
	if [[ ${HTTP_STATUS} != "200" ]]; then
		echo "> Not Response from the ElasticSearch Server. Aborting.";
		exit 1;
	fi;
	echo "Done. Response successfully found on ElasticSearch-server address.";
# 3. ##################  DELETE DATABASE  ###################################
	echo -e "\n${LIGHT_BLUE}"; 
	echo "curl -s -XGET http://${server}:${repository_port}/drop_db";
	read -p $'Do you wish to \033[1;37mDELETE\033[1;34m the Repository \033[1;37mDB\033[1;34m? (y/n)' confirm; echo -ne "${NO_COLOUR}"; 
	if [[ ! ${confirm} = "" ]]; then
		if [ ${confirm} == 'y' ] || [ ${confirm} == 'Y' ];then
			HTTP_STATUS=$(curl  --silent --output /dev/null --write-out "%{http_code}" -XGET http://${server}:${repository_port}/drop_db);
			if [[ ${HTTP_STATUS} != "200" ]]; then
				echo "> Error, can not delete the DBs."; 
			else
				echo "> DATABASE DELETED !!";
			fi;
			echo
		fi;
	fi;	
# 4. ##################  CREATE A NEW DATABASE  ###################################
	echo -e "\n${LIGHT_BLUE}"; 
	echo "curl -s -XGET http://${server}:${repository_port}/new_db";
	read -p $'Press [Enter] key to \033[1;37mCREATE\033[1;34m a new empty Repository \033[1;37mDB\033[1;34m'; echo -ne "${NO_COLOUR}";
	HTTP_STATUS=$(curl  --silent --output /dev/null --write-out "%{http_code}" -XGET http://${server}:${repository_port}/new_db);
	if [[ ${HTTP_STATUS} != "200" ]]; then
		echo "> Error, can not create DBs. ";
		curl  --silent -XGET http://${server}:${repository_port}/new_db;
	else
		echo "> DATABASE CREATED !!";
	fi; 
# 5. ##################  REGISTER A NEW USER ###################################
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -XPOST http://${server}:${repository_port}/signup?email=\"bob@example.com\"\&pw=\"1234\"";
	read -p $'Press [Enter] key to \033[1;37mREGISTER\033[1;34m the example \033[1;37mUSER\033[1;34m'; echo -ne "${NO_COLOUR}";
	curl -s -H "Content-Type: application/json" -XPOST http://${server}:${repository_port}/signup?email="montana@abc.com"\&pw="new";
	#We sync, because it may start the next command before this operation completes.
	curl -s -XGET ${server}:${repository_port}/_flush > /dev/null;
