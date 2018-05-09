# Accessing the PHANTOM REPOSITORY server from the command line by using CURL

> PHANTOM REPOSITORY server interface between different PHANTOM tools, storing files and the metadata related to them. 


## 1.- Introduction
The purpose of the examples in this folder is to facilitate a low-level access to the Repository, both to upload Files and Metadata and to access the information stored there.

The examples here also aim to serve as an example of the authentication and authorization process based on tokens.

<p align="center">
<a href="https://github.com/PHANTOM-Platform/Repository/blob/master/api_bash_scripts/example.png">
<img src="https://github.com/PHANTOM-Platform/Repository/blob/master/api_bash_scripts/example.png" align="middle" width="70%" height="70%" title="Schema" alt="Example of Folders and Json files at the Repository">
</a> </p>


## 2.- List and description the USERS' commands with CURL

Here is shown the different available scripts.
The parameters are filled with some values such the access path to the REPOSITORY as localhost:8000.

Please, replace the values of the parameters for the appropriate values in your case.

A video demonstration of this scripts is available at [YOUTUBE CURL DEMO][video_curl].

####   GET A NEW TOKEN FOR A REGISTERED USER  

```bash
curl -s -H "Content-Type: text/plain" -XGET http://localhost:8000/login?email="montana@abc.com"\&pw="new" --output token.txt;
```

####   TEST IF A TOKEN IS VALID OR NOT, this is useful when we do not know if the token expired   

```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -XGET localhost:8000/verifytoken;
```

####   UPLOADING A FILE 
 
```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web/example.h" -F "UploadJSON=@../web/exampleh.json" http://localhost:8000/upload?DestFileName=main.h\&'Path=mypath/';
```

Example of json file: exampleh.json

```javascript
{
  "project": "phantom_tools_on_HPC",
  "source": "user",
  "data_type":"Usercase",
  "name":"HPC",
  "content":"src_file"
}
```

NOTICE: The 'project' and the 'source' are defined in the json file. We provided them in this way instead as a parameter because these fields should remain for a tool working in a project.


####    DOWNLOADING A FILE 

Command for downloading:

```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -H "Content-Type: multipart/form-data" -XGET http://localhost:8000/download?project=phantom_tools_on_HPC\&source=user\&filepath=mypath\&filename=main.c ;
```

Command for downloading into a new local FILE:

```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -H "Content-Type: multipart/form-data" -XGET http://localhost:8000/download?project=phantom_tools_on_HPC\&source=user\&filepath=mypath\&filename=main.c --output main.c ;
```

### LIST OF FILES IN A FOLDER (PROJECT + SOURCE(optional) + FILEPATH (optional))

The field project is MANDATORY, but the parameters source and filepath are optional

```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -H "Content-Type: multipart/form-data" -XGET http://localhost:8000/downloadlist?project=phantom_tools_on_HPC\&source=user\&filepath=mypath ;
```


### DOWNLOAD INTO A SINGLE ZIP ALL THE FILES IN A FOLDER (PROJECT + SOURCE(optional) + FILEPATH (optional))

The field project is MANDATORY, but the parameters source and filepath are optional

```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -H "Content-Type: multipart/form-data" -XGET http://localhost:8000/downloadzip?project=phantom_tools_on_HPC\&source=user\&filepath=mypath  --output demo.zip;
```

other example downloading the full project is:


```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -H "Content-Type: multipart/form-data" -XGET http://localhost:8000/downloadzip?project=phantom_tools_on_HPC --output demo2.zip;
```



####  DOWNLOADING METADATA

Command for downloading METADATA for a path and a filename:

```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -XGET http://localhost:8000/query_metadata?project=phantom_tools_on_HPC\&source=user\&Path=mypath%2F\&filename=main.c; 
```

Command for downloading METADATA for files in a path:

```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -XGET http://localhost:8000/query_metadata?project=phantom_tools_on_HPC\&source=user\&Path=mypath%2F ;
```
  

####   DELETING A FILE 
 
```bash
your_string_token=`cat token.txt;`;
curl -s -H "Authorization: OAuth ${your_string_token}" -H "Content-Type: multipart/form-data" -XPOST  http://localhost:8000/delete_metadata?project=demo\&source=user\&DestFileName=main.h\&'Path=mypath/';
```


## 3.- List and description the ADMIN's commands with CURL

Here is shown the different available scripts.
The parameters are filled with some values such the access path to the REPOSITORY as localhost:8000.

Please, replace the values of the parameters for the appropriate values in your case.


####  CHECK if the Repository server is running   

```bash
curl http://localhost:8000;
```

#### CHECK if Elasticsearch is running  

```bash
curl -s http://localhost:8000/verify_es_connection;
```

####  DELETE DATABASE   


Commands for deleting ALL the uploaded files and drop the Metadata stored in the database. 
Please, keep the request of confirmation:

```bash
read -p $'Do you wish to \033[1;37mDELETE\033[1;34m the Repository \033[1;37mDB\033[1;34m? (y/n)' confirm; echo -ne "${NO_COLOUR}";
if [[ ! ${confirm} = "" ]]; then
if [ ${confirm} == 'y' ] || [ ${confirm} == 'Y' ];then
curl -s -XGET http://localhost:8000/drop_db ; 
fi;
fi;
```

####  CREATE A NEW DATABASE   

This command prepares the system for running the users' scripts described below.
This command creates the required structure in the database for storing the Metadata:

```bash
curl -s -XGET http://localhost:8000/new_db;
```

#### REGISTER A NEW USER
This command registers a new user and its password:


```bash
curl -s -H "Content-Type: application/json" -XPOST http://localhost:8000/signup?email="montana@abc.com"\&pw="new";
```

####  REQUEST FLUSH UPDATES IN THE DATABASE

```bash
curl -s -XGET http://localhost:8000/_flush > /dev/null;
```

## Acknowledgment
This project is realized through [PHANTOM][phantom]. 
The PHANTOM project receives funding under the European Union's Horizon 2020 Research and Innovation Programme under grant agreement number 688146.


## Contributing
Find a bug? Have a feature request?
Please [create](https://github.com/jmmontanana/phantom_repository/issues) an issue.


## Main Contributors

**Montanana, Jose Miguel, HLRS**
+ [github/jmmontanana](https://github.com/jmmontanana)

**Cheptsov, Alexey, HLRS**
+ [github/cheptsov](https://github.com/alexey-cheptsov)



## Release History
| Date        | Version | Comment          |
| ----------- | ------- | ---------------- |
| 2018-03-22  | 1.0     | First prototype  |

## License
Copyright (C) 2018 University of Stuttgart

[Apache License v2](LICENSE).


[video_curl]: https://youtu.be/3W8a3HV-30g
[video_scripts]: https://youtu.be/-mqxA1l2K7A
[api_bash_scripts]: https://github.com/PHANTOM-Platform/Repository/tree/master/api_bash_scripts
[api_command_line]: https://github.com/PHANTOM-Platform/Repository/tree/master/api_command_line
[api_java]: https://github.com/PHANTOM-Platform/Repository/tree/master/api_java
[phantom]: http://www.phantom-project.org 
