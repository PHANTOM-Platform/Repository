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
	expectedserver="PHANTOM Repository";
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
app=`basename $0`;
cd `dirname $0`;

#0. #### Function Scripts definition ################################
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
		echo "Done. Response successfully found on port ${2}.";
		echo ;
	}
# 1. ################# CHECK if Respository server is running ###############
	echo "Checking Repository server ...";
	verify_reponse ${server} ${repository_port} "${expectedserver}";
# 2. ################## CHECK if Elasticsearch is running ###############
	echo "Checking ElasticSearch ...";
	HTTP_STATUS=$(curl -s http://${server}:${repository_port}/verify_es_connection);
	if [[ ${HTTP_STATUS} != "200" ]]; then
		echo "> Not Response from the ElasticSearch Server. Aborting.";
		exit 1;
	fi;
	echo "Done. Response successfully found on ElasticSearch-server address.";
# 6. ################## GET A NEW TOKEN FOR A REGISTERED USER ###################################
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Content-Type: text/plain\" -XGET http://${server}:${repository_port}/login?email=\"montana@abc.com\"\&pw=\"new\" --output token.txt\"";
	read -p $'Press [Enter] key to get an authentication \033[1;37mNEW TOKEN\033[1;34m for the example user'; echo -ne "${NO_COLOUR}";
	curl -s -H "Content-Type: text/plain" -XGET http://${server}:${repository_port}/login?email="montana@abc.com"\&pw="new" --output token.txt;
# 7. ################## SHOW THE TOKEN IN THE SCREEN ###################################
	echo -e "\n${LIGHT_BLUE}";
	echo "mytoken=\`cat token.txt\`; echo \${mytoken}";
	read -p $'Press [Enter] key to \033[1;37mSEE\033[1;34m the received \033[1;37mTOKEN\033[1;34m'; echo -ne "${NO_COLOUR}";
	mytoken=`cat token.txt;`; echo ${mytoken};

 # 14. ################## TEST OF DOWNLOADING LIST OF FILES WITH A VALID TOKEN, access must be accepted : 200 ###### 
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/downloadlist?project=phantom_tools_on_HPC\&source=user\&filepath=mypath ";
	read -p $'Press [Enter] key to \033[1;37mDOWNLOAD\033[1;34m a \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}";
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/downloadlist?project=phantom_tools_on_HPC\&source=user\&filepath=mypath;

# 14. ################## TEST OF DOWNLOADING A FILE WITH A VALID TOKEN, access must be accepted : 200 ###### 
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/downloadzip?project=phantom_tools_on_HPC\&source=user\&filepath=mypath\&filename=main.c --output demo.zip";
	read -p $'Press [Enter] key to \033[1;37mDOWNLOAD\033[1;34m a \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}";
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/downloadzip?project=phantom_tools_on_HPC\&source=user\&filepath=mypath\&filename=main.c --output demo.zip;

	if [ -e token.txt ]; then rm token.txt; fi;
