// var assert = require("assert");
var assert = require('chai').assert
var _ = require('underscore');

var DevtoolsTelemetry = require('../index');
var dd = new DevtoolsTelemetry();

describe('devtools init', function() {
  it('tests initialization', function(done) {
    // var dd = new DevtoolsTelemetry();
    dd.init(function(r) {
      // assert(r);
      // assert.equal(r, true);

      // console.log(dd);
      // assert.typeOf(dd.map, 'array');
      done();
    });
  });
});

describe('devtools weekly channel usage', function() {
  it('test we get some usage', function(done) {
    dd.start(34);
    dd.init(function(r) {
      dd.getWeeklyChannelUsage('toolbox', function(result) {
        console.log(result);
        assert.typeOf(result.beta, 'array');
        assert.typeOf(result.beta[0], 'object');
        done();
      });
    });
  });
});

describe('devtools weekly tool usage', function() {
  it('test', function(done) {
    dd.start(34);
    dd.init(function(r) {
      dd.getWeeklyToolUsage('toolbox', function(result) {
        // console.log(result);
        var keys = _.keys(result);
        assert.equal(keys[0], 'More than 5 minutes');
        assert.equal(keys[1], 'More than 30 minutes');
        assert.typeOf(result[keys[0]], 'array');
        done();
      });
    });
  });
});


