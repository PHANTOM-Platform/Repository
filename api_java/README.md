# Scripts for accessing the PHANTOM REPOSITORY server

> PHANTOM REPOSITORY server interface between different PHANTOM tools, storing files and the metadata related to them. 

## 1.- Introduction
The purpose of the JAVA files in this folder is to facilitate the use of the Repository, both to upload Files and Metadata and to access the information stored there.

These files also aim to serve as an example of the authentication and authorization process based on tokens.

<p align="center">
<a href="https://github.com/PHANTOM-Platform/Repository/blob/master/repo-domain.png">
<img src="https://github.com/PHANTOM-Platform/Repository/blob/master/repo-domain.png" align="middle" width="70%" height="70%" title="Schema" alt="Example of Folders and Json files at the Repository">
</a> </p>


## 2.- List and description the USERS' scripts

Here is shown the different available scripts.
The parameters are filled with some values such the access path to the REPOSITORY as localhost:8000.

Please, replace the values of the parameters for the appropriate values in your case.


####   SCRIPT FOR THE GENERATION OF A NEW AUTHORIZATION TOKEN 
This JAVA class takes as authentication inputs the user_id and the user_password and generates an authorization token with a limited life.
As the default value, the generated tokens expire after 1 month.

Example of use:

```bash
java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:.  demo_phantom/get_token "montana@abc.com" "new" "localhost" "8000";
```


####  SCRIPT FOR TEST IF A TOKEN HAS EXPIRED ITS TIMELIFE 

Example of use:
 
```bash
java -classpath org.json.jar:apache-httpcomponents-httpcore.jar:.  demo_phantom/verify_token  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjIwNjg2MTEsImV4cCI6MTUyNDY2MDYxMX0.IjXYKMQFfqU-J8O-tlicyCEr_S9q3kvJ5tusPJCpM2s" "localhost" "8000";
```

####   JAVA CLASS FOR UPLOADING A FILE AND ITS METADATA
 
Example of use:
 
```bash
java demo_phantom/repo_put  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb250YW5hQGFiYy5jb20iLCJpYXQiOjE1MjIwNjg2MTEsImV4cCI6MTUyNDY2MDYxMX0.IjXYKMQFfqU-J8O-tlicyCEr_S9q3kvJ5tusPJCpM2s" "localhost" "8000" "new.h" "otherpath" "/home/jmontana/repository/web/example.h" "/home/jmontana/repository/web/exampleh.json";
```

 Example of json file: exampleh.json

```javascript
{
  "project": "phantom_tools_on_HPC",
  "source": "user",
  "type":"Usercase",
  "name":"HPC",
  "content":"src_file"
}
```

## Examples of running the scripts 

Testing the scripts on a Repository server running on localhost:8000:

```bash
bash demo_java_localhost.sh 
```


Testing the scripts on a Repository server running on the public server at HLRS http://141.58.0.8:2777:


```bash
bash demo_java_hlrs_server.sh
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
| 2018-03-26  | 1.0     | First prototype  |

## License
Copyright (C) 2018 University of Stuttgart

[Apache License v2](LICENSE).

[video_curl]: https://youtu.be/3W8a3HV-30g
[video_scripts]: https://youtu.be/-mqxA1l2K7A
[demo_scripts]: https://github.com/PHANTOM-Platform/Repository/tree/master/demo_scripts
[demo_curl]: https://github.com/PHANTOM-Platform/Repository/tree/master/demo_curl 
[phantom]: http://www.phantom-project.org 
