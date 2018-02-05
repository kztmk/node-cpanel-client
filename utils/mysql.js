const Promise = require('bluebird');
const debug = require('debug')('cpanel:mysql');

module.exports.createDatabase = function (db_name, db_user, db_password) {
  debug('Creating database...')
  const self = this;

  return Promise.all([
    self.uapi('Mysql', 'create_database', {
      name: `${self.username}_${db_name}`
    }),
    self.uapi('Mysql', 'create_user', {
      name: `${self.username}_${db_user}`,
      password: db_password
    })
  ])
    .then(([d1, d2]) => {
      // ignore errors
      // client.checkError(data)
      return self.uapi('Mysql', 'set_privileges_on_database', {
        user: `${self.username}_${db_user}`,
        database: `${self.username}_${db_name}`,
        privileges: 'ALL PRIVILEGES'
      })
    })
}