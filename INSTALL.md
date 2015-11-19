prerequisite
```sh
	$ sudo apt-get install build-essential openssl libssl-dev pkg-config wget git vim apparmor
```

[mongodb](https://docs.mongodb.org/manual/installation)
```sh
	$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
	$ echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
	$ sudo apt-get update
	$ sudo apt-get install -y mongodb-org
```

[nodejs](https://nodejs.org/en/download)
```sh
	$ wget https://nodejs.org/dist/v4.2.2/node-v4.2.2.tar.gz
	$ tar -xzf node-v*
	$ cd node-v*
	$ sudo ./configure
	$ sudo make
	$ sudo make test
	$ sudo make install
```
