#!/bin/bash
#script for obtaining the logs sorted by date

curl -XGET 'localhost:9400/repository_db/logs/_search?size=100&sort=date:asc&requestTimeout:Infinity&pretty="true"'

