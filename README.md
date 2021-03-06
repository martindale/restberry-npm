Restberry
=========

Framework for setting up RESTful APIs. Define your models and setup CRUD API
calls without needing to write any code (see Usage). All API calls will handle
and identify issues and throw necessary HTTP responses and easy to debug error
responses. Restberry also handles authentication and permission checks and
throws appropriate errors.

## Install

```
npm install restberry
```

## Usage

```
var restberry = require('restberry');
var express = require('express');
var mongoose = require('mongoose');

var app = express();
restberry.config({
    apiPath: '/api/v1',
    port: 5000,
});
restberry.listen(app);

var FooSchema = new mongoose.Schema({
    name: {type: String},
});
var Foo = restberry.model(app, 'Foo', FooSchema);

restberry.routes.create(app, Foo);  // POST /api/v1/foos
restberry.routes.partialUpdate(app, Foo);  // POST /api/v1/foos/:id
restberry.routes.update(app, Foo);  // PUT /api/v1/foos/:id

var BarSchema = new mongoose.Schema({
    foo: {type: mongoose.Schema.Types.ObjectId, ref: 'Foo'},
    name: {type: String},
});
var Bar = restberry.model(app, 'Bar', BarSchema);

restberry.routes.create(app, Bar, Foo);  // POST /api/v1/foos/:id/bars
restberry.routes.del(app, Bar);  // DELETE /api/v1/bars/:id
restberry.routes.read(app, Bar);  // GET /api/v1/bars/:id
restberry.routes.readMany(app, Bar, Foo);  // GET /api/v1/foos/:id/bars
```

**NOTE:** See more usages in the test app.

## Authentication

You can enable authentication for you app with the help of the passport npm
framework. This will automatically create a user model and add login and
logout API calls that will verify the data against the objects in this model.

Other API calls that have this model as a field and have
authentication enabled will check that you are logged in as the correct user
before allowing you to access the object, otherwise it will throw a forbidden
(403) status response.

```
restberry.enableAuth(app, passport, mongoose);
var User = mongoose.model('User');

var BazSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: {type: String},
});
var Baz = restberry.model(app, 'Baz', BazSchema);

// POST /api/v1/users/:id/bazs
restberry.routes.create(app, Baz, User, {
    authenticate: true,
});
```

**NOTE:** By default the authentication will look for a user field in your model and verify that this matches the logged in user. You can override as such:
```
BazSchema.isAuthorized = function(req, res, next) {
    var authorized = ...  // true or false
    next(authorized);
});
```

**Google Authenctication:**

You can choose to authenticate with Google by passing in your ClientId and
ClientSecret like so:

```
restberry.config({
    auth: {
        clientID: <CLIENT_ID>,
        clientSecret: <CLIENT_SECRET>,
        callbackHost: 'http://localhost',
        returnURL: '/home',
    },
    apiPath: '/api/v1',
    port: 5000,
});
restberry.enableAuthWithGoogle(app, passport, mongoose);
```

This will create a User object containing googleId, email, name, image and
gender.

## Response examples

All these responses below are automatically handled without needing to write any
additional code.

* **200** OK
```
2014-05-11T11:55:53.916Z|172.16.122.129|GET|</api/v1/foos/536f6549e88ad2b5a71ffdc6> <{}>
2014-05-11T11:55:53.920Z|172.16.122.129|200|<{
  "foo": {
    "href": "/api/v1/foos/536f6549e88ad2b5a71ffdc7",
    "id": "536f6549e88ad2b5a71ffdc7",
    "name": "test"
  }
}>
```

* **201** CREATED
```
2014-05-11T11:55:54.210Z|172.16.122.129|POST|</api/v1/foos> <{
  "name": "test"
}>
2014-05-11T11:55:54.210Z|172.16.122.129|201|<{
  "foo": {
    "href": "/api/v1/foos/536f654ae88ad2b5a71ffdcb",
    "id": "536f654ae88ad2b5a71ffdcb",
    "name": "test"
  }
}>
```

* **204** NO CONTENT
```
2014-05-11T11:55:52.575Z|172.16.122.129|DELETE|</api/v1/foos/536f6548e88ad2b5a71ffdb7> <{}>
2014-05-11T11:55:52.579Z|172.16.122.129|204|
```

* **401** UNAUTHORIZED
```
2014-05-11T13:26:27.758Z|172.16.122.129|GET|</api/v1/foos/536f7a835bc82212a9e78624> <{}>
2014-05-11T13:26:27.758Z|172.16.122.129|401|<{
  "error": {
    "statusCode": 401,
    "property": "",
    "title": "Unauthorized",
    "message": "Need to be logged in to perform this action.",
    "devMessage": "Requested <GET> </api/v1/foos/536f7a835bc82212a9e78624> with data <{}>. Make sure you are logged in and authenticated. {}"
  }
}>
```

* **403** FORBIDDEN
```
2014-05-11T13:26:27.758Z|172.16.122.129|GET|</api/v1/foos/536f7a835bc82212a9e78624> <{}>
2014-05-11T13:26:27.758Z|172.16.122.129|403|<{
  "error": {
    "statusCode": 403,
    "property": "",
    "title": "Forbidden",
    "message": "You are not authorized!",
    "devMessage": "Requested <GET> </api/v1/foos/536f7a835bc82212a9e78624> with data <{}>. Make sure you're logged in with the correct credentials."
  }
}>
```

* **409** CONFLICT
```
2014-05-11T11:55:55.368Z|172.16.122.129|POST|</api/v1/foos> <{
  "name": "test"
}>
2014-05-11T11:55:55.358Z|172.16.122.129|409|<{
  "error": {
    "statusCode": 409,
    "property": "foo",
    "title": "Conflict",
    "message": "There already exists a 'foo' object with these properties.",
    "devMessage": "Requested <POST> </api/v1/foos> with data <{\"name\":\"test\"}>.'
  }
}>
```

* **500** SERVER ISSUE
```
2014-05-11T13:23:37.820Z|172.16.122.129|POST|</api/v1/foos> <{
  "name": "test"
}>
2014-05-11T13:23:37.821Z|172.16.122.129|500|<{
  "error": {
    "statusCode": 500,
    "property": "",
    "title": "Server Issue",
    "message": "We're on it!",
    "devMessage": "Requested <POST> </api/v1/bars> with data <{\"name\":\"test\"}>."
  }
}>
```

## Route hooks

When defining routes there are two hooks you can specify for manipulating
data or handling responses.

```
preAction = function(req, res, next) { 
    ...
    next();
}
postAction = function(json, req, res, next) {
    ...
    next(json);
}
```

You specify the hooks by supplying it to the API definition, with this you can
also supply:

 * **authenticate**: if true, the app will verify that you are logged in and that you have permission to manipulate the object.
 * **actions**: define actions that will happen if an api call is made with the specified query string action.

```
restberry.routes.read(app, Bar, {
    preAction: function(req, res, next) { ... },
    postAction: function(json, req, res, next) { ... },
    authenticate: true,
    actions: {
        // This action will be triggered if ?action=action-value
        'action-value': function(req, res, next) { ... },
    },
});
```

## Run the tests

```
$ cd test
$ npm install
$ ./node_modules/nodeunit/bin/nodeunit ./tests
```

**NOTE:** Don't forget to run the test app: $ node app

## Contact

I'm really interested to here what you guys think of Restberry, especially if
you have any suggestions to improve the package. Please contact me at
thematerik@gmail.com.
