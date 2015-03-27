'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var KafkaRest = require('kafka-rest');
var slackClient = require('blikk-slack-notifier');
Promise.promisifyAll(slackClient);

var Listener = function(options){
  this.name = 'slack-' + options.topic + '-consumer';
  this.log = require('blikk-logjs')(this.name);

  this.pollInterval = options.pollInterval;
  this.topic = options.topic;
  this.consumerGroup = options.consumerGroup || 'slack-' + this.topic + '-consumers';
  this.consumerOptions = _.defaults(options.consumerOptions || {}, {
    format: 'avro',
    'auto.commit.enable': 'true'
  });
  
  this.slackWebhookUri = options.slackWebhookUri;
  this.transform = options.transform || function(x){ return x; };
  this.kafka = new KafkaRest({url: process.env.KAFKA_REST_ENDPOINT});
  
};

Listener.prototype.initStream = function() {
  var listener = this;
  return Promise.fromNode(function(callback){
    listener.kafka.consumer(listener.consumerGroup).join(listener.consumerOptions, callback);
  }).then(function(consumer){
    listener.log.info({consumer: consumer.raw}, 'Created kafka consumer');
    listener.consumer = consumer;
  });
};

Listener.prototype.processRecord = function(record){
  var listener = this;
  var transformedRecord = listener.transform(record);
  if(transformedRecord){
      slackClient.postAsync(listener.slackWebhookUri, transformedRecord)
      .catch(function(error){
        listener.log.error({err: error});
      });
  }
};

Listener.prototype.start = function() {
  var listener = this;
  listener.stream = listener.consumer.subscribe(listener.topic, {requestDelay: listener.pollInterval});
  listener.stream.on('read', function(records){
    _.forEach(_.pluck(records, 'value'), listener.processRecord.bind(listener));
  });
  listener.stream.on('error', function(error){
     listener.log.error({err: error});
  });
  this.log.info({topic: listener.topic}, 'Listening...');
};

Listener.prototype.stop = function() {
  this.consumer.shutdown();
};

var ListenerFactory = function(){};

ListenerFactory.prototype.createListener = function(options, callback){
  var listener = new Listener(options);
  listener.initStream().then(function(){
    listener.start();
    return callback(null, listener);
  }).catch(function(err){
    return callback(err, null);
  });
};

Promise.promisifyAll(ListenerFactory.prototype);

module.exports = new ListenerFactory();