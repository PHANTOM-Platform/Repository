#!/bin/bash
#Author: J.M.Montañana HLRS 2018
#Script for create an empty PHANTOM_repository DB.

#Copyright (C) 2018 University of Stuttgart
#
# 	Licensed under the Apache License, Version 2.0 (the "License");
# 	you may not use this file except in compliance with the License.
# 	You may obtain a copy of the License at
# 
# 		http://www.apache.org/licenses/LICENSE-2.0
# 
# 	Unless required by applicable law or agreed to in writing, software
# 	distributed under the License is distributed on an "AS IS" BASIS,
# 	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# 	See the License for the specific language governing permissions and
# 	limitations under the License.

################### Global Variables' Definition #############################
server="localhost"; 
repository_port="8000";
app=`basename $0`;
cd `dirname $0`;
source colors.sh;
user="hpcjmont@hlrs.de";#"bob@example.com";
pw="12345678";
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
# 6. ################## GET A NEW TOKEN FOR A REGISTERED USER ###################################
	echo -e "\n${LIGHT_BLUE}";
	echo "bash get_token.sh -e ${user} -pw ${pw} -s ${server} -port ${repository_port} ;";
	read -p $'Press [Enter] key to run the script for \033[1;37mOBTAINING\033[1;34m a new token'; echo -ne "${NO_COLOUR}";
	newtoken=`bash get_token.sh -e ${user} -pw ${pw} -s ${server} -port ${repository_port} ;` ;
	echo -e "the newtoken is:\n${newtoken}\n";
# 8. ################## TEST IF A TOKEN IS VALID OR NOT, this is useful when we don't know if the token has expired ####### 
	echo -e "\n${LIGHT_BLUE}";
	echo -e "OPTINAL test, not need to perform the verification";
	echo "bash verify_token.sh -t ${newtoken} -s ${server} -port ${repository_port} ;";
	read -p $'Press [Enter] key to run the script for \033[1;37mVERIFYING\033[1;34m a token'; echo -ne "${NO_COLOUR}";
	bash verify_token.sh -t ${newtoken} -s ${server} -port ${repository_port} ;
# 13. ################## TEST OF UPLOADING A FILE WITH A VALID TOKEN, access must be accepted : 200 ##########
	echo -e "\n${LIGHT_BLUE}";
	echo -e "We are currently defining the project and the source in the json file !!!"
	echo "bash repo_put.sh -t ${newtoken} -sfp \"../web/example.h\" -sjp \"../web/exampleh.json\" -dp \"mypath/\" -df \"main.h\" -s ${server} -port ${repository_port} ";
	read -p $'Press [Enter] key to run the script for \033[1;37mUPLOADING\033[1;34m a file with metadata'; echo -ne "${NO_COLOUR}";
	bash repo_put.sh -t ${newtoken} -sfp "../web/example.h" -sjp "../web/exampleh.json" -pr "phantom_tools_on_HPC" -sr "user" -dp "mypath" -df "main.h" -s ${server} -port ${repository_port};
# 14. ################## TEST OF DOWNLOADING A FILE WITH A VALID TOKEN, access must be accepted : 200 ###### 
	echo -e "\n${LIGHT_BLUE}";
	echo "bash repo_get_file.sh -t ${newtoken} -project \"phantom_tools_on_HPC\" -source \"user\" -path \"mypath/\" -file \"main.h\" -s ${server} -port ${repository_port} ";
	read -p $'Press [Enter] key to run the script for \033[1;37mDOWNLOADING\033[1;34m a file from the REPOSITORY'; echo -ne "${NO_COLOUR}";
	bash repo_get_file.sh -t ${newtoken} -project "phantom_tools_on_HPC" -source "user" -path "mypath" -file "main.h" -s ${server} -port ${repository_port};
# 17. ######## TEST OF DOWNLOADING METADATA WITH A VALID TOKEN for files in a path, access must be accepted : 200 ########
	echo -e "\n${LIGHT_BLUE}";
	echo "bash repo_get_metadata.sh -t ${newtoken} -project \"phantom_tools_on_HPC\" -source \"user\" -path \"mypath/\" -file \"main.h\" -s ${server} -port ${repository_port} ";
	read -p $'Press [Enter] key to run the script for \033[1;37mDOWNLOADING\033[1;34m metadata from the REPOSITORY'; echo -ne "${NO_COLOUR}";
	bash repo_get_metadata.sh -t ${newtoken} -project "phantom_tools_on_HPC" -source "user" -path "mypath" -file "main.h" -s ${server} -port ${repository_port};
