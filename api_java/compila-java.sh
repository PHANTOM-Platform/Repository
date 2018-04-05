#!/bin/bash
#Author: J.M. Montañana 2018
#This compiles and executes the java code which collects the answers from data base and parse them

if [ -e demo_phantom ]; then
	rm -fr demo_phantom;
fi;
mkdir demo_phantom;

######################## COMPILATION
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. get_token.java ConsoleColors.java;
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. verify_token.java ConsoleColors.java;
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. repo_put.java 

javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. repo_get_file.java 

mv *class demo_phantom;

###################### TESTING THE CLASSES

java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:.  demo_phantom/get_token "montana@abc.com" "new" "localhost" "8000";

java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:.  demo_phantom/verify_token  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjIwNjg2MTEsImV4cCI6MTUyNDY2MDYxMX0.IjXYKMQFfqU-J8O-tlicyCEr_S9q3kvJ5tusPJCpM2s" "localhost" "8000";

java demo_phantom/repo_put  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjIwNjg2MTEsImV4cCI6MTUyNDY2MDYxMX0.IjXYKMQFfqU-J8O-tlicyCEr_S9q3kvJ5tusPJCpM2s" "localhost" "8000" "new.h" "otherpath" "/home/jmontana/repository/web/example.h" "/home/jmontana/repository/web/exampleh.json";

java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:.  demo_phantom/repo_get_file "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjIwNjg2MTEsImV4cCI6MTUyNDY2MDYxMX0.IjXYKMQFfqU-J8O-tlicyCEr_S9q3kvJ5tusPJCpM2s" "localhost" "8000";



