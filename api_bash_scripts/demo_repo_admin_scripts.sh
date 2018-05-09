#!/bin/bash
#Author: J.M.Montañana HLRS 2018
#Script for create an empty PHANTOM_repository DB.

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
app=`basename $0`;
cd `dirname $0`;
source colors.sh;
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
# 3. ################## DELETE DATABASE ###################################
	echo -e "\n${LIGHT_BLUE}";
	echo "bash delete_db.sh -s ${server} -port ${repository_port} ;"
	read -p $'Press [Enter] key to run the script for \033[1;37mDELETING\033[1;34m the Repository'; echo -ne "${NO_COLOUR}";
	bash delete_db.sh -s ${server} -port ${repository_port} ;
# 4. ################## CREATE A NEW DATABASE ###################################
	echo -e "\n${LIGHT_BLUE}";
	echo "bash create_db.sh -s ${server} -port ${repository_port} ;";
	read -p $'Press [Enter] key to \033[1;37mCREATE\033[1;34m a new empty Repository \033[1;37mDB\033[1;34m'; echo -ne "${NO_COLOUR}";
	bash create_db.sh -s ${server} -port ${repository_port} ;
# 5. ################## REGISTER A NEW USER ###################################
	echo -e "\n${LIGHT_BLUE}";
	echo "bash register_user.sh -e bob@example.com -pw 1234 -s ${server} -port ${repository_port} ;";
	read -p $'Press [Enter] key to run the script for \033[1;37mREGISTER\033[1;34m a new user'; echo -ne "${NO_COLOUR}";	
	bash register_user.sh -e bob@example.com -pw 1234 -s ${server} -port ${repository_port} ;
