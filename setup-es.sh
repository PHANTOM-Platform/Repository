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
	
	if [ ! -e ${TMP_DIR} ]; then
		mkdir ${TMP_DIR};
	fi;
	if [ ! -e ${DIST_DIR} ]; then
		mkdir ${DIST_DIR};
	fi;

# SOFTWARE
	ELASTICSEARCH_VERSION="2.4.0"; #we NEED the version 2.4.0 instead of the last 2.4.6 because we want to use WebSockets;
	#DON'T USE YET ELASTICSEARCH_VERSION="5.5.1" it needs that the code/syntax of the services be modified
	ELASTICSEARCH="elasticsearch-${ELASTICSEARCH_VERSION}";
 
# REQUIRED SOFTWARE CHECKS
	echo "Checking for required software:";  
	command -v wget >/dev/null 2>&1 || { echo " wget  : Not installed. Aborting." >&2; exit 1; }
	echo -e "Done.\n"

# DOWNLOADING AND INSTALLING  
	echo "Installing:";
	cd ${TMP_DIR};
	if [ ! -f "${ELASTICSEARCH}.tar.gz" ] ; then
		wget https://download.elasticsearch.org/elasticsearch/elasticsearch/${ELASTICSEARCH}.tar.gz;
	fi;
	if [ ! -d "${DIST_DIR}/${ELASTICSEARCH}" ] ; then
		tar -xf ${ELASTICSEARCH}.tar.gz;
		mv ${ELASTICSEARCH} ${DIST_DIR}/elasticsearch;
	fi ;
	echo -e "Done.\n"; 
