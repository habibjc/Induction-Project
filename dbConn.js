import config from 'config'; // Import the config package

import knex from 'knex';

const dbConn = knex({
  client: 'mssql',
  connection: {
    server: config.get('database.host'), // Get database host from config
    user: config.get('database.user'), // Get database user from config
    password: config.get('database.password'), // Get database password from config
    database: config.get('database.database'), // Get database name from config
    port: config.get('database.port'), // Get database port from config
    options: {
      encrypt: config.get('database.encrypt'), // Get database encryption setting from config
    },
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './migrations',
  },
  debug:false, // Enable query logging
});

export default dbConn;
