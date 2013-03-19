var fs = require('fs'),
  spawn = require('child_process').spawn,
  backend = require('./backend');

var replace = function(params, callback){
  var p = spawn(__dirname + '/node_modules/.bin/replace', [params.regex, params.value, params.file]);
  p.on('exit', function(code){
    callback();
  });
};

module.exports = function(params){
  backend = backend(params);
  var rust = {
    setHostName:function(host, callback){
      var ops = {
        regex:'http, (.+)"',
        value:'http, [ {"' + host + '"',
        file:params.config
      };
      replace(ops, callback);
    },
    setHTTPPort:function(port, callback){
      var ops = {
        regex:'http, (.+), (.+) }',
        value:'http, $1, ' + port + ' }',
        file:params.config
      };
      replace(ops, callback);
    },
    setHandoffPort:function(port, callback){
      var ops = {
        regex:'handoff_port,(.+)}',
        value:'handoff_port, ' + port + ' }',
        file:params.config
      };
      replace(ops, callback);
    },
    setPBIP:function(host, callback){
      replace({
        regex:'pb_ip,(.+)}',
        value:'pb_ip, "' + host + '" }',
        file:params.config
      }, callback);
    },
    setPBPort:function(port, callback){
      replace({
        regex:'pb_port,(.+)}',
        value:'pb_port, ' + port + ' }',
        file:params.config
      }, callback);
    },
    disablePB:function(callback){
      replace({
        regex:'(.+){pb_ip',
        value:'$1% {pb_ip',
        file:params.config
      }, callback);
    },
    backend:backend,
    getSearch:function(callback){
      fs.readFile(params.config, function(err, blob){
        blob.toString().replace(/riak_search,\s+\[\s.+\n\s+{enabled,(.+)}/, function(r, search){
          if (typeof(search) === 'string'){
            search = search.trim() === 'true' ? true : false;
          }
          callback(null, search);
        });
      });
    },
    setSearch:function(enabled, callback){
      fs.readFile(params.config, function(err, blob){
        blob.toString().replace(/riak_search,(\s+\[\s.+\n\s+){enabled,(.+)}/, function(r, c, s){
          var buildString = r.replace(s.trim(), enabled);
          fs.writeFile(params.config, blob.toString().replace(r, buildString), function(err){
            callback(err);
          });
        });
      });
    }
  };
  return rust;
};
