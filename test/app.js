var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var restberry = require('restberry');


// ----- MONGOOSE -----

var DB = 'mongodb://localhost/restberry-npm';
mongoose.connect(DB);

// ----- EXPRESS -----

var app = express();
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.session({
    secret: 'restberry secret',
}));
app.use(passport.initialize());
app.use(passport.session());

// ----- RESTBERRY -----

restberry.config({
    apiPath: '/api/v1',
    port: 6000,
    verbose: true,
});
restberry.listen(app);

// -- BAR --

var BarSchema = new mongoose.Schema({
    name: {type: String, unique: true},
    timestampUpdated: {type: Date, default: new Date(), uneditable: true},
    timestampCreated: {type: Date, default: new Date(), uneditable: true},
});
var Bar = restberry.model(mongoose, 'Bar', BarSchema);

restberry.routes.create(app, Bar);  // POST /api/v1/bars
restberry.routes.del(app, Bar);  // DELETE /api/v1/bars/:id
restberry.routes.partialUpdate(app, Bar);  // POST /api/v1/bars/:id
restberry.routes.read(app, Bar);  // GET /api/v1/bars/:id
restberry.routes.readMany(app, Bar);  // GET /api/v1/bars
restberry.routes.update(app, Bar);  // PUT /api/v1/bars/:id

// -- USER --

// Enabling authentication, this will create a User model and have this
// be connected to the login and logout. You can supply additional fields
// to your user model or give it a custom usermodel by using
// restberry.enableAuthWithModel
restberry.enableAuth(app, passport, mongoose, {
    name: {
        first: {type: String},
        last: {type: String},
    }
});
var User = mongoose.model('User');

// POST /api/v1/users
restberry.routes.create(app, User);
// POST /api/v1/users/:id
restberry.routes.partialUpdate(app, User);
// GET /api/v1/users?action=me
restberry.routes.readMany(app, User, {
    authenticate: true,
    actions: {
        me: function(req, res, next) {
            req.expand.push('user');
            req.user.toJSON(req, res, true, next);
        },
    },
});  

// -- FOO --

// Here we are creating a model which is connected to the User model,
// if you enable authenticate for the API calls it will verify that you
// are logged in with the same user before interacting with it.
var FooSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: {type: String},
});
var Foo = restberry.model(mongoose, 'Foo', FooSchema);

// GET /api/v1/foos/:id
restberry.routes.read(app, Foo, {
    authenticate: true,
});
// GET /api/v1/users/:id/foos
restberry.routes.readMany(app, Foo, User, {
    authenticate: true,
});
// POST /api/v1/users/:id/foos
restberry.routes.create(app, Foo, User, {
    authenticate: true,
});

// -- BAZ --

var BazSchema = new mongoose.Schema({
    name: {type: String},
    nested: {
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        foos: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Foo'
        }],
    },
});
BazSchema.methods.isAuthorized = function(req, res, next) {
    next(this.nested.user == req.user.id);
};
var Baz = restberry.model(mongoose, 'Baz', BazSchema);

// POST /api/v1/users/:id/bazs
restberry.routes.create(app, Baz, User, {
    authenticate: true,
});

// -- TESTING --

app.get('/api/v1/clearData', function(req, res) {
    var models = mongoose.models;
    var keys = Object.keys(models);
    restberry.utils.forEachAndDone(keys, function(key, iter) {
        var model = models[key];
        model.remove({}, iter);
    }, res.end);
});
