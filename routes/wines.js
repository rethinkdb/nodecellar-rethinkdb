// A fork of the Christophe Coenraets's [Node Cellar](https://github.com/ccoenraets/nodecellar)
// sample app using Backbone.js, Twitter Bootstrap, Node.js, Express, and RethinkDB.
//
// See the [GitHub README](https://github.com/rethinkdb/nodecellar-rethinkdb/blob/master/readme.md)
// for details of the complete stack, installation, and running the app.


// This module uses a single database connection which is 
// initialized before the app starts serving requests. 
// See `server.js` for details.

var r = require('rethinkdb'),
    debug = require('debug')('rdb'),
    self = this;


// #### Retrieving a single document

/**
 * Every "wine" document is assigned a unique id when created.
 * Retrieving a document by its id can be done using the
 * [`get`](http://www.rethinkdb.com/api/#js:selecting_data-get) function.
 *
 * RethinkDB will use the primary key index to fetch the result.
 */
exports.findById = function (req, res) {
  var id = req.params.id;
  debug('findById: %s', id);

  self.connection.run(r.table('wines').get(id), function(result) {
    if (result && result.name !== 'Runtime Error') {
      res.send(result);
    }
    else {
      debug("[ERROR] findById: %s => %j", id, result['message']);
      res.send({'error': result['message']});
    }
    return false; // this callback should not be invoked again 
  });
};

// #### Retrieving all documents

/**
 * To retrieve all documents in a table, we can use
 * the [`table`](http://www.rethinkdb.com/api/#js:selecting_data-table) function.
 * 
 * Results are [`collect`](http://www.rethinkdb.com/api/#js:accessing_rql-collect)ed
 * and passed as an array to the callback function.
 *
 * _Todo_: The current implementation of the Backbone models requires
 * returning all results for pagination. Ideally, this
 * should return only the current page results and the 
 * total number of wines for paginating through.
 * _Pull requests are welcome!_
 */
exports.findAll = function (req, res) {
	self.connection.run(r.table('wines'), {})
      .collect(function(results) {
      	if(results && results.length === 1 && results[0]['name'] === 'Runtime Error') {
      		debug("[ERROR] findAll: %s", results[0]['message']);
          res.send([]);
        }
        else {
          res.send(results);
        }
      });
};

// #### Creating a new document

/**
 * To save a new wine document we are using 
 * [`insert`](http://www.rethinkdb.com/api/#js:writing_data-insert). 
 *
 * If the new document doesn't provide an `id` attribute, then the
 * database will automatically assign a new id.
 *
 * The `insert` op returns an object specifying the number
 * of successfully created objects and their corresponding IDs:
 * `{ "inserted": 1, "errors": 0, "generated_keys": ["b3426201-5767-6036-4a21-99921974ab84"] }`
 */
exports.addWine = function (req, res) {
	var wine = req.body;
	debug('Adding wine: %j', wine);

	self.connection.run(r.table('wines').insert("kjdhkjshdjsd"), function(result) {
		if (result && result['inserted'] === 1) {
			wine['id'] = result['generated_keys'][0];
			res.send(wine);
		}
		else {
			res.send({'error': 'An error occurred when adding the new wine (' + result['first_error'] + ')'})
		}
	});
};

// #### Updating a document

/**
 * To update a document when knowing its `id` is done by
 * chaining together two functions: 
 * [`get`](http://www.rethinkdb.com/api/#js:selecting_data-get) and
 * [`update`](http://www.rethinkdb.com/api/#js:writing_data-update).
 *
 * Chained operations are always executed in the database and 
 * _not on the client side_.
 */
exports.updateWine = function (req, res) {
  var id = req.params.id;
  var wine = req.body;
  wine['id'] = id;
  debug('Updating wine: %j', wine);

  self.connection.run(r.table('wines').get(id).update(wine), function(result) {
		if(result && result['updated'] === 1) {
			res.send(wine);
		}
		else {
			res.send({'error': 'An error occurred when updating the wine with id: ' + id});
		}
	});
};

// #### Deleting a document

/**
 * To delete a single document when having its `id` can be done
 * by firstly [`get`](http://www.rethinkdb.com/api/#js:selecting_data-get)-ing
 * the document by `id` and then using the 
 * [`del`](http://www.rethinkdb.com/api/#js:writing_data-delete) function.
 *
 * ReQL chained operations are executed together in the database and 
 * they return the final result. There is a single database roundtrip.
 */
exports.deleteWine = function (req, res) {
  var id = req.params.id;
  debug('Deleting wine: %s', id);
	self.connection.run(r.db(dbConfig['db']).table('wines').get(id).del(), function(result) {
		if(result && result['deleted'] === 1) {
			res.send(req.body);
		}
		else {
			res.send({'error': 'An error occurred when deleting the wine with id:' + id});
		}
	});
};


// #### Database setup

/** 
 * We initialize the database by performing the following operations:
 *
 * -   create the database `RDB_DB` (defaults to `nodecellar`) using [`dbCreate`](http://www.rethinkdb.com/api/#js:manipulating_databases-db_create)
 * -   create the `wines` table using [`tableCreate`](http://www.rethinkdb.com/api/#js:manipulating_tables-table_create)
 *
 * If the table didn't exist than we populate the table with some sample data using a
 * bulk [`insert`](http://www.rethinkdb.com/api/#js:writing_data-insert).
 *
 * You'd typically not find this code in a real-life app, since the database would already exist.
 */
exports.setupDB = function(dbConfig, connection) {
	var wines = [
    {
        name: "CHATEAU DE SAINT COSME",
        year: "2009",
        grapes: "Grenache / Syrah",
        country: "France",
        region: "Southern Rhone",
        description: "The aromas of fruit and spice give one a hint of the light drinkability of this lovely wine, which makes an excellent complement to fish dishes.",
        picture: "saint_cosme.jpg"
    },
    {
        name: "LAN RIOJA CRIANZA",
        year: "2006",
        grapes: "Tempranillo",
        country: "Spain",
        region: "Rioja",
        description: "A resurgence of interest in boutique vineyards has opened the door for this excellent foray into the dessert wine market. Light and bouncy, with a hint of black truffle, this wine will not fail to tickle the taste buds.",
        picture: "lan_rioja.jpg"
    },
    {
        name: "MARGERUM SYBARITE",
        year: "2010",
        grapes: "Sauvignon Blanc",
        country: "USA",
        region: "California Central Cosat",
        description: "The cache of a fine Cabernet in ones wine cellar can now be replaced with a childishly playful wine bubbling over with tempting tastes of black cherry and licorice. This is a taste sure to transport you back in time.",
        picture: "margerum.jpg"
    },
    {
        name: "OWEN ROE \"EX UMBRIS\"",
        year: "2009",
        grapes: "Syrah",
        country: "USA",
        region: "Washington",
        description: "A one-two punch of black pepper and jalapeno will send your senses reeling, as the orange essence snaps you back to reality. Don't miss this award-winning taste sensation.",
        picture: "ex_umbris.jpg"
    },
    {
        name: "REX HILL",
        year: "2009",
        grapes: "Pinot Noir",
        country: "USA",
        region: "Oregon",
        description: "One cannot doubt that this will be the wine served at the Hollywood award shows, because it has undeniable star power. Be the first to catch the debut that everyone will be talking about tomorrow.",
        picture: "rex_hill.jpg"
    },
    {
        name: "VITICCIO CLASSICO RISERVA",
        year: "2007",
        grapes: "Sangiovese Merlot",
        country: "Italy",
        region: "Tuscany",
        description: "Though soft and rounded in texture, the body of this wine is full and rich and oh-so-appealing. This delivery is even more impressive when one takes note of the tender tannins that leave the taste buds wholly satisfied.",
        picture: "viticcio.jpg"
    },
    {
        name: "GRASA DE COTNARI",
        year: "2008",
        grapes: "Furmint",
        country: "Romania",
        region: "Cotnari",
        description: "Grasa is a privilege inherited for centuries in the legendary region of the Cotnari vineyards. Starting with a greenish nuance in its young age, becoming golden after it has been ageing; its taste resembles the one of walnuts, dry raisins and almonds, associated with the nuances generated by noble molds.",
        picture: "grasacotnari.jpg"
    },
    {
        name: "CHATEAU LE DOYENNE",
        year: "2005",
        grapes: "Merlot",
        country: "France",
        region: "Bordeaux",
        description: "Though dense and chewy, this wine does not overpower with its finely balanced depth and structure. It is a truly luxurious experience for the senses.",
        picture: "le_doyenne.jpg"
    },
    {
        name: "DOMAINE DU BOUSCAT",
        year: "2009",
        grapes: "Merlot",
        country: "France",
        region: "Bordeaux",
        description: "The light golden color of this wine belies the bright flavor it holds. A true summer wine, it begs for a picnic lunch in a sun-soaked vineyard.",
        picture: "bouscat.jpg"
    },
    {
        name: "BLOCK NINE",
        year: "2009",
        grapes: "Pinot Noir",
        country: "USA",
        region: "California",
        description: "With hints of ginger and spice, this wine makes an excellent complement to light appetizer and dessert fare for a holiday gathering.",
        picture: "block_nine.jpg"
    },
    {
        name: "DOMAINE SERENE",
        year: "2007",
        grapes: "Pinot Noir",
        country: "USA",
        region: "Oregon",
        description: "Though subtle in its complexities, this wine is sure to please a wide range of enthusiasts. Notes of pomegranate will delight as the nutty finish completes the picture of a fine sipping experience.",
        picture: "domaine_serene.jpg"
    },
    {
        name: "BODEGA LURTON",
        year: "2011",
        grapes: "Pinot Gris",
        country: "Argentina",
        region: "Mendoza",
        description: "Solid notes of black currant blended with a light citrus make this wine an easy pour for varied palates.",
        picture: "bodega_lurton.jpg"
    },
    {
        name: "LES MORIZOTTES",
        year: "2009",
        grapes: "Chardonnay",
        country: "France",
        region: "Burgundy",
        description: "Breaking the mold of the classics, this offering will surprise and undoubtedly get tongues wagging with the hints of coffee and tobacco in perfect alignment with more traditional notes. Sure to please the late-night crowd with the slight jolt of adrenaline it brings.",
        picture: "morizottes.jpg"
    },
    {
        name: "BUSUIOACA DE BOHOTIN",
        year: "2010",
        grapes: "Busuioaca de Bohotin",
        country: "Romania",
        region: "Bohotin",
        description: "The wine has a light red color. Its flavor resembles honeysuckle and ripe juicy peaches. The sweet taste sometimes has a barely perceptible almond like bitter aroma caused by the latent cyanide moiety.",
        picture: "busuioaca.jpg"
    },
    {
        name: "ARGIANO NON CONFUNDITUR",
        year: "2009",
        grapes: "Cabernet Sauvignon",
        country: "Italy",
        region: "Tuscany",
        description: "Like a symphony, this cabernet has a wide range of notes that will delight the taste buds and linger in the mind.",
        picture: "argiano.jpg"
    },
    {
        name: "DINASTIA VIVANCO ",
        year: "2008",
        grapes: "Tempranillo",
        country: "Spain",
        region: "Rioja",
        description: "Whether enjoying a fine cigar or a nicotine patch, don't pass up a taste of this hearty Rioja, both smooth and robust.",
        picture: "dinastia.jpg"
    },
    {
        name: "PETALOS BIERZO",
        year: "2009",
        grapes: "Mencia",
        country: "Spain",
        region: "Castilla y Leon",
        description: "For the first time, a blend of grapes from two different regions have been combined in an outrageous explosion of flavor that cannot be missed.",
        picture: "petalos.jpg"
    },
    {
        name: "SHAFER RED SHOULDER RANCH",
        year: "2009",
        grapes: "Chardonnay",
        country: "USA",
        region: "California",
        description: "Keep an eye out for this winery in coming years, as their chardonnays have reached the peak of perfection.",
        picture: "shafer.jpg"
    },
    {
        name: "PONZI",
        year: "2010",
        grapes: "Pinot Gris",
        country: "USA",
        region: "Oregon",
        description: "For those who appreciate the simpler pleasures in life, this light pinot grigio will blend perfectly with a light meal or as an after dinner drink.",
        picture: "ponzi.jpg"
    },
    {
        name: "HUGEL",
        year: "2010",
        grapes: "Pinot Gris",
        country: "France",
        region: "Alsace",
        description: "Fresh as new buds on a spring vine, this dewy offering is the finest of the new generation of pinot grigios.  Enjoy it with a friend and a crown of flowers for the ultimate wine tasting experience.",
        picture: "hugel.jpg"
    },
    {
        name: "FOUR VINES MAVERICK",
        year: "2011",
        grapes: "Zinfandel",
        country: "USA",
        region: "California",
        description: "o yourself a favor and have a bottle (or two) of this fine zinfandel on hand for your next romantic outing.  The only thing that can make this fine choice better is the company you share it with.",
        picture: "fourvines.jpg"
    },
    {
        name: "QUIVIRA DRY CREEK VALLEY",
        year: "2009",
        grapes: "Zinfandel",
        country: "USA",
        region: "California",
        description: "Rarely do you find a zinfandel this oakey from the Sonoma region. The vintners have gone to extremes to duplicate the classic flavors that brought high praise in the early '90s.",
        picture: "quivira.jpg"
    },
    {
        name: "CALERA 35TH ANNIVERSARY",
        year: "2010",
        grapes: "Pinot Noir",
        country: "USA",
        region: "California",
        description: "Fruity and bouncy, with a hint of spice, this pinot noir is an excellent candidate for best newcomer from Napa this year.",
        picture: "calera.jpg"
    },
    {
        name: "CHATEAU CARONNE STE GEMME",
        year: "2010",
        grapes: "Cabernet Sauvignon",
        country: "France",
        region: "Bordeaux",
        description: "Find a sommelier with a taste for chocolate and he's guaranteed to have this cabernet on his must-have list.",
        picture: "caronne.jpg"
    },
    {
        name: "MOMO MARLBOROUGH",
        year: "2010",
        grapes: "Sauvignon Blanc",
        country: "New Zealand",
        region: "South Island",
        description: "Best served chilled with melon or a nice salty prosciutto, this sauvignon blanc is a staple in every Italian kitchen, if not on their wine list.  Request the best, and you just may get it.",
        picture: "momo.jpg"
    },
    {
        name: "WATERBROOK",
        year: "2009",
        grapes: "Merlot",
        country: "USA",
        region: "Washington",
        description: "Legend has it the gods didn't share their ambrosia with mere mortals.  This merlot may be the closest we've ever come to a taste of heaven.",
        picture: "waterbrook.jpg"
    }];

  // Create the DB using [`dbCreate`](http://www.rethinkdb.com/api/#js:manipulating_databases-db_create):
  connection.run(r.dbCreate(dbConfig.db), function(result) {
    // Create the `wines` table using [`tableCreate`](http://www.rethinkdb.com/api/#js:manipulating_tables-table_create):
  	connection.run(r.db(dbConfig['db']).tableCreate('wines'), function(result) {
    	// We insert the sample data iif the table didn't exist:
			if (result === undefined) {
				connection.run(r.db(dbConfig['db']).table('wines').insert(wines), function(result) {
					debug("Inserted %s sample wines into table 'wines' in db '%s'", result['inserted'], dbConfig['db']);
					return false;
				})
			}
			return false;
    });
    return false;
  });
};

// ### Tips and Tricks
//
// #### Updating a document vs updating a set of documents in a single operation
//
// This app. implements a single document update using the
// chained `get(id).update(doc)` functions. You can update
// multiple documents in a single database roundtrip by
// firstly filtering the documents to be updated using [`filter`](http://www.rethinkdb.com/api/#js:selecting_data-filter)
// and then an [`update`](http://www.rethinkdb.com/api/#js:writing_data-update). 
//
// #### `update` vs `replace`
//
// ReQL provides multiple mutation operations: [`update`](http://www.rethinkdb.com/api/#js:writing_data-update)
// and [`replace`](http://www.rethinkdb.com/api/#js:writing_data-replace). Both can
// be used to modify one or multiple rows. Their behavior is different though:
//
// *   `update` will merge existing rows with the new values
// *   `replace` will completely replace the existing rows with the new values
