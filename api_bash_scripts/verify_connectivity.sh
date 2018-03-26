#!/bin/bash
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
#  
#  If you find any bug, please notify to hpcjmont@hlrs.de

#Script for verify response of a server in a especific port.
#Returns '0' if get response, or '1' in other case.

source colors.sh;
app=`basename $0`;

if [ $# -eq 1 ]; then
	for i do 
		echo -e "${yellow}Script for VERIFYING if there is response of a server in a especific port.${reset}"
		echo -e "${yellow}Syntax ${app}:${reset}"
		echo -e "${yellow}   Optional fields:${reset}"				
		echo -e "${yellow}      Server [-s phantom.com] ${reset}"
		echo -e "${yellow}      Port [-port 8000] ${reset}"
		echo -e "${yellow}   Help [--help] to get this help.${reset}"
		echo -e "\n${yellow} Example of use  with default values server=localhost port=9400:\n     ${app} ;${reset}"
		echo -e "\n${yellow} Example of use:\n     ${app} -s localhost -port 9400${reset}"
		exit 0; 
	done; 
elif [ $# -eq 4 ]; then
	nuevo=true;
	last="";
	for i do
		if [ "$nuevo" = true ]; then
			if [ "$last" = "-s" ] || [ "$last" = "-S" ]; then
				vserver=$i;
				nuevo=false;
			elif [ "$last" = "-port" ] || [ "$last" = "-PORT" ]; then
				vport=$i;
				nuevo=false;  
			elif [ "$i" = "-h" ] || [ "$i" = "-H" ]; then
				echo -e "${yellow}Script for VERIFYING if there is response of a server in a especific port.${reset}"
				echo -e "${yellow}Syntax ${app}:${reset}"
				echo -e "${yellow}   Optional fields:${reset}"				
				echo -e "${yellow}      Server [-s phantom.com] ${reset}"
				echo -e "${yellow}      Port [-port 8000] ${reset}"
				echo -e "${yellow}   Help [--help] to get this help.${reset}"
				echo -e "\n${yellow} Example of use  with default values server=localhost port=9400:\n     ${app} ;${reset}"
				echo -e "\n${yellow} Example of use:\n     ${app} -s localhost -port 9400${reset}"
				exit 0
			elif [ "$last" != "" ]; then
				echo "error de sintaxis" $last "."
				exit;
			else
				last=$i;
			fi;
		else
			nuevo=true;
			last=$i;
		fi;
	done; 

# 	echo "Checking Response on port ${port} ..."
	let "j=0"; 
	# HTTP_STATUS=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" http://${server}:${port} | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
	HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" http://${vserver}:${vport});
	while [[ ${HTTP_STATUS} != "200" ]] && [ ${j} -lt 1 ] ; do 
		let "j += 1 ";  sleep 1; 
		HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" http://${vserver}:${vport});
	done; 
	if [[ ${HTTP_STATUS} != "200" ]]; then
# 		echo "> Server is unreachable on port ${vport}."
		return 1;
	fi;
# 	echo "Done. Response successfully found on port ${vport}.";
	return 0;
else
	echo -e "Missing parameters\n";
	return 1;
fi;	
