 
#TEST OF WEBSOCKETS FROM THE APP MANAGER

#start the servers, in case they are not running yet
	bash start-es.sh;
	bash start-appmanager.sh;

#in case the DB was not created or any user not registered, then run:
	bash ../repo_api_command_line/demo_admin_repo_curl.sh

#run a client, which will suscribe to some entries at the Projects (tasks), Devices, and app Executions TABLES.
	bash test_appman_ws_suscriber_repository.sh;

#I suggest to run the next strings on a different terminal, or computer, to make it clear what is the feedback to the suscribed client
#update entries in the DB to see if we get the notifications:
	bash test_repo_update_db.sh;

