# Procedural Town Generator For Tabletop Games

A web application that creates a randomy generated town for Tabletop games by rolling dice and using tables to determine the outcome.


## Installation

The application supports Ansible which will install all required services, code, and configurations to run on a fresh linux ubuntu system.

NGINX will run on port 80 proxying to the flask app on localhost port 8000.

To install just enter these commands:
```
sudo apt install ansible
wget https://raw.githubusercontent.com/Fiachra0/townCreator/master/townCreator.yml
ansible-playbook townCreator.yml
```

