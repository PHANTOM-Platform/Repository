#!/bin/bash
#echo "\#\!/bin/bash" > genera_app.sh; for i in *.js; do echo "cat $i >> repo_app.js" >> genera_app.sh;  done; echo "" >> genera_app.sh;

cat 01-head-repo.js > repo_app.js
cat 03-functions-string.js >> repo_app.js
cat 04-functions-json.js >> repo_app.js
cat 05-functions-es.js >> repo_app.js
cat 06-functions-app.js >> repo_app.js
cat 07-support-tokens.js >> repo_app.js
cat 08-functions-files.js >> repo_app.js
cat 10-server.js >> repo_app.js
cat 11-server-http-putpostget.js >> repo_app.js
cat 12-server-http-putpostget-token.js >> repo_app.js
cat 20-new-entry.js >> repo_app.js
cat 22-verify-es-connection.js >> repo_app.js
cat 23-create-drop-flush-db.js >> repo_app.js
cat 24-query-metadata.js >> repo_app.js
cat 25-upload-download-drop-files.js >> repo_app.js
cat 26-singup-login-update-user.js >> repo_app.js
cat 40-start-server.js >> repo_app.js

