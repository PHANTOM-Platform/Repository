# Scripts for accessing the PHANTOM REPOSITORY server

> PHANTOM REPOSITORY server interface between different PHANTOM tools, storing files and the metadata related to them. 

## 1.- Introduction
The purpose of the scripts in this folder is to facilitate the use of the Repository, both to upload Files and Metadata and to access the information stored there.

These scripts also aim to serve as an example of the authentication and authorization process based on tokens.

## 2.- List and description the USERS' scripts

Here is shown the different available scripts.
The parameters are filled with some values such the access path to the REPOSITORY as localhost:8000.

Please, replace the values of the parameters for the appropriate values in your case.

A video demonstration of this scripts is available at [YOUTUBE Scripts DEMO][video_scripts].



####   SCRIPT FOR THE GENERATION OF A NEW AUTHORIZATION TOKEN 
This script takes as authentication inputs the user_id and the user_password and generates an authorization token with a limited life.
As the default value, the generated tokens expire after 1 month.

```bash
bash get_token.sh -e bob@example.com -pw 1234 -s localhost -port 8000 ;
```


####  SCRIPT FOR TEST IF A TOKEN HAS EXPIRED ITS TIMELIFE 

This script takes a token and returns if it has expired or not, this script does NOT provide any other information such which user generated it.

It is useful only when we don't know if the token has expired.
 
```bash
bash get_token.sh verify_token.sh -t 141r2342135412351.321351235 -s localhost -port 8000 ;
```

####   SCRIPT FOR UPLOADING A FILE AND ITS METADATA

This script takes as inputs the token and the path and filename of the file and returns the FILE in that folder.
 
```bash
bash repo_put.sh -t 141r2342135412351.321351235 -sfp "../web/example.h" -sjp "../web/exampleh.json" -df "mypath/" -dp "main.h" -s localhost -port 8000 ;
```
Example of json file: exampleh.json

```javascript
{
  "data_type":"Usercase",
  "app":"HPC",
  "content":"src_file"
}
```

#### SCRIPT FOR DOWNLOADING A FILE OR METADATA 

This script takes as inputs the token and the path and filename of the file and returns the METADATA of that SINGLE FILE in that folder.

 
```bash
bash repo_get_file.sh -t 141r2342135412351.321351235 -path "mypath/" -file "main.h" -s localhost -port 8000 ;
```

Alternativelly, we can query for the METADATA for ALL THE FILES IN THE SAME FOLDER with:
 
```bash
bash repo_get_file.sh -t 141r2342135412351.321351235 -path "mypath/" -s localhost -port 8000 ;
```


####   SCRIPT FOR DELETING A FILE AND ITS METADATA

This script takes as inputs the token and the path and filename of the file and removes the FILE in that folder and its metadata.
 
```bash
bash repo_delete.sh -t 141r2342135412351.321351235 -df "mypath/" -dp "main.h" -s localhost -port 8000 ;
```

## 3.- List and description the ADMIN's scripts

Here is shown the different available scripts.
The parameters are filled with some values such the access path to the REPOSITORY as localhost:8000.

Please, replace the values of the parameters for the appropriate values in your case.


####   SCRIPT FOR DELETE DATABASE
Script for deleting ALL the uploaded files and drop the Metadata stored in the database. It requires confirmation:

```bash
bash delete_db.sh -s localhost -port 8000 ;
```

####   SCRIPT FOR THE CREATION OF A NEW DATABASE
This script prepares the system for running the users' scripts described below.
This script creates the required structure at the database for storing the Metadata:

```bash
bash create_db.sh -s localhost -port 8000 ;
```

####  SCRIPT FOR REGISTERING A NEW USER 
This script registers a new user and its password:

```bash
bash register_user.sh -e bob@example.com -pw 1234 -s localhost -port 8000 ;
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
