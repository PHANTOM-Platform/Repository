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
# 6. ################## GET A NEW TOKEN FOR A REGISTERED USER ###################################
	echo -e "\n${LIGHT_BLUE}";
	echo "bash get_token.sh -e bob@example.com -pw 1234 -s ${server} -port ${repository_port} ;";
	read -p $'Press [Enter] key to run the script for \033[1;37mOBTAINING\033[1;34m a new token'; echo -ne "${NO_COLOUR}";
	newtoken=`bash get_token.sh -e bob@example.com -pw 1234 -s ${server} -port ${repository_port} ;` ;
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
	echo "bash repo_put.sh -t ${newtoken} -sfp "../web/example.h" -sjp "../web/exampleh.json" -df "mypath/" -dp "main.h"  -s ${server} -port ${repository_port} ";
	read -p $'Press [Enter] key to run the script for \033[1;37mUPLOADING\033[1;34m a file with metadata'; echo -ne "${NO_COLOUR}";
	bash repo_put.sh -t ${newtoken} -sfp "../web/example.h" -sjp "../web/exampleh.json" -dp "main.h" -df "mypath/" -s ${server} -port ${repository_port} 
# 14. ################## TEST OF DOWNLOADING A FILE WITH A VALID TOKEN, access must be accepted : 200 ###### 
	echo -e "\n${LIGHT_BLUE}";
	echo "bash repo_get_file.sh -t ${newtoken} -file "main.h" -path "mypath/" -s ${server} -port ${repository_port} ";
	read -p $'Press [Enter] key to run the script for \033[1;37mDOWNLOADING\033[1;34m a file from the REPOSITORY'; echo -ne "${NO_COLOUR}";
	bash repo_get_file.sh -t ${newtoken} -project "phantom_tools_on_HPC" -source "user" -path "mypath/" -file "main.h"   -s ${server} -port ${repository_port} 
# 17. ######## TEST OF DOWNLOADING METADATA WITH A VALID TOKEN for files in a path, access must be accepted : 200 ########
	echo -e "\n${LIGHT_BLUE}";
	echo "bash repo_get_metadata.sh -t ${newtoken} -file "main.h" -path "mypath/" -s ${server} -port ${repository_port} ";
	read -p $'Press [Enter] key to run the script for \033[1;37mDOWNLOADING\033[1;34m metadata from the REPOSITORY'; echo -ne "${NO_COLOUR}";
	bash repo_get_metadata.sh -t ${newtoken} -project "phantom_tools_on_HPC" -source "user" -path "mypath/" -file "main.h"  -s ${server} -port ${repository_port} 

