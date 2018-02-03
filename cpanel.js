const qs = require('querystring')
const fetch = require('node-fetch')
const debug = require('debug')('cpanel')

function dibug(module, func, query = {}) {
    debug(`CALLING: ${module}::${func}`)
    debug(`VALUE: ${JSON.stringify(query, null, 2)}`)
}

function Client(endpoint, username, password) {
    this.endpoint = endpoint
    this.username = username
    this.password = password

    this.headers = {
        Authorization: 'Basic ' + new Buffer(username + ':' + password).toString('base64')
    }
}

Client.prototype.uapi = function (module, func, query = {}) {
    dibug(module, func, query)
    const params = qs.stringify(query);
    return fetch(`${this.endpoint}/execute/${module}/${func}?${params}`, {
      headers: this.headers
    })
    .then(res => res.json())
}

Client.prototype.api2 = function(module, func, query = {}) {
    dibug(module, func, query)
    const params = qs.stringify(Object.assign({
        cpanel_jsonapi_user: this.username,
        cpanel_jsonapi_module: module,
        cpanel_jsonapi_func: func,
        cpanel_jsonapi_apiversion: 2
      }, query));
    
      return fetch(`${this.endpoint}/json-api/cpanel?${params}`, {
        headers: this.headers
      })
      .then(res => res.json())
}

Client.createClient = function ({ endpoint, username, password }) {
    return new Client(endpoint, username, password)
}

Client.rejectIfError = function(data) {
    // api2 format
    if (data && data.cpanelresult && data.cpanelresult.error) {
        throw new Error(data.cpanelresult.error)
    }

    // uapi
    if (data && data.errors) {
        throw new Error(data.errors.join('. '))
    }   
}

Client.prototype.rejectIfError = Client.rejectIfError

module.exports = Client
