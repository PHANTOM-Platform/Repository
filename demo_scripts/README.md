# Scripts for accessing to the PHANTOM REPOSITORY server

> PHANTOM REPOSITORY server interface between different PHANTOM tools, storing files and the metadata related to them. 


## Introduction
The purpose of the scripts in this folder is to facilitate the use of the Repository, both to upload files and metadata, and to access the information stored there.

These scripts also aim to serve as an example of the authentication and authorization process based on tokens.


## List and description the scripts

Here is shown the differente available scripts.
The parameters are filled with some values such the access path to the REPOSITORY as localhost:8000.

Please, replace the values of the parameters for the appropiate values in your case.



#### SCRIPT FOR DELETE DATABASE
Script for deleting ALL the uploaded files and drop the Metadata stored in the database. It requires confirmation:

```bash
bash delete_db.sh -s localhost -port 8000 ;
```

#### SCRIPT FOR THE CREATION OF A NEW DATABASE
This script prepares the system for running the other scripts described below.
This script creates the required structure at the database for storing the Metadata:

```bash
bash create_db.sh -s localhost -port 8000 ;
```

#### SCRIPT FOR REGISTERING A NEW USER 
This script registers a new user and its password:

```bash
bash register_user.sh -e bob@example.com -pw 1234 -s localhost -port 8000 ;
```


#### SCRIPT FOR THE GENERATION OF A NEW AUTHORIZATION TOKEN 
This script takes as autentication inputs the user_id and the user_password, and generates an authorization token with a limited life.
As default value, the generated tokens experire after 1 month.

```bash
bash get_token.sh -e bob@example.com -pw 1234 -s localhost -port 8000 ;
```


#### SCRIPT FOR TEST IF A TOKEN HAS EXPIRED ITS TIMELIFE 

This script takes a token and returns if it has expired or not, this script does NOT provide any other information such which user genereated it.

It is useful only when we don't know if the token has expired.
 
```bash
bash get_token.sh verify_token.sh -t 141r2342135412351.321351235 -s localhost -port 8000 ;
```

#### SCRIPT FOR UPLOADING A FILE AND ITS METADATA

This script takes a token and returns if it has expired or not, this script does NOT provide any other information such which user genereated it.

It is useful only when we don't know if the token has expired.
 
```bash
bash get_token.sh verify_token.sh -t 141r2342135412351.321351235 -s localhost -port 8000 ;
```


#### SCRIPT FOR DOWNLOADING A FILE  

This script takes a token and returns if it has expired or not, this script does NOT provide any other information such which user genereated it.

It is useful only when we don't know if the token has expired.
 
```bash
bash repo_put.sh -t ${newtoken} -sfp "../web/example.h" -sjp "../web/exampleh.json" -dp "main.h" -df "mypath/" -s localhost -port 8000 ;
```

#### SCRIPT FOR DOWNLOADING METADATA OF A SINGLE FILE 

This script takes a token and returns if it has expired or not, this script does NOT provide any other information such which user genereated it.

It is useful only when we don't know if the token has expired.
 
```bash
bash repo_get_file.sh -t ${newtoken} -file "main.h" -path "mypath/" -s localhost -port 8000 ;
```


#### SCRIPT FOR DOWNLOADING METADATA OF THE FILES IN A SINGLE FOLDER 

This script takes a token and returns if it has expired or not, this script does NOT provide any other information such which user genereated it.

It is useful only when we don't know if the token has expired.
 
```bash
bash repo_get_file.sh -t ${newtoken} -path "mypath/" -s localhost -port 8000 ;
```


## Acknowledgment
This project is realized through [PHANTOM][phantom]. 
The PHANTOM project receives funding under the European Union's Horizon 2020 Research and Innovation Programme under grant agreement number 688146.


## Contributing
Find a bug? Have a feature request?
Please [create](https://github.com/jmmontanana/phantom_repository/issues) an issue.


## Main Contributors

**Montanana, Jose Miguel, HLRS**
+ [github/hpcfapix](https://github.com/jmmontanana)

**Cheptsov, Alexey, HLRS**
+ [github/hpcfapix](https://github.com/alexey-cheptsov)



## Release History
| Date        | Version | Comment          |
| ----------- | ------- | ---------------- |
| 2018-03-22  | 1.0     | First prototype  |

## License
Copyright (C) 2018 University of Stuttgart

[Apache License v2](LICENSE).


[demo_scripts]: https://github.com/PHANTOM-Platform/Repository/tree/master/demo_scripts
[demo_curl]: https://github.com/PHANTOM-Platform/Repository/tree/master/demo_curl 
[phantom]: http://www.phantom-project.org 
