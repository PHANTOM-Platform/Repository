#!/bin/bash
#Author: J M Montanana
# This scripts :
#  * generates the manager app nodejs
#  * creates a new DB and register an user
#  * registers and query an example of a project with few tasks
#  * updates some fields in the he previous project registered, and adds also some new field
#
#  If user is suscribed to a project, then the user will get a copy of the uploading json
#

#global variables:
mytoken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjQwMzg1NTQsImV4cCI6MTUyNjYzMDU1NH0.1dB8D3E3_L1b6BlRWyTc78H4QvwlJ9mtVt0wNY5V-Uo
repository_port=8000
server=localhost

echo -e "\n\n******************\nREGISTER PROJECT 1" 

curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web/example.c" -F "UploadJSON=@../web/example_pt.json" http://${server}:${repository_port}/upload?DestFileName=main.c\&Path=mypath/

echo -e "\n\n";
# NOTICE: When updating the new fields are added to the existing fields
# NOTICE: BUT, if you update a field which contains one or multiple values, it will replace the value/s of that field, the value/s of a field are not merged on an update!!

