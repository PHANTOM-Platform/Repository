#!/bin/bash
#Script for seting up  an new database, and register the users from the file list_of_users.ini;
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

#Set up an new database, 
#In case that already setup, it will not perform any change just only return an error on already existing DB. 
curl -s -XGET http://localhost:8000/new_db > /dev/null;

curl -s -XGET http://localhost:8000/_flush > /dev/null;

#### REGISTER NEW USERS
while read -r line ;	do  
	line=${line%%#*}  # strip comment (if any)
	fname=${line#\"};
	name=${fname%%\"*};
        name=${name// /%20};
	params=${fname#*\"}
	params=${params#*	}
	user=${params%%	*};
	userpw=${params#*	};
	userpw=${userpw%% };
	password=${userpw%%	};	
 	echo "name    is: \"${name}\""; 
 	echo "user_id is: \"${user}\"";
 	echo "password is: \"${password}\"";
 	echo ;	
	curl -s -H "Content-Type: application/json" -XPOST http://localhost:8000/signup?name="${name}"\&email="${user}"\&pw="${password}";
done <"list_of_users.ini";

echo -e "done\.n";

