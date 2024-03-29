/**
 * This is the main server script that provides the API endpoints
 * The script uses the database helper in /src
 * The endpoints retrieve, update, and return data to the page handlebars files
 *
 * The API returns the front-end UI handlebars pages, or
 * Raw json if the client requests it with a query parameter ?raw=json
 */

// Utilities we need
const fs = require("fs");
const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

fastify.register(require('fastify-cors'), { origin: '*' });

// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// We use a module for handling database operations in /src
const data = require("./src/data.json");
const db = require("./src/" + data.database);

/**
 * Home route for the app
 *
 * Return the poll options from the database helper script
 * The home route may be called on remix in which case the db needs setup
 *
 * Client can request raw data using a query parameter
 */
fastify.get("/", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = request.query.raw ? {} : { seo: seo };

  // Get the available choices from the database
  const dogs = await db.getDogs();
  if (dogs) {
    params.dogs = dogs;
  }
  // Let the user know if there was a db error
  else params.error = data.errorMessage;

  // Check in case the data is empty or not setup yet
  if (dogs && dogs.length < 1)
    params.setup = data.setupMessage;

  // ADD PARAMS FROM README NEXT STEPS HERE

  // Send the page options or raw JSON data if the client requested it
  request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/index.hbs", params);
});

/**
 * Post route to process user vote
 *
 * Retrieve vote from body data
 * Send vote to database helper
 * Return updated list of votes
 */
fastify.post("/newDog", async (request, reply) => { 
  // We only send seo if the client is requesting the front-end ui
  let params = request.query.raw ? {} : { seo: seo },
      dogs;
  
  if (
    !request.body.key ||
    request.body.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    // Auth failed, return the log data plus a failed flag
    params.error = "La contraseña está mal";
  } else {
    if (request.body.nombre && request.body.edad && request.body.sexo && request.body.img) {
      dogs = await db.processDog(request.body.nombre, request.body.edad, request.body.sexo, request.body.img);
      if (dogs) {
        params.dogs = dogs;
      }
    }
  }
  // Return the info to the client
  reply.redirect("../");
});

/**
 * Post route to process user vote
 *
 * Retrieve vote from body data
 * Send vote to database helper
 * Return updated list of votes
 */
fastify.post("/editDog", async (request, reply) => { 
  // We only send seo if the client is requesting the front-end ui
  let params = request.query.raw ? {} : { seo: seo },
      dogs;
  
  if (
    !request.body.key ||
    request.body.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    // Auth failed, return the log data plus a failed flag
    params.error = "La contraseña está mal";
  } else {
    if (request.body.dogId && request.body.nombre && request.body.edad && request.body.sexo && request.body.img) {
      await db.editDog(request.body.dogId, request.body.nombre, request.body.edad, request.body.sexo, request.body.img);
    }
  }
  // Return the info to the client
  reply.redirect("../");
});

/**
 * Admin endpoint returns log of votes
 *
 * Send raw json or the admin handlebars page
 */
fastify.get("/logs", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  // Get the log history from the db
  params.optionHistory = await db.getLogs();

  // Let the user know if there's an error
  params.error = params.optionHistory ? null : data.errorMessage;

  // Send the log list
  request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/admin.hbs", params);
});

/**
 * Admin endpoint returns log of votes
 *
 * Send raw json or the admin handlebars page
 */
fastify.get("/perros", async (request, reply) => {
  let params = {};

  let dogs;

  dogs = await db.getDogs();
  if (dogs) {
    // We send the choices and numbers in parallel arrays
    params.dogs = dogs;
  }

  // Send the log list
  reply.send(params);
});

/**
 * User endpoint deletes a dog
 *
 * Send raw json or the admin handlebars page
 */
fastify.get("/delete", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  // Get the log history from the db
  let dogs;
  if (
    !request.query.key ||
    request.query.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.query.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    // Auth failed, return the log data plus a failed flag
    params.error = "La contraseña está mal";
  } else {
    if (request.query.id) {
      await db.deleteDog(request.query.id);
    }
  }
  

  // Send the log list
  request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/index.hbs", params);
});

/**
 * Admin endpoint to empty all logs
 *
 * Requires authorization (see setup instructions in README)
 * If auth fails, return a 401 and the log list
 * If auth is successful, empty the history
 */
fastify.post("/reset", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  /* 
  Authenticate the user request by checking against the env key variable
  - make sure we have a key in the env and body, and that they match
  */
  if (
    !request.body.key ||
    request.body.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    // Auth failed, return the log data plus a failed flag
    params.failed = "You entered invalid credentials!";

    // Get the log list
    params.optionHistory = await db.getLogs();
  } else {
    // We have a valid key and can clear the log
    params.optionHistory = await db.resetDb();

    // Check for errors - method would return false value
    params.error = params.optionHistory ? null : data.errorMessage;
  }

  // Send a 401 if auth failed, 200 otherwise
  const status = params.failed ? 401 : 200;
  // Send an unauthorized status code if the user credentials failed
  request.query.raw
    ? reply.status(status).send(params)
    : reply.status(status).view("/src/pages/admin.hbs", params);
});

// Run the server and report out to the logs
fastify.listen(process.env.PORT, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
