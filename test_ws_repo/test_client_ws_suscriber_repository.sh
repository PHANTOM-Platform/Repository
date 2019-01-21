#!/bin/bash
#Author: J.M. Montañana 2018

#1-first we compile the Java client files
	if [ -e repo_websocket ]; then
		rm -fr repo_websocket;
	fi;
	if [ ! -d repo_websocket ]; then
		mkdir repo_websocket;
	fi;
	javac -classpath org.json.jar:java_websocket.jar:. ws_susc_repository.java -d .;

#x- We suppose the server is running. 
	# netstat -plnt ; # we cound test which ports are listening 

#2-Run a client 'alice' to be suscribed, on second terminal
	java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:java_websocket.jar:. repo_websocket/ws_susc_repository;
