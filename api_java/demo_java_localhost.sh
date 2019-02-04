#!/bin/bash
#Author: J.M. Montañana 2018
#This compiles and executes the java code which 
# 1- otains a token for a particualr user+password
# 2- verifies the token, this step is OPTINAL, only for debugging purposes
# 3- upload a file
# 4- download the file
# 5- download a zip file containing the uploaded file, and any other file which could be in the project (not expected any other because we uploaded only one file)

app=`basename $0`;
cd `dirname $0`;

if [ -e zipfile.zip ]; then
	rm zipfile.zip;
fi;
if [ -e phantom_tools_on_HPC ]; then
	rm -fr phantom_tools_on_HPC;
fi;
if [ -e demo_phantom ]; then
	rm -fr demo_phantom;
fi;
mkdir demo_phantom;

######################## COMPILATION
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. get_token.java ConsoleColors.java;
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. verify_token.java ConsoleColors.java;
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. repo_put.java;

javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. repo_get_file.java;
javac -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. repo_get_zip.java;

mv *class demo_phantom/;
user="montana@abc.com";
pw="new";

###################### TESTING THE CLASSES
echo "REQUESTING A NEW TOKEN ....";
token=$(java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. demo_phantom/get_token "montana@abc.com" "new" "localhost" "8000");
echo "token is: "+${token};

echo "VERIFIYING THE TOKEN ...";
java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. demo_phantom/verify_token ${token} "localhost" "8000";

echo "UPLOADING A FILE ... project=demo_hpc source=user path=mypath file=new.h (project and source defined in the json file)";
echo "Project and Source are defined in the json file !!!";
java demo_phantom/repo_put ${token} "localhost" "8000" "phantom_tools_on_HPC" "user" "otherpath" "new.h" "example.h" "exampleh.json";

exit
echo "DOWNLOADING A FILE... project=demo_hpc source=user path=mypath file=new.h";
java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. demo_phantom/repo_get_file ${token} "localhost" "8000" "phantom_tools_on_HPC" "user" "otherpath" "new.h";

echo "DOWNLOADING A ZIP-FILE... project=demo_hpc source=user path=mypath file=new.h";
java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:. demo_phantom/repo_get_zip ${token} "localhost" "8000" "phantom_tools_on_HPC" "user" "otherpath";

unzip zipfile.zip;
cat phantom_tools_on_HPC/user/otherpath/new.h;
