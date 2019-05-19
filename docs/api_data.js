define({ "api": [
  {
    "type": "get",
    "url": "/_flush",
    "title": "It makes sure the data is stored in the database.",
    "version": "1.0.0",
    "name": "_flush",
    "group": "Administration",
    "permission": [
      {
        "name": "user at localhost"
      }
    ],
    "description": "<p>It makes sure the data is stored in the database, then responses from other requests executed immediately after it will return data consistent with any update done before the flush.</p>",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -s -H \"Authorization: OAuth ${mytoken}\" -XGET http://${server}:${port}/_flush\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "BadRequest",
            "description": "<p>Report error message</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 400 Bad Request",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Administration"
  },
  {
    "type": "get",
    "url": "/downloadlist",
    "title": "downloadlist",
    "version": "1.0.0",
    "name": "downloadlist",
    "group": "Administration",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Returns downloadzip</p>",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -XGET http://serveraddress:server:port/downloadlist\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>JSON structure</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\n{....}",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Administration"
  },
  {
    "type": "get",
    "url": "/drop_db",
    "title": "drops the database of the server",
    "version": "1.0.0",
    "name": "drop_db",
    "group": "Administration",
    "permission": [
      {
        "name": "user at localhost"
      }
    ],
    "description": "<p>Deletes completely all the information stored at the database of server, it returns error if not exists the database to drop. Its use is restricted to request from the same machine where is running the server.</p>",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -s -H \"Authorization: OAuth ${mytoken}\" -XGET http://${server}:${port}/drop_db\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "BadRequest",
            "description": "<p>Report error message</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 400 Bad Request",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Administration"
  },
  {
    "type": "get",
    "url": "/get_log_list",
    "title": "get_log_list",
    "version": "1.0.0",
    "name": "get_log_list",
    "group": "Administration",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Returns shorted registered logs, where the shorting criteria depends on the  provided &quot;sorttype&quot; parameter.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "int",
            "optional": false,
            "field": "sorttype",
            "description": "<p>Shorting criteria (OPTIONAL PARAMETER): 1: sort by id 2: sort by error code 3: sort by user 4: sort by IP address 5: sort by Message 0: sort by Date: default if not provided code</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "pretty",
            "description": "<p>For tabulate the json response and make it more human readable.</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -XGET http://serveraddress:server:port/get_log_list?sorttype=\"XXX\"\\&pretty=\"true\"\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>JSON structure</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\n{....}",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Administration"
  },
  {
    "type": "get",
    "url": "/new_db",
    "title": "Registers a new database of the server",
    "version": "1.0.0",
    "name": "new_db",
    "group": "Administration",
    "permission": [
      {
        "name": "user at localhost"
      }
    ],
    "description": "<p>Registers a new database of the server, it may return error if already exists. Its use is restricted to request from the same machine where is running the server.</p>",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -s -H \"Authorization: OAuth ${mytoken}\" -XGET http://${server}:${port}/new_db\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "BadRequest",
            "description": "<p>Report error message</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 400 Bad Request",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Administration"
  },
  {
    "type": "post",
    "url": "/new_log",
    "title": "Registers a log.",
    "version": "1.0.0",
    "name": "new_log",
    "group": "Administration",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Registers a log with the provided input parameters.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mytoken",
            "description": "<p>the token.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "code",
            "description": "<p>sucecss/error HTML code of the event.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_id",
            "description": "<p>Id of the user responsible of the event.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "ip",
            "description": "<p>The ip from where the user ran the event. If not provided will store the ip from where is requested the new log.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The description of the event.</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -H \"Authorization: OAuth ${mytoken}\" -H \"Content-Type: text/plain\" -XPOST http://${server}:port/new_log?code=111\\&ip=\"10.11.12.13\"\\&message=\"Some description\"\\&user=\"jaja@abc.com\"\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>JSON structure</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\nregistered log",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "InvalidToken",
            "description": "<p>Error message when the token is not valid</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 401 Not Authenticated\n  Invalid token",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Administration"
  },
  {
    "type": "post",
    "url": "/update_user",
    "title": "Update the password of an user",
    "version": "1.0.0",
    "name": "update_user",
    "group": "Administration",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Update the password of an user</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>MANDATORY this is the user_id.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "pw",
            "description": "<p>MANDATORY it is the password of the user</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -H \"Content-Type: text/plain\" -XPOST http://server:port/update_user?name=\"bob\"\\&email=\"bob@abc.commm\"\\&pw=\"1234\";\n \nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "Response when missing mandatory parameters:",
          "content": "HTTP/1.1 400 Bad Request",
          "type": "json"
        },
        {
          "title": "Response when not valid user/password:",
          "content": "HTTP/1.1 401 Not Authenticated",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Administration"
  },
  {
    "type": "get",
    "url": "/delete_metadata",
    "title": "Delete Metadata",
    "version": "1.0.0",
    "name": "delete_metadata",
    "group": "Delete_Info",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Removes the specified SINGLE file and the associated Metadata, only if provided a valid token, based on the input parameters.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mytoken",
            "description": "<p>MANDATORY the token.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "project",
            "description": "<p>MANDATORY The file to delete is stored in the specified project.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "source",
            "description": "<p>MANDATORY The file to delete is stored in the specified source.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Path",
            "description": "<p>MANDATORY The file to delete is stored in the path.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "filename",
            "description": "<p>MANDATORY The file to delete is stored with the specified name.</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -s -H \"Authorization: OAuth ${mytoken}\" -XGET http://${server}:${port}/delete_metadata?project=phantom_tools_on_HPC\\&source=user\\&Path=mypath\\&DestFileName=main.c;\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>text string : &quot;deleted succeed&quot;.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\ndeleted succeed",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "InvalidToken",
            "description": "<p>Error message when the token is not valid.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "FileNotFound",
            "description": "<p>Error message when the file not exists in the repository server.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 401 Not Authenticated\nInvalid token",
          "type": "json"
        },
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 400 FileNotFound\nCould not DELETE an not existing register.",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Delete_Info"
  },
  {
    "type": "post",
    "url": "/upload",
    "title": "upload",
    "version": "1.0.0",
    "name": "new_log",
    "group": "Register_Info",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>upload</p>",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -H \"Authorization: OAuth ${mytoken}\" -H \"Content-Type: text/plain\" -XPOST http://${server}:port/upload\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>JSON structure</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\nregistered log",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Register_Info"
  },
  {
    "type": "get",
    "url": "/downloadzip",
    "title": "downloadzip",
    "version": "1.0.0",
    "name": "downloadzip",
    "group": "Retrieve_Info",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>downloadzip</p>",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -XGET http://serveraddress:server:port/downloadzip\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>JSON structure</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\n{....}",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Retrieve_Info"
  },
  {
    "type": "get",
    "url": "/es_query_metadata",
    "title": "Run a user-defined ES-query on the registered Metadata",
    "version": "1.0.0",
    "name": "es_query_metadata",
    "group": "Retrieve_Info",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Returns the result of running the Metadata, only if provided a valid token, user-defined ES-query on the registered Metadata. The response is in JSON format. The JSON is empty as '[]' when there is not found any metadata corresponding to the input parameters.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mytoken",
            "description": "<p>the token.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "project",
            "description": "<p>The query will be done for the files stored in the specified project.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "source",
            "description": "<p>The query will be done for the files stored in the source in the specified  project.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Path",
            "description": "<p>The query will be done for the files stored in the path in the specified source and project.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "filename",
            "description": "<p>The query will be done for the file with the specified name.</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -s -H \"Authorization: OAuth ${mytoken}\" -XGET http://${server}:${port}/es_query_metadata?pretty=\"true\"\\&myBody=\"\\{\\\"query\\\":\\{\\\"bool\\\":\\{\\\"must\\\":\\[\\{\\\"match\\\":\\{\\\"path\\\":\\\"mypath/\\\"\\}\\},\\{\\\"match\\\":\\{\\\"filename\\\":\\\"main.c\\\"\\}\\}\\]\\}\\}\\}\"\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>JSON structure</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\n[\n   {\"project\":\"phantom_tools_on_HPC\",\"project_length\":20,\n    \"source\":\"user\",\"source_length\":4,\n    \"path\":\"mypath\",\"path_length\":6,\n    \"filename\":\"main.c\",\"filename_length\":6,\n    \"some_field\":\"somevalue\",\"some_field_length\":9,\n    \"domain\":\"domain_public\",\"domain_length\":13}\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "InvalidToken",
            "description": "<p>Error message when the token is not valid</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 401 Not Authenticated\n  Invalid token",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Retrieve_Info"
  },
  {
    "type": "post",
    "url": "/download",
    "title": "download",
    "version": "1.0.0",
    "name": "new_log",
    "group": "Retrieve_Info",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>download</p>",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -H \"Authorization: OAuth ${mytoken}\" -H \"Content-Type: text/plain\" -XPOST http://${server}:port/download\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>JSON structure</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\nregistered log",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Retrieve_Info"
  },
  {
    "type": "get",
    "url": "/query_metadata",
    "title": "Retrieve Metadata",
    "version": "1.0.0",
    "name": "query_metadata",
    "group": "Retrieve_Info",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Returns the Metadata, only if provided a valid token, of a file or set of selected files based on the input paramters. The response is in JSON format. The JSON is empty as '[]' when there is not found any metadata corresponding to the input parameters.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "mytoken",
            "description": "<p>the token.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "project",
            "description": "<p>The query will be done for the files stored in the specified project.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "source",
            "description": "<p>The query will be done for the files stored in the source in the specified  project.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "Path",
            "description": "<p>The query will be done for the files stored in the path in the specified source and project.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "filename",
            "description": "<p>The query will be done for the file with the specified name.</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -s -H \"Authorization: OAuth ${mytoken}\" -XGET http://${server}:${port}/query_metadata?project=phantom_tools_on_HPC\\&source=user\\&Path=mypath\\&filename=main.c;\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>JSON structure</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK\n[\n   {\"project\":\"phantom_tools_on_HPC\",\"project_length\":20,\n    \"source\":\"user\",\"source_length\":4,\n    \"path\":\"mypath\",\"path_length\":6,\n    \"filename\":\"main.c\",\"filename_length\":6,\n    \"some_field\":\"somevalue\",\"some_field_length\":9,\n    \"domain\":\"domain_public\",\"domain_length\":13}\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "InvalidToken",
            "description": "<p>Error message when the token is not valid</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 401 Not Authenticated\n  Invalid token",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Retrieve_Info"
  },
  {
    "type": "post",
    "url": "/login",
    "title": "Returns a new token",
    "version": "1.0.0",
    "name": "login",
    "group": "Security",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Returns a new encrypted token, with a limited lifetime, for the user_id if the user_id/password provided are valid.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>MANDATORY this is the user_id.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "pw",
            "description": "<p>MANDATORY it is the password of the user</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -H \"Content-Type: text/plain\" -XGET http://server:port/login?email=\"bob\"\\&pw=\"1234\" --output token.txt;\n \nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "response",
            "description": "<p>token which consists on a encrypted text string.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "Response when missing mandatory parameters:",
          "content": "HTTP/1.1 400 Bad Request",
          "type": "json"
        },
        {
          "title": "Response when not valid user/password:",
          "content": "HTTP/1.1 401 Not Authenticated",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Security"
  },
  {
    "type": "get",
    "url": "/verifytoken",
    "title": "Returns if the provided Token is valid or not",
    "version": "1.0.0",
    "name": "verifytoken",
    "group": "Security",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>Verifies of the provided token is valid. Authorization Tokens are generated when user autenticates with an id and a password, the tokens are required for accessing to private content only if autenticated.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "the",
            "description": "<p>token.</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -s -H \"Authorization: OAuth ${mytoken}\" -XGET http://${server}:${port}/verifytoken\nor alternatively when available SSL certificates:\ncurl -s -H \"Authorization: OAuth ${mytoken}\" -XGET https://${server}:${port}/verifytoken",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "reponse",
            "description": "<p>The token is valid !!!.</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "InvalidToken",
            "description": "<p>Invalid token</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 401 Not Authenticated\n  Invalid token",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Security"
  },
  {
    "type": "get",
    "url": "/verify_es_connection",
    "title": "Returns success (200) when the Server has connection or server-error(503) in other case",
    "version": "1.0.0",
    "name": "verify_es_connection",
    "group": "Testing_Functionality",
    "permission": [
      {
        "name": "user"
      }
    ],
    "description": "<p>The purpose is use for verifying the connectivity of the server with the ElasticSearch Database.</p>",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -s -XGET http://${server}:${port}/verify_es_connection\nor alternatively use service at https when available SSL certificates.",
        "type": "json"
      }
    ],
    "success": {
      "examples": [
        {
          "title": "Success response:",
          "content": "HTTPS 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 503 Service Unavailable",
          "type": "json"
        }
      ]
    },
    "filename": "/home/jmontana/apidocs/server_code/repo_app_sec.js",
    "groupTitle": "Testing_Functionality"
  }
] });
