# Accessing to the PHANTOM REPOSITORY server from the command line by using CURL

> PHANTOM REPOSITORY server interface between different PHANTOM tools, storing files and the metadata related to them. 


## Introduction
The purpose of the examples in this folder is to facilitate a low-level access to the Repository, both to upload files and metadata, and to access the information stored there.

The examples here also aim to serve as an example of the authentication and authorization process based on tokens.


## List and description the commands

Here is shown how to access to the different functionalities from the command line.
The parameters are filled with some values such the access path to the REPOSITORY as localhost:8000.

Please, replace the values of the parameters for the appropiate values in your case.



####  1. CHECK if Respository server is running   

```bash
verify_reponse ${server} ${repository_port};
```

# 2.    CHECK if Elasticsearch is running  

```bash
curl -s http://${server}:${repository_port}/verify_es_connection;
```	

# 3.    DELETE DATABASE   

```bash
read -p $'Do you wish to \033[1;37mDELETE\033[1;34m the Repository \033[1;37mDB\033[1;34m? (y/n)' confirm; echo -ne "${NO_COLOUR}";
if [[ ! ${confirm} = "" ]]; then
if [ ${confirm} == 'y' ] || [ ${confirm} == 'Y' ];then
curl -s -XGET http://${server}:${repository_port}/drop_db ; 
fi;
fi;
```

# 4.    CREATE A NEW DATABASE   


```bash
curl -s -XGET http://${server}:${repository_port}/new_db;

# 5.    REGISTER A NEW USER  

```bash
curl -s -H "Content-Type: application/json" -XPOST http://${server}:${repository_port}/signup?email="montana@abc.com"\&pw="new";
```


# 6.    GET A NEW TOKEN FOR A REGISTERED USER  

```bash
curl -s -H "Content-Type: text/plain" -XGET http://${server}:${repository_port}/login?email="montana@abc.com"\&pw="new" --output token.txt;
```

# 7. REQUEST FLUSH UPDATES IN THE DATABASE

```bash
curl -s -XGET ${server}:${repository_port}/_flush > /dev/null;
```

# 8.    TEST IF A TOKEN IS VALID OR NOT, this is useful when we not know if the token expired   

```bash
curl -s -H "Authorization: OAuth ${mytoken}" -XGET ${server}:${repository_port}/verifytoken;
```

# 9.    TEST ACCESS WITH A NOT VALID TOKEN, access must be rejected UNAUTHORIZED:401  
```bash
curl -s -H "Authorization: OAuth 12345678" -XGET ${server}:${repository_port}/verifytoken;
```

# 10.    TEST ACCESS WITHOUT A TOKEN, access must be rejected UNAUTHORIZED:401  


```bash
curl -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web/example.c" -F "UploadJSON=@../web/examplec.json" http://${server}:${repository_port}/upload?DestFileName=main.c\&'Path=mypath/';
```

# 11.    TEST OF UPLOADING A FILE WITH A NOT VALID TOKEN, access must be rejected UNAUTHORIZED:401   

```bash
curl -s -H "Authorization: OAuth 12345678" -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web/example.c" -F "UploadJSON=@../web/examplec.json" http://${server}:${repository_port}/upload?DestFileName=main.c\&'Path=mypath/';
```

# 12.    TEST OF UPLOADING A FILE WITH A NOT VALID TOKEN, access must be rejected UNAUTHORIZED:401    

```bash
curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web/example.c" -F "UploadJSON=@../web/examplec.json" http://${server}:${repository_port}/upload?DestFileName=main.c\&'Path=mypath/';
```

# 13.    TEST OF UPLOADING A FILE WITH A VALID TOKEN, access must be accepted 

```bash
curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XPOST -F "UploadFile=@../web/example.h" -F "UploadJSON=@../web/exampleh.json" http://${server}:${repository_port}/upload?DestFileName=main.h\&'Path=mypath/';
```	

# 14.    TEST OF DOWNLOADING A FILE WITH A VALID TOKEN, access must be accepted   

```bash
curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/download?filepath=mypath\&filename=main.c ;
```

# 15.    TEST OF DOWNLOADING A FILE WITH A VALID TOKEN into a FILE, access must be accepted    

```bash
curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/download?filepath=mypath\&filename=main.c --output main.c ;
```

# 16.    TEST OF DOWNLOADING METADATA WITH A VALID TOKEN for a path and a filename, access must be accepted  

```bash
curl -s -H "Authorization: OAuth ${mytoken}" -XGET http://${server}:${repository_port}/query_metadata?Path=mypath%2F\&filename=main.c; 
```

# 17.     TEST OF DOWNLOADING METADATA WITH A VALID TOKEN for files in a path, access must be accepted 

```bash
curl -s -H "Authorization: OAuth ${mytoken}" -XGET http://${server}:${repository_port}/query_metadata?Path=mypath%2F ;
```

# 18.     TEST OF DOWNLOADING METADATA WITH A VALID TOKEN and USER DEFINED QUERY  

```bash
curl -s -H "Authorization: OAuth ${mytoken}" -H "Content-Type: multipart/form-data" -XGET http://${server}:${repository_port}/es_query_metadata?QueryBody="\{\"query\":\{\"bool\":\{\"must\":\[\{\"match\":\{\"path\":\"mypath/\"\}\}\]\}\}\}";
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
