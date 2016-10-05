# sails-custom-swagger-hook

[![NPM version][npm-image]][npm-url]
[![Dependency Status][daviddm-image]][daviddm-url]

> Important! develoment in progress..

[swagger.io](swagger-url) hook for [Sails JS](sails-url). Customized to support the Swagger 2.0 specification, it is a simple and clean solution to integrate swagger with Sails, the application's models, controllers, and routes are automatically aggregated and transformed into a Swagger Document. Based in forks(outdated) of [swagger-express](swagger-express-url), [sails-swagger](sails-swagger-url) and [sails-swagr](sails-swagr-url), but uptate and personalize to use with up to date dependencies.


### Summary

This module will do it best to autogenerate everything it can from Sails configuration and create
a Swagger 2.0 JSON Specification to be used with the Swagger-UI. After routes and models have been generated,
you may create a `docs` directory under `api/` and place YML documents with paths definitions for each Controller. As a result, the generated JSONs and YAMLs will be **merged**.


## Installation

    $ npm install sails-custom-swagger-hook --save


## Quick Start

Configure hook as express middleware.

Key              | Example value                 | Description
---------------- | ----------------------------- |:---------------------
`apiVersion`     | '1.0'                         | Your api version.
`swaggerVersion` | '2.0'                         | Swagger version.
`swaggerURL`     | '/api/docs'                   | Path to use for swagger ui web interface.
`swaggerJSON`    | '/api-docs.json'              | Path to use for swagger ui JSON.
`basePath`       | sails.config.appUrl           | The basePath for swagger.js
`info`           | { title: '', description: ''} | [Metadata][info] about the API
`apis`           | ['./api/docs/User.yml']       | Define your api array.
`middleware`     | fn                            | Function before response.


## Sails Integration

Modify the `config/http.js` to look like:

```js
customMiddleware: function (app) {
    var swagger = require('sails-custom-swagger-hook');
    var express = require('express');

    app.use(swagger.init(express, app, {
        apiVersion: '1.0',
        swaggerVersion: '2.0',
        swaggerURL: '/api/docs',
        swaggerJSON: '/api-docs.json',
        basePath: sails.config.appUrl,
        info: {
          title: ' API Swagger Documentation',
          description: 'Sails Swagr'
        },
        apis: [
          './api/docs/Cards.yml',
          './api/docs/Stories.yml',
          './api/docs/Users.yml',
        ]
    }));
    sails.on('ready', function() {
      swagger.sailsGenerate({
        routes: sails.router._privateRouter.routes,
        models: sails.models
      });
    });
  }

```

#### Swagger-UI

Lift sails and navigate to the specified `swaggerURL` e.g.

```
http://localhost:1337/api/docs
```


## Read from YAML file

Example 'Users.yml'

```yml

paths:
  /login:
    post:
      summary: Login with username and password
      notes: Returns a user based on username
      responseClass: User
      nickname: login
      consumes:
        - text/html
      parameters:

      - name: username
        dataType: string
        paramType: query
        required: true
        description: Your username

      - name: password
        dataType: string
        paramType: query
        required: true
        description: Your password

definitions:
  User:
    properties:
      username:
        type: String
      password:
        type: String
```

[Swagger](http://swagger.io/) is a specification and complete framework
implementation for describing, producing, consuming, and visualizing RESTful web services.
View [demo](http://petstore.swagger.io/).


That&rsquo;s it!

# Credits

- [swagger-express](swagger-express-url),
- [sails-swagger](sails-swagger-url)
- [sails-swagr](sails-swagr-url)


## License

The [MIT](https://github.com/jasancheg/sails-custom-swagger-hook/blob/master/LICENSE) License, © [jasancheg](https://github.com/jasancheg/)


[npm-url]: https://npmjs.org/package/sails-custom-swagger-hook
[npm-image]: https://badge.fury.io/js/sails-custom-swagger-hook.svg?style=flat
[daviddm-url]: https://david-dm.org/jasancheg/sails-custom-swagger-hook
[daviddm-image]: http://img.shields.io/david/jasancheg/sails-custom-swagger-hook.svg?style=flat
[sails-url]: http://sailsjs.org/
[swagger-url]: http://swagger.io/
[swagger-express-url]: https://github.com/fliptoo/swagger-express
[sails-swagger-url]: https://github.com/tjwebb/sails-swagger
[sails-swagr-url]: https://github.com/qbanguy/sails-swagr
