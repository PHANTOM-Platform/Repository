#!/bin/bash
#Author: J.M. Montañana 2018
#This compiles and executes the java code which collects the answers from data base and parse them

app=`basename $0`;
cd `dirname $0`;

if [ -e demo_phantom ]; then
	rm -fr demo_phantom;
fi;
mkdir demo_phantom;

######################## COMPILATION
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. get_token.java ConsoleColors.java;
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. verify_token.java ConsoleColors.java;
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. repo_put.java 

javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. repo_get_file.java 

mv *class demo_phantom/;

###################### TESTING THE CLASSES
echo "REQUESTING A NEW TOKEN ....";
java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:.  demo_phantom/get_token "bob@example.com" "1234" "localhost" "8000";

echo "VERIFIYING THE TOKEN ...";
java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:.  demo_phantom/verify_token  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjIwNjg2MTEsImV4cCI6MTUyNDY2MDYxMX0.IjXYKMQFfqU-J8O-tlicyCEr_S9q3kvJ5tusPJCpM2s" "localhost" "8000";

echo "UPLOADING A FILE ... project=demo_hpc source=user path=mypath file=new.h";
java demo_phantom/repo_put  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjIwNjg2MTEsImV4cCI6MTUyNDY2MDYxMX0.IjXYKMQFfqU-J8O-tlicyCEr_S9q3kvJ5tusPJCpM2s" "localhost" "8000" demo_hpc user  "otherpath" "new.h" "../web/example.h" "../web/exampleh.json";

echo "DOWNLOADING A FILE... project=demo_hpc source=user path=mypath file=new.h";
java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:.  demo_phantom/repo_get_file "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjIwNjg2MTEsImV4cCI6MTUyNDY2MDYxMX0.IjXYKMQFfqU-J8O-tlicyCEr_S9q3kvJ5tusPJCpM2s" "localhost" "8000" demo_hpc user  "otherpath" "new.h";
