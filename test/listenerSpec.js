'use strict';

process.env.LOG_NAME = 'slack-notify-service-test';

var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
// var expect = require('chai').expect;
var sinon = require('sinon');
var listenerFactory = require('../lib/listenerFactory');
var KafkaRest = require('kafka-rest');
var slackClient = require('blikk-slack-notifier');

describe('The listener', function(){

  var sandbox = sinon.sandbox.create();
  
  beforeEach(function(){
    sandbox.restore();
  });

  it('should create a new consumer Slack', function(done){
    
    var stream = new EventEmitter();
    sandbox.stub(KafkaRest.prototype, 'consumer', function(){
      var consumerObj = {};
      consumerObj.join = function(options, cb){
        var streamObj = {};
        streamObj.subscribe = function(topic, options) { return stream; };
        cb(null, streamObj);
      };
      return consumerObj;
    });

    sandbox.stub(slackClient, 'postAsync', function(webhookUri, data){
      if(data === 'DONE') { done(); }
      return Promise.resolve(true);
    });

    listenerFactory.createListenerAsync({
      pollInterval: 250,
      topic: 'test-topic',
      slackWebhookUri: 'TEST_WEBHOOK_URI'
    }).then(function(){
      stream.emit('read', [{value: 'DONE'}]);
    }).catch(function(err){
      done(err);
    });
  });


});