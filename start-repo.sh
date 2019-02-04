#!/bin/bash
#npm install express --save
#npm install cors --save
#npm install body-parser --save
#npm install jwt-simple --save
#npm install moment --save
#npm install express-fileupload --save
#npm install https --save
#npm install http --save

# GLOBAL VARIABLES
	app=`basename $0`;
	SERVER_DIR=~/phantom_servers;
	BASE_DIR=`dirname $0`;
	TMP_DIR=${SERVER_DIR}/tmp;
	DIST_DIR=${SERVER_DIR}/dist;
	repo_port=8000;
	cd ${BASE_DIR};
	cd server_code;
# CHECK INSTALLATION 
	echo "Checking ... > elasticsearch";
	ES_HOME=${DIST_DIR}/elasticsearch;
	ELASTICSEARCH_BIN=${ES_HOME}/bin/elasticsearch; 
	elasticsearch_port="9400";
	command -v ${ELASTICSEARCH_BIN} >/dev/null 2>&1 || { echo " elasticsearch : Not installed. Aborting." >&2; exit 1; }

	RESULT=$(netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ":'${elasticsearch_port}'"');
	if [[ -z "${RESULT// }" ]] ; then
		nohup ${ELASTICSEARCH_BIN} >/dev/null 2>&1 &
		echo $! > ${TMP_DIR}/elasticsearch.pid ;
	else
		echo -e " > port ${elasticsearch_port} already bound by another process. We assume that Elasticsearch is already running.\n";
	fi;
	let "j=0";
	HTTP_STATUS=$(curl -s -w %{http_code} http://localhost:${elasticsearch_port});

	while [[ ${HTTP_STATUS} != *"200"* ]] && [ ${j} -lt 30 ] ; do
		echo -n "$j. "; let "j += 1 ";  sleep 1;
		HTTP_STATUS=$(curl -s -w %{http_code} http://localhost:${elasticsearch_port});
	done;
	if [ ${j} -ge 30 ]; then 
		echo -e "[ERROR]: ElasticSearch doesn't started.\n"
		exit;
	fi;
	echo ;
	if [[ ${HTTP_STATUS} != *"200"* ]]; then
		echo -e "> Elasticsearch is unreachable. Aborting.\n"
		exit 1;
	fi;
	echo -e "Done. Elasticsearch started successfully on port ${elasticsearch_port}.\n";
	
# START A NEW INSTACE OF THE REPOSITORY
	echo "Starting the Repository server ...";
	NODE_DIR=${DIST_DIR}/nodejs/bin;
	NODE_BIN=${NODE_DIR}/node;
	NPM_BIN=${DIST_DIR}/nodejs/bin/npm;
	export PATH=${NODE_DIR}:${PATH};

	command -v ${NODE_BIN} >/dev/null 2>&1 || { echo " node : Not installed. Aborting.\n" >&2; exit 1; }
	command -v ${NPM_BIN} >/dev/null 2>&1 || { echo " npm : Not installed. Aborting.\n" >&2; exit 1; }
	if [ ! -e node_modules ]; then
		ln -s ~/phantom_servers/node_modules node_modules;
	fi;

	RESULT=$(netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ":'${repo_port}'"');
	if [[ -z "${RESULT// }" ]] ; then
#		nohup ${NODE_BIN} repo_app.js >/dev/null 2>&1 &
		${NODE_BIN} repo_app.js &	

	pid=$!;
		echo "pid of the server is ${pid}";
		echo ${pid} > ${TMP_DIR}/repo.pid; 
	else
		echo -e " > port ${repo_port} already bound by another process. We assume that Repository is already running.\n";
	fi;
	sleep 1;
# CHECK IF THE REPOSITORY IS RUNNING
	let "j=0";
	HTTP_STATUS=$(curl -s -w %{http_code} http://localhost:${repo_port});
	while [[ ${HTTP_STATUS} != *"200"* ]] && [ ${j} -lt 30 ] ; do
		echo -n "$j. "; let "j += 1 ";  sleep 1;
		HTTP_STATUS=$(curl -s -w %{http_code} http://localhost:${repo_port});
	done;
	if [ ${j} -ge 30 ]; then
		echo "[ERROR]: Repository Server doesn't started.";
		exit;
	fi;
	echo ;
	curl -s http://localhost:${repo_port};
	echo -e "\n\n";

	echo -e "Done. Server is listening on port ${repo_port}.\n";
