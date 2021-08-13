# Vax Distributed Application (demo)

VAX is a distributed application that enables companies and governments to exchange information in order to track vaccine shipments around the world.

## Content

 * [TL;DR](#tldr)
 * [Usage](#usage)
 * [Project Structure](#project-structure)

## Usage

1) Clone this repo to your desktop
2) Go to its root directory
3) run ```sh setup.sh ```
4) Open postman and use the postman collection that is in the project

## Project Structure

```shell
vax-dist-app/
├── authorityAPI
│   ├── Docker
│        ├── dockerfile
│   ├── src
│        ├── config/ (contains kafka setup configs)
│        ├── controllers/ (get the requested data from the models and return it)
│        ├── entities/ (Have the entity classes and it is used to map database table and its fields with the entities and its attributes)
│        ├── services/ (Deals with everything that has business logic)
│        ├── routers/ (Forward requests to the appropriate controller functions)
│        ├── utils/ (A helper folder that contains helper functions, constants, etc...)
│        ├── ormconfig.json (typeorm database setup configs)
│        ├── ormconfig.production.json (typeorm database setup configs used in production environment)
│   ├── docker-compose.yml
├── customerAPI
│   ├── Docker
│        ├── dockerfile
│   ├── src
│        ├── (structure similar to the AuthorityAPI)
│   ├── docker-compose.yml
├── manufacturerAPI
│   ├── Docker
│        ├── dockerfile
│   ├── src
│        ├── (structure similar to the AuthorityAPI)
│   ├── docker-compose.yml
├── notaryAPI
│   ├── Docker
│        ├── dockerfile
│   ├── src
│        ├── (structure similar to the AuthorityAPI)
│   ├── docker-compose.yml
├── docker-compose.yml
├── setup.sh
└── shutdown.sh
```


The project is built on a microservices architecture, where each component has its own docker-compose that contains its database (Postgres) and its own node.
At the root of the project, there is a docker-compose that will launch the Kafka server through which all messages pass.
There are also two files in the root of the project which are:
- setup.sh, which is used to automate the project setup;
- shutdown.sh, which is used in the beginning of the setup.sh file to ensure that all containers are down and have been removed.

Note: The customerAPI folder is a microservice structure that contains in comments the steps to follow, it is very similar to the Authority API.

## License
[MIT](https://choosealicense.com/licenses/mit/)
