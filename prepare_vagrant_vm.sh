sudo apt-get install -y sleuthkit g++ pkg-config libfuse-dev
sudo curl -o /usr/local/bin/n https://raw.githubusercontent.com/visionmedia/n/master/bin/n
sudo chmod +x /usr/local/bin/n
sudo n lts
sudo npm install -g node-gyp@3.4.0
sudo npm install -g node-ninja@1.0.2
cd /vagrant
npm i
