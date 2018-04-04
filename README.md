# PHANTOM REPOSITORY server

> PHANTOM REPOSITORY server interface between different PHANTOM tools, storing files and the metadata related to them. 


## 1.- Introduction
The PHANTOM REPOSITORY server is composed of two components: a web server and a data storage system. 
The web server provides various functionalities for data query and data analysis via RESTful APIs with documents in JSON format. 
The server's URL is "http://localhost:8000" by default.


## 2.- Prerequisites
The server is implemented using Node.js, and connects to Elasticsearch to store and access Metadata. 
Before you start installing the required components, please note that the installation and setup steps mentioned below assume that you are running a current Linux as the operating system. 
The installation was tested with Ubuntu 16.04 LTS.
Before you can proceed, please clone the repository:

```bash
git clone https://github.com/PHANTOM-Platform/Repository.git;
```


### Dependencies
This project requires the following dependencies to be installed:

| Component         | Homepage                                           | Version   |
|------------------ |--------------------------------------------------  |---------  |
| Elasticsearch     | https://www.elastic.co/products/elasticsearch      | = 2.4.X   |
| Node.js           | https://apr.apache.org/                            | >= 4.5    |
| npm               | https://www.npmjs.com/                             | >= 1.3.6  |


#### Installation of npm
When using Ubuntu, for example, please install npm as follows:

```bash
sudo apt-get install npm;
```

Alternatively, you can install it using your operating system's software installer.


## Installation of other components
This section assumes that you've successfully installed all required dependencies as described in the previous paragraphs.

To ease the installation and preparation process, there is one shell script provided, which downloads and installs all the dependencies and packages. 
Installs Nodejs 9.4.0. Please choose the appropriate shell scripts depending on your Operating System:


Shell script for 32bits:

```bash
bash setup-server-32.sh;
```

or the Shell script for 64bits:

```bash
bash setup-server-64.sh;
```

The default port is 8000, which can be modified at the file app.js.


The PHANTOM Repository relies on the Elasticsearch running on the SAME server. It is expected that ES is installed by the PHANTOM Monitoring Server.
In case, that you wish to test the PHANTOM Repository without running or installing the PHANTOM Monitoring Server THEN you will need to set up an installation ElasticSearch.
For such case we provide two additional scripts:

```bash
bash setup-es.sh;
```

and 

```bash
bash start-es.sh;
```

Please take a look on the next suggested reference books, if you face difficulties on the setup of ElasticSearch-Database server:

* Item 1
* Item 2
  * Item 2a
  * Item 2b


## 4.- Start/Stop the server


Start a PHANTOM REPOSITORY by executing, it is important to not do as root:
For security reasons, the services may not start if they are requested from root.

```bash
bash start-repo.sh;
```

You can use the following command to verify if the database and the server are running

Test of the Nodejs Front-end running service:

```bash
curl http://localhost:8000;
```

Test if the Front-end has access to the Elasticsearch DataBase Server.

```bash
curl -s http://localhost:8000/verify_es_connection;
```

For more details on setup the server, please look into the examples of Admin-use at [DEMO_CURL][demo_curl] or [DEMO_SCRIPTS][demo_scripts].


After the usage, the server can be stopped by:
```bash
bash stop-repo.sh;
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

The folders [api_command_line][api_command_line] and [api_bash_scripts][api_bash_scripts] shows examples of using the PHANTOM REPOSITORY

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

[Elasticsearch in Action]: https://www.amazon.com/gp/product/1617291625/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=whatpixel-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1617291625&linkId=382a9e9ac4076cb805d54c6d2bda0a6d
[Elasticsearch Essentials]: https://www.amazon.com/gp/product/1784391018/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=whatpixel-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1784391018&linkId=7c3689613866114e08fcb8b1360d088c
[Elasticsearch Server]: https://www.amazon.com/gp/product/1785888811/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=whatpixel-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1785888811&linkId=7b2eb09b287cb61524227c5d24c70f2f
[Elasticsearch: The Definitive Guide]: https://www.amazon.com/gp/product/1449358543/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=whatpixel-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1449358543&linkId=cb5e3196580a4c055812057c12000e4e
[Elasticsearch Cookbook]: https://www.amazon.com/gp/product/1783554835/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&tag=whatpixel-20&camp=1789&creative=9325&linkCode=as2&creativeASIN=1783554835&linkId=8e00a4ffc8f85b4be15ee5b0f5b8c53b

[api_bash_scripts]: https://github.com/PHANTOM-Platform/Repository/tree/master/api_bash_scripts
[api_command_line]: https://github.com/PHANTOM-Platform/Repository/tree/master/api_command_line
[api_java]: https://github.com/PHANTOM-Platform/Repository/tree/master/api_java
[phantom]: http://www.phantom-project.org 
