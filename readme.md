# Node Cellar Sample Application with Backbone.js, Twitter Bootstrap, Node.js, Express, and RethinkDB #

This is a fork of Christophe Coenraets's [Node Cellar](https://github.com/ccoenraets/nodecellar) 
sample CRUD application built with Backbone.js, Twitter Bootstrap, Node.js, Express, modified to use RethinkDB.

The application allows you to browse through a list of wines, as well as add, update, and delete wines.

# Complete stack #

* [node.js](http://nodejs.org)
* [Backbone.js](http://backbonejs.org)
* [Bootstrap](http://twitter.github.com/bootstrap/)
* [Express](http://expressjs.com)
* [RethinkDB](http://www.rethinkdb.com)

# Installation #

```
git clone git://github.com/rethinkdb/nodecellar-rethinkdb.git
npm install
```

_Note_: If you don't have RethinkDB installed, you can follow [these instructions to get it up and running](http://www.rethinkdb.com/docs/install/). 

# Running the application #

Running the app is as simple as:

```
node server
```

Then open a browser: <http://localhost:3000>.

_Note_: If you want to override the default RethinkDB connection details, you can
specify them as environment variables:

* `RDB_HOST`: the RethinkDB host (default: `localhost`)
* `RDB_PORT`: the port (default `28015`)
* `RDB_DB`: the app database (default: `nodecellar`)

If you want to enable logging for the database queries (see [debug docs](https://github.com/visionmedia/debug)
for more configuration options):

```
DEBUG=rdb node server
```
