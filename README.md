# Refugio San Gregorio Dashboard de adopción

## What's in this project?

← `README.md`: That’s this file, where you can tell people what your cool website does and how you built it.

← `package.json`: The NPM packages for your project's dependencies.

← `.env`: The environment is cleared when you initially remix the project, but you will add a new env variable value when you follow the steps in `TODO.md` to set up an admin key.

### Server and database

← `server.js`: The Node.js server script for your new site. The JavaScript defines the endpoints in the site API. The API processes requests, connects to the database using the `sqlite` script in `src`, and sends info back to the client (the web pages that make up the app user interface, built using the Handlebars templates in `src/pages`).

← `/src/sqlite.js`: The database script handles setting up and connecting to the SQLite database. The `server.js` API endpoints call the functions in the database script to manage the data.

← `/src/data.json`: The data config file includes the database manager script–`server.js` reads the `database` property to import the correct script.

When the app runs, the scripts build the database:

← `.data/choices.db`: Your database is created and placed in the `.data` folder, a hidden directory whose contents aren’t copied when a project is remixed. You can see the contents of `.data` in the console by selecting __Tools__ >  __Logs__.

### User interface

← `public/style.css`: The style rules that define the site appearance.

← `src/pages`: The handlebars files that make up the site user interface. The API in `server.js` sends data to these templates to include in the HTML.

← `src/pages/index.hbs`: The site homepage presents a form when the user first visits. When the visitor submits a preference through the form, the app calls the `POST` endpoint `/`, passing the user selection. The `server.js` endpoint updates the database and returns the user choices submitted so far, which the page presents in a chart (using [Chart.js](https://www.chartjs.org/docs/)–you can see the code in the page `head`).

← `src/pages/admin.hbs`: The admin page presents a table displaying the log of most recent picks. You can clear the list by setting up your admin key (see `TODO.md`). If the user attempts to clear the list without a valid key, the page will present the log again.

← `src/seo.json`: When you're ready to share your new site or add a custom domain, change SEO/meta settings in here.
