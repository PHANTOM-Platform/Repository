#!/bin/bash
#  Copyright (C) 2016 University of Stuttgart
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
 
# GLOBAL VARIABLES
	BASE_DIR=`pwd`;
	TMP_DIR=${BASE_DIR}/tmp;
	DIST_DIR=${BASE_DIR}/dist;

# CHECK INSTALLATION
	mkdir -p ${TMP_DIR}
	echo "Checking ..."
	ES_HOME=${DIST_DIR}/elasticsearch

	#ES_MAX_MEM=1g
	#ES_MIN_MEM=256m
	ES_HEAP_SIZE=256m
	CONFIG_FILE=$ES_HOME/config/elasticsearch.yml

	ELASTICSEARCH_BIN=${ES_HOME}/bin/elasticsearch
	if [ ! -d ${ES_HOME}/config ]; then
		mkdir ${ES_HOME}/config
	fi;

	if [ ! -d ${ES_HOME}/data ]; then
			mkdir ${ES_HOME}/data
	fi;

	cp ${BASE_DIR}/elasticsearch.yml ${ES_HOME}/config/elasticsearch.yml;
	elasticsearch_port="9400"; 

	command -v ${ELASTICSEARCH_BIN} >/dev/null 2>&1 || { echo " elasticsearch : Not installed. Aborting." >&2; exit 1; }

	RESULT=$(netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ":${elasticsearch_port}"')
	if [[ -z "${RESULT}" ]] ; then
		nohup ${ELASTICSEARCH_BIN} >/dev/null 2>&1 &
		echo $! > ${TMP_DIR}/elasticsearch.pid ;
	else
		echo -e "Port ${elasticsearch_port} already bound by another process. We assume that Elasticsearch is already running.\n";
	fi;

	let "j=0";
	HTTP_STATUS=$(curl -s -w %{http_code} localhost:${elasticsearch_port});

	while [[ ${HTTP_STATUS} != *"200"* ]] && [ ${j} -lt 30 ] ; do
		echo -n "$j. "; let "j += 1 ";  sleep 1;
		HTTP_STATUS=$(curl -s -w %{http_code} localhost:${elasticsearch_port});
	done;
	if [ ${j} -ge 30 ]; then 
		echo -e "[ERROR]: ElasticSearch doesn't started.\n";
		exit;
	fi;
	
	if [[ ${HTTP_STATUS} != *"200"* ]]; then
		echo "> Elasticsearch is unreachable. Aborting."
		exit 1;
	fi;
	echo -n "Done. Elasticsearch started successfully on port ${elasticsearch_port}.\n";
