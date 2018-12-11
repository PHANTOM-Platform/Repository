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
	server="localhost";
	repository_port="8000";
	expectedserver="PHANTOM Repository";
	BASE_DIR=`dirname $0`;
	cd ${BASE_DIR};
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
# 8. ################## TEST IF A TOKEN IS VALID OR NOT, this is useful when we not know if the token expired ####### 
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -XGET ${server}:${repository_port}/verifytoken";
	read -p $'Press [Enter] key to \033[1;37mCHECK\033[1;34m if the \033[1;37mTOKEN\033[1;34m is valid or not'; echo -ne "${NO_COLOUR}";
	curl -s -H "Authorization: OAuth ${mytoken}" -XGET ${server}:${repository_port}/verifytoken;
# 13. ################## TEST OF UPLOADING A FILE WITH A VALID TOKEN, access must be accepted : 200 ########## 
	echo -e "\n${LIGHT_BLUE}";
	echo "We upload one more file for testing later the Metadata queries...";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XPOST -F \"UploadFile=@../web-repository/example.h\" -F \"UploadJSON=@../web-repository/exampleh.json\" http://${server}:${repository_port}/upload?project=phantom_tools_on_HPC\&source=user\&DestFileName=main.h\&Path=mypath/";
	read -p $'Press [Enter] key to \033[1;37mUPLOAD\033[1;34m a \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -e "${NO_COLOUR}";
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web-repository/example.h" -F "UploadJSON=@../web-repository/exampleh.json" http://${server}:${repository_port}/upload?project=phantom_tools_on_HPC\&source=user\&DestFileName=main.h\&'Path=mypath/';
	#We sync, because it may start the next command before this operation completes.
	curl -s -XGET ${server}:${repository_port}/_flush > /dev/null;

	
	echo -e "\n${LIGHT_BLUE}We upload one more file for testing later the Metadata queries...";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XPOST -F \"UploadFile=@../web-repository/example.c\" -F \"UploadJSON=@../web-repository/exampleh_domain.json\" http://${server}:${repository_port}/upload?project=phantom_tools_on_HPC\&source=user\&DestFileName=main.c\&Path=mypath/";
	read -p $'Press [Enter] key to \033[1;37mUPLOAD\033[1;34m a \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -e "${NO_COLOUR}";
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web-repository/example.c" -F "UploadJSON=@../web-repository/exampleh.json" http://${server}:${repository_port}/upload?project=phantom_tools_on_HPC\&source=user\&DestFileName=main.c\&'Path=mypath/';
	#We sync, because it may start the next command before this operation completes.
	curl -s -XGET ${server}:${repository_port}/_flush > /dev/null;
	
	echo -e "\n${LIGHT_BLUE}We upload one more file for testing permissions ....";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XPOST -F \"UploadFile=@../web-repository/example.h\" -F \"UploadJSON=@../web-repository/exampleh_domain.json\" http://${server}:${repository_port}/upload?project=phantom_tools_on_HPC\&source=user\&DestFileName=main_domain.h\&Path=mypath/";
	read -p $'Press [Enter] key to \033[1;37mUPLOAD\033[1;34m a \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -e "${NO_COLOUR}";
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web-repository/example.h" -F "UploadJSON=@../web-repository/exampleh.json" http://${server}:${repository_port}/upload?project=phantom_tools_on_HPC\&source=user\&DestFileName=main_domain.h\&'Path=mypath/';
	#We sync, because it may start the next command before this operation completes.
	curl -s -XGET ${server}:${repository_port}/_flush > /dev/null;
	
# 14. ################## TEST OF DOWNLOADING A FILE WITH A VALID TOKEN, access must be accepted : 200 ###### 
	echo -e "\n${LIGHT_BLUE}curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/download?project=phantom_tools_on_HPC\&source=user\&filepath=mypath\&filename=main.c";
	read -p $'Press [Enter] key to \033[1;37mDOWNLOAD\033[1;34m a \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}";
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/download?project=phantom_tools_on_HPC\&source=user\&filepath=mypath\&filename=main.c ;
# 15. ################## TEST OF DOWNLOADING A FILE WITH A VALID TOKEN into a FILE, access must be accepted : 200####### 
	if [ -e main.c ]; then rm main.c; fi; 
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/download?project=phantom_tools_on_HPC\&source=user\&filepath=mypath\&filename=main.c --output main.c";
	read -p $'Press [Enter] key to \033[1;37mDOWNLOAD\033[1;34m a \033[1;37mFILE\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m INTO A NEW LOCAL FILE'; echo -ne "${NO_COLOUR}"
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/download?project=phantom_tools_on_HPC\&source=user\&filepath=mypath\&filename=main.c --output main.c ;
	ls *.c -l;
# 16. ######### TEST OF DOWNLOADING METADATA WITH A VALID TOKEN for a path and a filename, access must be accepted : 200 ####
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -XGET http://${server}:${repository_port}/query_metadata?project=phantom_tools_on_HPC\&source=user\&Path=mypath%2F&filename=main.c";
	read -p $'Press [Enter] key to \033[1;37mRETRIEVE METADATA\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -e "${NO_COLOUR}" ;
	curl -s -H "Authorization: OAuth ${mytoken}" -XGET http://${server}:${repository_port}/query_metadata?project=phantom_tools_on_HPC\&source=user\&Path=mypath%2F\&filename=main.c; 
# 17. ######## TEST OF DOWNLOADING METADATA WITH A VALID TOKEN for files in a path, access must be accepted : 200 ########
	echo -e "\n${LIGHT_BLUE}";
	echo "Now only QUERY on the filepath";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -XGET http://${server}:${repository_port}/query_metadata?project=phantom_tools_on_HPC\&source=user\&Path=mypath%2F";
	read -p $'Press [Enter] key to \033[1;37mRETRIEVE METADATA\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -e "${NO_COLOUR}" ;
	curl -s -H "Authorization: OAuth ${mytoken}" -XGET http://${server}:${repository_port}/query_metadata?project=phantom_tools_on_HPC\&source=user\&Path=mypath%2F ;
# 18. ################## TEST OF DOWNLOADING METADATA WITH A VALID TOKEN and USER DEFINED QUERY ##########################
	echo -e "\n${LIGHT_BLUE}";
	echo "Now only QUERY on the filepath, we EXPLICITLY provide the query";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/es_query_metadata?QueryBody=\"\\{\\\"query\\\":\\{\\\"bool\\\":\\{\\\"must\\\":\\[\\{\\\"match\\\":\\{\\\"path\\\":\\\"mypath/\\\"\\}\\}\\]\\}\\}\\}\"";
	read -p $'Press [Enter] key to \033[1;37mRETRIEVE METADATA\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}" ;
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/es_query_metadata?QueryBody="\{\"query\":\{\"bool\":\{\"must\":\[\{\"match\":\{\"path\":\"mypath/\"\}\}\]\}\}\}";

	
#List of files in a project+source+path in the Repository
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/downloadlist?project=phantom_tools_on_HPC\&source=user\&filepath=mypath ";
	read -p $'Press [Enter] key to \033[1;37mList the files in the PROJECT+SOURCE+PATH\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}"
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/downloadlist?project=phantom_tools_on_HPC\&source=user\&filepath=mypath ;

#List of files in a project+source in the Repository
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/downloadlist?project=phantom_tools_on_HPC\&source=user ";
	read -p $'Press [Enter] key to \033[1;37mList the files in the PROJECT+SOURCE+PATH\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}"
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/downloadlist?project=phantom_tools_on_HPC\&source=user ;
	
#List of files in a project in the Repository
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/downloadlist?project=phantom_tools_on_HPC ";
	read -p $'Press [Enter] key to \033[1;37mList the files in the PROJECT+SOURCE+PATH\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}"
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/downloadlist?project=phantom_tools_on_HPC;
########### EXAMPLE OF DOWNLOADING A FOLDER FROM THE REPOSITORY INTO A ZIP FILE
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/downloadzip?project=phantom_tools_on_HPC\&source=user\&filepath=mypath ";
	read -p $'Press [Enter] key to \033[1;37mList the files in the PROJECT+SOURCE+PATH\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}"
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/downloadzip?project=phantom_tools_on_HPC\&source=user\&filepath=mypath --output demo1.zip;

########### OTHER EXAMPLE OF DOWNLOADING A FOLDER FROM THE REPOSITORY INTO A ZIP FILE
	echo -e "\n${LIGHT_BLUE}";
	echo "curl -s -H \"Authorization: OAuth \${mytoken}\" -H \"Content-Type: multipart/form-data\" -XGET http://${server}:${repository_port}/downloadzip?project=phantom_tools_on_HPC\&source=user\&filepath=mypath ";
	read -p $'Press [Enter] key to \033[1;37mList the files in the PROJECT+SOURCE+PATH\033[1;34m with \033[1;37mVALID TOKEN\033[1;34m'; echo -ne "${NO_COLOUR}"
	curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/downloadzip?project=phantom_tools_on_HPC --output demo2.zip;
if [ -e token.txt ]; then rm token.txt; fi;
