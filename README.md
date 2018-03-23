# PHANTOM REPOSITORY server

> PHANTOM REPOSITORY server interface between different PHANTOM tools, storing files and the metadata related to them. 


## 1.- Introduction
The PHANTOM REPOSITORY server is composed of two components: a web server and a data storage system. 
The web server provides various functionalities for data query and data analysis via RESTful APIs with documents in JSON format. 
The server's URL is "localhost:8000" by default.


## 2.- Prerequisites
The server is implemented using Node.js, and connects to Elasticsearch to store and access Metadata. 
Before you start installing the required components, please note that the installation and setup steps mentioned below assume that you are running a current Linux as the operating system. 
The installation was tested with Ubuntu 16.04 LTS.
Before you can proceed, please clone the repository:

```bash
git clone https://github.com/PHANTOM-Platform/Repository.git
```


### Dependencies
This project requires the following dependencies to be installed:

| Component         | Homepage                                           | Version   |
|------------------ |--------------------------------------------------  |---------  |
| Elasticsearch     | https://www.elastic.co/products/elasticsearch      | = 2.4.X  |
| Node.js           | https://apr.apache.org/                            | >= 4.5    |
| npm               | https://www.npmjs.com/                             | >= 1.3.6  |


#### Installation of npm
When using Ubuntu, for example, please install npm as follows:

```bash
sudo apt-get install npm
```

Alternatively, you can install it using your operating system's software installer.


## Installation of other components
This section assumes that you've successfully installed all required dependencies as described in the previous paragraphs.  

To ease the installation and preparation process, there is one shell script provided, which downloads and installs all the dependencies and packages. 
Installs Nodejs 9.4.0. Please choose the appropriate shell scripts depending on your Operating System :


Shell script for 32bits:

```bash
bash setup-server-32.sh
```

or the Shell script for 64bits:

```bash
bash setup-server-64.sh
```

The default port is 8000, which can be modified at the file app.js.


The PHANTOM Repository relies on the Elasticsearch installed by the PHANTOM Monitoring Server.
In case, that you wish to test the PHANTOM Repository without running or installing the PHANTOM Monitoring Server THEN you will need to set up an installation ElasticSearch.
For such case we provide two additional scripts:

```bash
bash setup-es.sh
```

and 

```bash
bash start-es.sh
```


## 4.- Start/Stop the server


Start a PHANTOM REPOSITORY by executing, it is important to not do as root:
For security reasons, the services may not start if they are requested from root.

```bash
bash start-repo.sh
```

You can use the following command to verify if the database and the server are running

Test of the Nodejs Front-end running service:

```bash
curl localhost:8000
```

Test if the Front-end has access to the Elasticsearch DataBase Server.

```bash
curl -s http://localhost:8000/verify_es_connection;
```

For more details on setup the server, please look into the examples of Admin-use at [DEMO_CURL][demo_curl] or [DEMO_SCRIPTS][demo_scripts].


After the usage, the server can be stopped by:
```bash
bash stop-repo.sh
```


## 5.- Configuration of USERS' accounts

After the installation, and before users can use the repository, it is needed to register the users.

The script setup-new-server.sh provides an automatic method for register multiple users.
In particular, the script registers the list of users_ids and passwords from the file list_of_users.ini.

```bash
bash setup-new-server.sh
```

NOTICE: For securoity reasons, users' accounts can be ONLY registered on the server. Requests from different IPs will be rejected.
        

## 6.- Example of use

The folders [DEMO_CURL][demo_curl] and [DEMO_SCRIPTS][demo_scripts] shows examples of using the PHANTOM REPOSITORY

Please access to those folders to get more details.


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


[demo_scripts]: https://github.com/PHANTOM-Platform/Repository/tree/master/demo_scripts
[demo_curl]: https://github.com/PHANTOM-Platform/Repository/tree/master/demo_curl 
[phantom]: http://www.phantom-project.org 
