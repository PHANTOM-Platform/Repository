#!/bin/bash

#Script for installing the swipl 
#Tested on ubuntu 17.04

 sudo apt-add-repository ppa:swi-prolog/stable;
 sudo apt-get update;
 sudo apt-get install swi-prolog;

#Please try at other linux distributions where the previous procedure doesn't work:

git clone https://github.com/SWI-Prolog/swipl-devel.git
cd swipl-devel
make distclean
git pull
./prepare
./build
