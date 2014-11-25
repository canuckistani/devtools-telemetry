var Telemetry = require('telemetry-js-node');
var _ = require('underscore');
var async = require('async');
var moment = require('moment');


// utilities
function formatDate(d) {
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + (d.getYear() + 1900);
}

/*
* Questions I would want to ask of telemetry:
*   opening of the toolbox over time in a given channel, eg join channels in a series
*   compare data from beta vs release vs aurora vs nightly for a specific measure
*/

var DevtoolsTelemetry = function() {
  var self = this;
  self.Telemetry = Telemetry;
  self.DevtoolsMeasures = {};
  self.DevtoolsModel = {};
  self.versions = false;

  self.init = function(callback) {
    self.Telemetry.init(function() {
      self.versions = self.Telemetry.versions();

      // console.log(self.versions);
      self._version_range = self.getVersionRange();
      self.buildWindows = self.generateBuildWindows();
      callback(true);
    });
  };

  self.generateBuildWindows = function() {
    var startNightly = _.first(self._version_range);
    var endNightly = _.last(self._version_range);
    var diff = (endNightly - startNightly)+1;
    var versions =  _.map(_.range(diff), function(i) {
      var n = startNightly+i, a = n-1, b = n-2, r = n-3;
      var out = {nightly: 'nightly/'+n};
      if (b >= startNightly) {
        out.beta = 'beta/'+b;
      }
      if (a >= startNightly) {
        out.aurora = 'aurora/'+a;
      }
      // if (r >= startNightly) {
      //   out['release'] = 'release/'+r
      // }
      return out;
    });
    return versions;
  }

  self.getProbes = function(version, callback) {
    var devtools_measures = [];
    self.Telemetry.measures(version, function(measures) {
      var probe_names = Object.keys(measures);
      var devtools_keys = probe_names.filter(function(name) {
        return (name.indexOf('DEVTOOLS_') !== -1);
      });
      var out = {};
      devtools_keys.forEach(function(key) {
        out[key] = measures[key];
      });
      self.DevtoolsMeasures = out;
      callback(out);
    });
  };


  // a map of all the measures, by tool
  self.map = { devtools: {} };

  // generate a model of the tools measures
  self.generateModel = function(version, callback) {
    self.Telemetry.measures(version, function(measures) {
      var probe_names = Object.keys(measures);

      var devtools_keys = probe_names.filter(function(name) {
        return (name.indexOf('DEVTOOLS_') !== -1);
      });

      var _measures = {};
      _.each(devtools_keys, function(key) {
        _measures[key] = measures[key];

        var parts = key.split('_', 2); var tool = parts[1].toLoweCase();
        if (!self.map.devtools[tool]) {
          self.map.devtools[tool] = [];
        }
        measure.name = name;
        self.map.devtools[tool].push(measure);
      });
      callback(self.map);
    });
  };

  self._latestVersionMap = {
    release: "27",
    beta: "28",
    aurora: "29",
    nightly: "30"
  };

  self.getMeasuresByChannel = function(measureName, channel, versions, callback) {
    var length = versions.length, results = [], count = 0;
    _.each(versions, function(item) {
      var target = channel+'/'+item;

      self.Telemetry.loadEvolutionOverBuilds(target,
        measureName,
        function(histogram) {
          count++;
          results.push(histogram);
          if (count === length) {
            callback(result);
          }
      });
    });
  };

  self.getUsageGraph = function(version, name) {
    self.Telemetry.loadEvolutionOverBuilds(version, name, function(evolution) {
      var results = {
        yes: 0,
        no: 0,
        total: 0
      };
      var _i = 0;
      evolution.each(function(date, histogram, index) {
        _i++;

        histogram.each(function(count, start, end, index) {
          if (index === 0) {
            results.no += count;
            results.total += (count);
          }
          else if(index === 1) {
            results.yes += count;
            results.total += (count);
          }
        });
      });

      var sorted = {};
      _.each(results, function(weeks, key) {
        var _sorted = _.sortBy(weeks, function(week, strDate) {

          var i = moment(strDate, 'MM/DD/YYYY').unix();
          console.log(i);
          return i;
        });
        sorted[key] = _sorted;
      });
      callback(sorted);
    });
  };

  self.isInRange = function(range, start, end) {
    if (start >= range.start && end <= range.end) {
        return true;
    }
    return false;
  }

  self.Toolmap = {
    'Toolbox': {
      'time': 'DEVTOOLS_TOOLBOX_TIME_ACTIVE_SECONDS'
    },
    'Inspector': {
      'flag': 'DEVTOOLS_INSPECTOR_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_INSPECTOR_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_INSPECTOR_OPENED_BOOLEAN'
    },
    'Web Console': {
      'flag': 'DEVTOOLS_WEBCONSOLE_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_WEBCONSOLE_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_WEBCONSOLE_OPENED_BOOLEAN'
    },
    'Net Monitor': {
      'flag': 'DEVTOOLS_NETMONITOR_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_NETMONITOR_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_NETMONITOR_OPENED_BOOLEAN'
    },
    'Responsive Design': {
      'flag': 'DEVTOOLS_RESPONSIVE_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_RESPONSIVE_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_RESPONSIVE_OPENED_BOOLEAN'
    },
    'Style Editor': {
      'flag': 'DEVTOOLS_STYLEEDITOR_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_STYLEEDITOR_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_STYLEEDITOR_OPENED_BOOLEAN'
    },
    'Debugger': {
      'flag': 'DEVTOOLS_JSDEBUGGER_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_JSDEBUGGER_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_JSDEBUGGER_OPENED_BOOLEAN'
    },
    'Tilt': {
      'flag': 'DEVTOOLS_TILT_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_TILT_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_TILT_OPENED_BOOLEAN'
    },
    'Profiler': {
      'flag': 'DEVTOOLS_JSPROFILER_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_JSPROFILER_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_JSPROFILER_OPENED_BOOLEAN'
    },
    'Paint Flashing': {
      'flag': 'DEVTOOLS_PAINTFLASHING_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_PAINTFLASHING_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_PAINTFLASHING_OPENED_BOOLEAN'
    },
    'Scratchpad': {
      'flag': 'DEVTOOLS_SCRATCHPAD_OPENED_PER_USER_FLAG',
      'time': 'DEVTOOLS_SCRATCHPAD_TIME_ACTIVE_SECONDS',
      'bool': 'DEVTOOLS_SCRATCHPAD_OPENED_BOOLEAN'
    }
  };

  self.Toolnames = _.keys(self.Toolmap);

  self.getBucketsForTool = function(measure, version, ranges, callback) {
    var results = _.map(_.range(ranges.length), function() { return 0; });
    var subs = 0;
    self.Telemetry.loadEvolutionOverBuilds(version, measure, function(evolution) {
      var result = {};
      evolution.each(function(date, histogram, index) {
        subs += histogram.submissions();
        histogram.each(function(count, start, end, index) {
          _.each(ranges, function(range, i) {
            if (self.isInRange(range, start, end)) {
              results[i] += count;
            }
          });
        });
      });
      callback({results: results, submissions: subs});
    });

  };

  self.getVersionRange = function() {
    return _.compact(_.unique(_.map(self.versions, function(v) {
      var _v = parseInt(v.split('/').pop(), 10);
      if(/^[\d]+$/.test(_v) && _v >= 24 && _v <= 50) {
        return _v;
      }
    }))).sort();
  };

  self.getDailyToolUsage = function(toolName, callback) {
    var collected = {};
    // in this case 'window' is an array with telemetry-friendly version strings eg aurora/29
    // loop through the windows
    var functions = _.map(self.buildWindows, function(win) {
      var outer = _.map(win, function(version, channel) {
        var measures = self.Toolmap[toolName];
        var inner = _.map(measures, function(m) {
          return function(callback) {
            self.Telemetry.loadEvolutionOverTime(version, m, function(evolution) {
              var mapped = evolution.map(function (date, histogram, index) {
                var _strDate = formatDate(date);
                return histogram.map(function(count, start, end, index) {
                  // console.log(_strDate);
                  return {
                    strDate: _strDate,
                    count: count,
                    start: start,
                    end: end,
                    index: index,
                    date: date,
                    measure: m
                  };
                });
              });
              // console.log(mapped);
              callback(null, mapped);
            });
          };
        });
        return inner;
      });
      return outer;
    });

    functions = _.flatten(functions);

    async.parallel(functions, function(err, results) {
      if (err) throw err;

      var flat_results = _.flatten(results);
      var dateGroups = {};
      var tplObject = _.object(_.pluck(self.ranges, 'desc'), [0, 0]);
      console.log(flat_results.length);
      _.each(self.ranges, function(r) {
        _.each(flat_results, function(result) {
          if (self.isInRange(r, result.start, result.end) && result.count > 0) {
            if (!dateGroups[result.strDate]) {
              dateGroups[result.strDate] = _.object(_.pluck(self.ranges, 'desc'), [0, 0]);
              dateGroups[result.strDate].strDate = result.strDate;
              dateGroups[result.strDate].timestamp = moment(result.strDate, 'MM/DD/YYYY').unix();
            }
            dateGroups[result.strDate][r.desc] += result.count;
          }
        });
      });

      dateGroups = _.sortBy(dateGroups, 'timestamp');

      callback(dateGroups);
      // var days = {};
      // _.each(dateGroups, function(d, date) {
      //   if (!days)
      // })


    });
  };

  self._getFunctionsFromWindows = function(toolName) {
    var functions = _.map(self.buildWindows, function(win) {
      var outer = _.map(win, function(version, channel) {
        var measures = self.Toolmap[toolName];
        var inner = _.map(measures, function(m) {
          return function(callback) {
            self.Telemetry.loadEvolutionOverTime(version, m, function(evolution) {
              var mapped = evolution.map(function (date, histogram, index) {
                var _strDate = formatDate(date);
                return histogram.map(function(count, start, end, index) {
                  return {
                    strDate: _strDate,
                    count: count,
                    start: start,
                    end: end,
                    index: index,
                    date: date,
                    measure: m,
                    channel: channel
                  };
                });
              });
              // console.log(mapped);
              callback(null, mapped);
            });
          };
        });
        return inner;
      });
      return outer;
    });
    return _.flatten(functions);
  };

  self.getWeeklyToolUsage = function(toolName, callback) {
    var collected = {};
    // in this case 'window' is an array with telemetry-friendly version strings eg aurora/29
    // loop through the windows
    var functions = self._getFunctionsFromWindows(toolName);

    async.parallel(functions, function(err, results) {
      if (err) throw err;

      var flat_results = _.flatten(results);
      var dateGroups = {};
      _.each(flat_results, function(result) {
        if (!dateGroups[result.strDate]) {
          dateGroups[result.strDate] = [];
        }
        dateGroups[result.strDate].push(result);
      });

      var graph = {};
      // console.log();
      var tplObject = _.object(_.pluck(self.ranges, 'desc'), [{}, {}]);
      var mapped = {};

      _.each(dateGroups, function(counts, date) {
        var _m = moment(date);
        var _year = _m.year();
        var _weeks = _m.weeks();

        var strWeek = _m.clone().startOf('week').format('MM/DD/YYYY');

        if (!dateGroups['strWeek']) {
          dateGroups['strWeek'] = tplObject;
        }

        _.each(self.ranges, function(r) {
          _.each(counts, function(count) {
            if (self.isInRange(r, count.start, count.end)) {
              var desc = r.desc;
              if (!mapped[desc]) {
                mapped[desc] = {};
              }

              if (!mapped[desc][strWeek]) {
                mapped[desc][strWeek] = {
                  count: count.count,
                  week: strWeek,
                  _intWeek: _weeks
                };
              }
              else {
                mapped[desc][strWeek].count += count.count;
              }
            }
          });
        });
      });
      var sorted = {};
      _.each(mapped, function(weeks, key) {
        var _sorted = _.sortBy(weeks, function(week, strDate) {
          return moment(strDate, 'MM/DD/YYYY').unix();
        });
        // we never want the current week.
        // _sorted = _.initial(_sorted);
        sorted[key] = _sorted;
      });
      callback(sorted);
    });
  };

  self.getWeeklyChannelUsage = function(toolName, callback) {
    var functions = self._getFunctionsFromWindows(toolName);
    // do stuff
    async.parallel(functions, function(err, results) {
      if (err) throw err;

      var flat_results = _.flatten(results);
      var dateGroups = {};
      _.each(flat_results, function(result) {
        if (!dateGroups[result.strDate]) {
          dateGroups[result.strDate] = [];
        }
        dateGroups[result.strDate].push(result);
      });

      var graph = {};
      // console.log();
      var tplObject = _.object(['beta', 'aurora', 'nightly'], [{}, {}, {}]);
      var mapped = {};

      _.each(dateGroups, function(counts, date) {
        var _m = moment(date);
        var _year = _m.year();
        var _weeks = _m.weeks();
        var strWeek = _m.clone().startOf('week').format('MM/DD/YYYY');

        if (!dateGroups['strWeek']) {
          dateGroups['strWeek'] = tplObject;
        }

        var overFiveRange = self.ranges[0];

        _.each(counts, function(count) {
          if (self.isInRange(overFiveRange, count.start, count.end)) {
            if (!mapped[count.channel]) {
              mapped[count.channel] = {};
            }

            if (!mapped[count.channel][strWeek]) {
              mapped[count.channel][strWeek] = {
                count: count.count,
                week: strWeek,
                _intWeek: _weeks
              };
            }
            else {
              mapped[count.channel][strWeek].count += count.count;
            }
          }
        });
      });

      var sorted = {};
      _.each(mapped, function(weeks, key) {
        var _sorted = _.sortBy(weeks, function(week, strDate) {
          return moment(strDate, 'MM/DD/YYYY').unix();
        });
        sorted[key] = _sorted;
      });
      callback(sorted);
    });
  };



  self.ranges = [{
    start: 300,
    end: Infinity,
    desc: "More than 5 minutes"
  },
  {
    start:1800,
    end:Infinity,
    desc: "More than 30 minutes"
  }];

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = DevtoolsTelemetry;
}
