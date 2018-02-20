//                        \│/  ╦ ╦╔═╗╦═╗╔╗╔╦╔╗╔╔═╗  \│/
//      ─────────────────── ─  ║║║╠═╣╠╦╝║║║║║║║║ ╦  ─ ───────────────────
//                        /│\  ╚╩╝╩ ╩╩╚═╝╚╝╩╝╚╝╚═╝  /│\
//      ┬ ┬┌┐┌┌┬┐┌─┐┌─┐┬ ┬┌┬┐┌─┐┌┐┌┌┬┐┌─┐┌┬┐  ┌─┐┌─┐┬┌─┐  ┬┌┐┌  ┬ ┬┌─┐┌─┐
//      │ ││││ │││ ││  │ ││││├┤ │││ │ ├┤  ││  ├─┤├─┘│└─┐  ││││  │ │└─┐├┤
//      └─┘┘└┘─┴┘└─┘└─┘└─┘┴ ┴└─┘┘└┘ ┴ └─┘─┴┘  ┴ ┴┴  ┴└─┘  ┴┘└┘  └─┘└─┘└─┘
// ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
// WARNING: THIS HOOK USES PRIVATE, UNDOCUMENTED APIs THAT COULD CHANGE AT ANY TIME
// ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
// This hook uses an undocumented, private Sails core method, you should not copy
// or reuse code because future releases of Sails--even patch releases--may cause
// it to stop functioning, use on your own consideration on production environments!

var _ = require('lodash');
var fs = require('fs');
var url = require('url');
var path = require('path');
var chalk = require('chalk');
var yaml = require('js-yaml');
var options = {};
var descriptor = {};
var setDefaultUrl = setDefaultUrl;

function setDefaultUrl(swaggerJSONUrl, swaggerUIPath) {

  var path = swaggerUIPath + '/index.html';
  var index = fs.readFileSync(path, 'utf-8');
  var newIndx = index.replace(
    'http://petstore.swagger.io/v2/swagger.json',
    swaggerJSONUrl
  );
  fs.writeFileSync(path, newIndx, 'utf-8');
}

// Read from yml file
function readYml(file, fn) {

  var m;
  var api = {};
  var resource = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
  var paths = Object.keys(resource.paths);
  _.each(paths, function(path) {
    if (options.apiPrefix && path.indexOf(options.apiPrefix) === 0){
        path = path.replace(options.apiPrefix, "");
    }
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

function waterlineModelParser(attributes) {

  var attrs = {};

  _.each(attributes, function(val, key) {
    attrs[key] = {
      type: _.capitalize(val.type)
    };
  });

  return attrs;
}

function generateModels(list) {

  descriptor.definitions = {};

  _.each(list.models, function(value, key){
    descriptor.definitions[_.capitalize(key)] = value.schema || {
      type: "object",
      properties: waterlineModelParser(value._attributes)
    };
  });

  return;
}

function sailsGenerate(opts) {

  descriptor.paths = {};

  var matches;
  var exclude = [
    'csrfToken',
    'csrftoken',
    '__getcookie'
  ];
  // Regex to check if the route is...a regex.
  var regExRoute = /^\/([^\/]*).*$/;

  _.each(Object.keys(opts.routes), function(method){
    _.each(opts.routes[method], function(route) {
      var path = route.path;
      if (options.apiPrefix && path.indexOf(options.apiPrefix) === 0){
          path = path.replace(options.apiPrefix,"");
      }

      if(path != '/*') {

        // Perform the check
        matches = path.match(regExRoute);

        if(matches[1].length) {

          //console.log(matches[1]);
          if(exclude.indexOf(matches[1]) >= 0) {
            return;
          }



          descriptor.paths[path] = descriptor.paths[path] || {};
          descriptor.paths[path][route.method] = {
            description: path,
            tags: [_.capitalize(matches[1])]
          }
        }
      }
    });
  });

  generateModels(opts);
  // generate JSON with additional YML files
  generate(options);
};

// Generate Swagger documents
function generate(opt) {

  var jsonPath;

  if (!opt) {
    throw new Error('\'option\' is required.');
  }

  if (!opt.basePath) {
     throw new Error('\'basePath\' is required.');
  }

  descriptor.basePath = "/" + (opt.apiPrefix) ? opt.apiPrefix : '';
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

    jsonPath = url.parse(opt.basePath + opt.swaggerJSON).path
    console.log(
      chalk.blue('Swagger info: '),
      chalk.gray('-----------------------------------------------')
    );
    console.log(
      chalk.blue('basePath + swaggerJSON: '),
      chalk.yellow(opt.basePath + opt.swaggerJSON)
    );
    console.log(
      chalk.blue('parsed path to json file: '),
      chalk.yellow(jsonPath)
    );
    if(jsonPath.lastIndexOf('//') !== -1) {
      console.log(
        chalk.red('veriry provided options, there is an unused `//` in the json path')
      );
    }
    console.log(
      chalk.blue('Swagger info: '),
      chalk.gray('-----------------------------------------------')
    );

    opt.fullSwaggerJSONPath = jsonPath;
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

exports.descriptor = descriptor;
exports.sailsGenerate = sailsGenerate;


/**
 * Express middleware
 * @api    public
 * @param  {Object} app
 * @param  {Object} opt
 * @return {Function}
 */
exports.init = function (express, app, opt) {

  var swHandler;
  var swaggerURL;
  var swaggerUI;

  options = opt || {};

  // get external assets for the UI from
  // real swagger-ui package
  app.use(
    options.swaggerURL,
    express.static(path.join(
      __dirname,
      '..',
      'swagger-ui/dist'
    ))
  );

  // Extend swagger ui with custom assets or not
  if(options && options.custom && options.custom.folder) {
    app.use(
      options.swaggerURL,
      express.static(options.custom.folder)
    );
  }

  // define main UI files (the custom index file)
  swaggerUI = path.join(
    __dirname,
    '..',
    'swagger-ui/dist'
  );

  // Serve up the index file asset for the swagger ui
  swHandler = express.static(swaggerUI)

  setDefaultUrl(opt.basePath + opt.swaggerJSON, swaggerUI);

  // Serve up swagger ui interface.
  swaggerURL = new RegExp('^'+ opt.swaggerURL +'(\/.*)?$');

  app.get(swaggerURL, function (req, res, next) {

    // express static barfs on root url w/o trailing slash
    if (req.url === opt.swaggerURL) {
      res.writeHead(302, { 'Location' : req.url + '/' });
      res.end();
      return;
    }

    // take off leading /swagger so that
    // connect locates file correctly
    req.url = req.url.substr(opt.swaggerURL.length);
    return swHandler(req, res, next);
  });

  return function (req, res, next) {

    var match;
    var regex = new RegExp('^' + opt.fullSwaggerJSONPath +'(\/.*)?$');

    match = regex.exec(req.path);

    if (match) {
      res.set({
        'Access-Control-Allow-Origin': "*"
      });
      return res.json(_.clone(descriptor));
    }

    return next();
  };
};
