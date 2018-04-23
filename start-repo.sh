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
	SERVER_DIR=~/phantom_servers/;
        BASE_DIR=`dirname $0`;
	cd ${BASE_DIR};
	BASE_DIR=`pwd`;
        TMP_DIR=${SERVER_DIR}/tmp;
        DIST_DIR=${SERVER_DIR}/dist;
	repo_port=8000;
	cd server_code;
	bash ../stop-repo.sh
	${DIST_DIR}/nodejs/bin/node repo_app.js &
	pid=$!;
	echo "pid if the server is ${pid}";
	echo ${pid} > ${TMP_DIR}/repo.pid;
	sleep 1;

	let "j=0";
	HTTP_STATUS=$(curl -s -w %{http_code} http://localhost:${repo_port});
	while [[ ${HTTP_STATUS} != *"200"* ]] && [ ${j} -lt 30 ] ; do
		echo -n "$j. "; let "j += 1 ";  sleep 1;
		HTTP_STATUS=$(curl -s -w %{http_code} http://localhost:${repo_port});
	done;
	if [ ${j} -ge 30 ]; then
		echo "[ERROR]: Repository doesn't started.";
		exit;
	fi;
	echo ;
	curl http://localhost:${repo_port};
	echo -e "\n\n";

