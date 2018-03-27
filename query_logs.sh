#!/bin/bash

curl -XGET 'localhost:9400/repository_db/logs/_search?size=100&sort=date:asc&requestTimeout:Infinity&pretty="true"'


curl -XGET 'localhost:9400/repository_db/users/_search?size=100&sort=date:asc&requestTimeout:Infinity&pretty="true"'

