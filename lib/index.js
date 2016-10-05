var _ = require('lodash');
var fs = require('fs');
var url = require('url');
var yaml = require('js-yaml');
var descriptor = {};
var options = {};

/**
 * Read from yml file
 * @api    private
 * @param  {String}   file
 * @param  {Function} fn
 */
function readYml(file, fn) {

  var m;
  var api = {};
  var paths = Object.keys(resource.paths);
  var resource = yaml.safeLoad(fs.readFileSync(file, 'utf8'));

  _.each(paths, function(path) {

    api.resourcePath = path;
    api.description = resource.description || "";
    descriptor.paths[path] = resource.paths[path];

    // append definitions
    if (descriptor.definitions && Object.keys(descriptor.definitions).length) {
      m = _.merge(descriptor.definitions, resource.definitions);
      descriptor.definitions = m;
    } else {
      descriptor.definitions = resource.definitions;
    }
  });

  fn();
}

function generateModels(list) {

  descriptor.definitions = {};

  _.each(list.models, function(value, key){
    descriptor.definitions[_.capitalize(key)] = {
      type: "object",
      properties: waterlineModelParser(value._attributes)
    };
  });

  return;
}

function sailsGenerate(opts) {

  var matches;
  var exclude = [
    'csrfToken',
    'csrftoken',
    '__getcookie'
  ];
  // Regex to check if the route is...a regex.
  var regExRoute = /^\/([^\/]*).*$/;

  //descriptor.defitions
  descriptor.paths = {};

  _.each(Object.keys(opts.routes), function(method){
    _.each(opts.routes[method], function(route) {
      if(route.path != '/*') {

        // Perform the check
        matches = route.path.match(regExRoute);

        if(matches[1].length) {

          //console.log(matches[1]);
          if(exclude.indexOf(matches[1]) >= 0) {
            return;
          }

          if(!descriptor.paths[route.path]) {
            descriptor.paths[route.path] = {};
          }

          descriptor.paths[route.path][route.method] = {
            description: route.path,
            tags: [_.capitalize(matches[1])]
          }
        }
      }
    });
  });

  generateModels(opts);
  // generate JSON with additional YML files
  generate(options);
}

function waterlineModelParser(attributes) {

  var attrs = {};

  _.each(attributes, function(val, key) {
    attrs[key] = {
      type: _.capitalize(val.type)
    };
  });

  return attrs;
}

/**
 * Generate Swagger documents
 * @api    private
 * @param  {Object} opt
 */
function generate(opt) {

  if (!opt) {
    throw new Error('\'option\' is required.');
  }

  if (!opt.basePath) {
     throw new Error('\'basePath\' is required.');
  }

  descriptor.basePath = "/";
  descriptor.apiVersion = (opt.apiVersion) ? opt.apiVersion :
                                             '1.0';
  descriptor.swagger = (opt.swaggerVersion) ? opt.swaggerVersion :
                                              '1.0';

  if(opt.info) {
    descriptor.info = opt.info;
  }

  opt.apiVersion = descriptor.apiVersion;
  opt.swagger = descriptor.swaggerVersion;

  if (!opt.fullSwaggerJSONPath) {
    opt.fullSwaggerJSONPath = url.parse(opt.basePath + opt.swaggerJSON).path;
  }

  if (opt.apis) {
    opt.apis.forEach(function (api) {
      readYml(api, function (err) {
        if (err) {
          throw err;
        }
      });
    });
  }
}

var setDefaultUrl = function(swaggerJSONUrl, swaggerUIPath) {
  var path = swaggerUIPath + '/index.html';
  var index = fs.readFileSync(path, 'utf-8');
  var newIndx = index.replace('http://petstore.swagger.io/v2/swagger.json', swaggerJSONUrl )
  fs.writeFileSync(path, newIndx, 'utf-8');
}

/**
 * Express middleware
 * @api    public
 * @param  {Object} app
 * @param  {Object} opt
 * @return {Function}
 */
exports.init = function (express, app, opt) {

  var appUrl sails && sails.config ? sails.config.appUrl
                                   // flat version of node
                                   : __dirname + '/../../..';
  options = opt || {};

  var swaggerUI = appUrl + '/node_modules/swagger-ui/dist';
  // Serve up swagger ui static assets
  var swHandler = express.static(swaggerUI);
  setDefaultUrl(opt.basePath+opt.swaggerJSON, swaggerUI);

  // Serve up swagger ui interface.
  var swaggerURL = new RegExp('^'+ opt.swaggerURL +'(\/.*)?$');

  app.get(swaggerURL, function (req, res, next) {
    if (req.url === opt.swaggerURL) {
      // express static barfs on root url w/o trailing slash
      res.writeHead(302, { 'Location' : req.url + '/' });
      res.end();
      return;
    }

    // take off leading /swagger so that connect locates file correctly
    req.url = req.url.substr(opt.swaggerURL.length);
    return swHandler(req, res, next);
  });

  return function (req, res, next) {
    var match, result;
    var regex = new RegExp('^'+ opt.fullSwaggerJSONPath +'(\/.*)?$');

    match = regex.exec(req.path);

    if (match) {
      result = _.clone(descriptor);
      return res.json(result);
    }
    return next();
  };
};

exports.descriptor = descriptor;
exports.sailsGenerate = sailsGenerate;
