'use strict';

var Promise = require('bluebird');
var confluentClient = require('confluent-kafka-client');
var slackClient = require('blikk-slack-notifier');
Promise.promisifyAll(slackClient);

Promise.promisifyAll(confluentClient.consumers);

var Listener = function(options){
  this.name = 'slack-' + options.topic + '-consumer';
  this.log = require('blikk-logjs')(this.name);

  this.pollInterval = options.pollInterval;
  this.topic = options.topic;
  this.consumerGroup = options.consumerGroup || 'slack-' + this.topic + '-consumers';
  this.consumerOptions = options.consumerOptions || {};
  
  this.slackWebhookUri = options.slackWebhookUri;
  this.transform = options.transform || function(x){ return x; };
  
};

Listener.prototype.initStream = function() {
  var listener = this;
  return confluentClient.consumers.createStreamingConsumerAsync(this.pollInterval, 
    this.topic, this.consumerGroup, this.consumerOptions).then(function(stream){
    listener.stream = stream;
    stream.on('data', function(record){
      slackClient.postAsync(listener.slackWebhookUri, listener.transform(record.value)).catch(function(error){
        listener.log.error({err: error});
      });
    });
    stream.on('error', function(error){
       listener.log.error({err: error});
    });
  });
};

Listener.prototype.start = function() {
  this.log.info('Listening to topic %s...', this.topic);
  this.stream.start();
};

Listener.prototype.stop = function() {
  this.stream.stop();
};

var ListenerFactory = function(){};

ListenerFactory.prototype.createListener = function(options, cb){
  var listener = new Listener(options);
  listener.initStream().then(function(){
    return cb(null, listener);
  }).catch(function(err){
    return cb(err, null);
  });
};

Promise.promisifyAll(ListenerFactory.prototype);

module.exports = new ListenerFactory();