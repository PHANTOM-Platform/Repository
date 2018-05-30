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
cp -p build.templ build
./build

#another way

Building the RPM
Setup RPM build environment (according to CreatingPackageHowTo)
% sudo yum groupinstall "Development Tools"
% sudo yum install rpmdevtools
% rpmdev-setuptree
Download from the Project page
% rpm -ihv --nomd5 https://kojipkgs.fedoraproject.org//packages/pl/7.2.3/3.fc25/src/pl-7.2.3-3.fc25.src.rpm
Install development libraries needed to compile SWI-Prolog
% cd ~/rpmbuild
% su
% sudo yum install java-1.6.0-openjdk-devel
% sudo yum install `grep ^BuildRequires SPECS/pl.spec | awk 'NF==2 {print $2}'`
Build SWI-Prolog
% rpmbuild -ba SPECS/pl.spec
On RHEL 5 it may become necessary to disable SELinux temporarily to build the RPM because the built library libswipl.so requires text relocation.

Install the built packages
% sudo yum install RPMS/x86_64/pl-*.rpm

