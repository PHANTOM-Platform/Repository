#!/bin/bash
# GLOBAL VARIABLES
        SERVER_DIR=~/phantom_servers/;
        BASE_DIR=`dirname $0`;
        TMP_DIR=${SERVER_DIR}/tmp;
        DIST_DIR=${SERVER_DIR}/dist;
# STOPPING SERVICES
	echo " > node";
	if [ -f "${TMP_DIR}/repo.pid" ]; then
	    PID=$(cat ${TMP_DIR}/repo.pid);
	    kill ${PID};
	    rm -f ${TMP_DIR}/repo.pid; 
	else
	    echo "Couldn't find PID associated with REPOSITORY node process.";
	    echo "Please kill the service manually.";
	fi;
	echo -e "Done.\n";

