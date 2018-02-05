const Promise = require('bluebird');
const debug = require('debug')('cpanel:domain');

function parseHostname(hostname, callback) {
  let domain, subdomain
  const chunks = hostname.split('.')
  const length = chunks.length

  if (length === 3) {
    subdomain = chunks[0]
    domain = `${chunks[1]}.${chunks[2]}`
  } else if(length === 2) {
    domain = hostname
  } else {
    return callback(`Invalid hostname: ${hostname}`)
  }

  callback(null, [domain, subdomain])
}

module.exports.addHostname = function (hostname) {
  debug('Adding hostname...', hostname)
  const self = this;

  return new Promise((resolve, reject) => {
    parseHostname(hostname, (error, [domain, subdomain]) => {
      if (error) {
        return reject(error)
      }

      self.api2('AddonDomain', 'listaddondomains', {})
        .then(res => {
          self.rejectIfError(res)

          if (res.cpanelresult.data.some(d => d.domain === domain)) {
            return
          }

          return self.api2('AddonDomain', 'addaddondomain', {
            dir: domain,
            newdomain: domain,
            subdomain: hostname.replace(/\./g, '')
          })
        })
        .then((data) => {
          self.rejectIfError(data)

          if (subdomain) {
            return self.api2('SubDomain', 'listsubdomains', {})
              .then(res => {
                self.rejectIfError(res)
                if (res.cpanelresult.data.some(d => d.domain === hostname && d.rootdomain === domain)) {
                  return
                }

                return self.api2('SubDomain', 'addsubdomain', {
                  domain: subdomain,
                  rootdomain: domain,
                  dir: hostname
                })
              })
          }
        })
        .then((data) => {
          self.rejectIfError(data)
          resolve()
        })
        .catch(reject)
    })
  })
}