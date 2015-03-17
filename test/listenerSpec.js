'use strict';

require('dotenv').load();
var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
// var expect = require('chai').expect;
var sinon = require('sinon');
var listenerFactory = require('../lib/listenerFactory');
var confluentClient = require('confluent-kafka-client');
var slackClient = require('blikk-slack-notifier');

describe('The listener', function(){

  var sandbox = sinon.sandbox.create();
  
  beforeEach(function(){
    sandbox.restore();
  });

  it('should create a new consumer Slack', function(done){
    var stream = new EventEmitter();
    sandbox.stub(confluentClient.consumers, 'createStreamingConsumerAsync', function(){
      return Promise.resolve(stream);
    });
    listenerFactory.createListenerAsync({
      pollInterval: 250,
      topic: 'test-topic',
      slackWebhookUri: 'TEST_WEBHOOK_URI'
    }).then(function(listener){
      sandbox.stub(slackClient, 'postAsync', function(webhookUri, data){
        if(data === 'DONE') {
          done();
          Promise.resolve(true);
        }
        return Promise.reject();
      });
      stream.emit('data', 'DONE');
    });
  });


});