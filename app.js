'use strict';

require('dotenv').load();
var confluentClient = require('confluent-kafka-client');
var listenerFactory = require('./lib/listenerFactory');
var log = require('blikk-logjs');

if(!process.env.CONFLUENT_ENDPOINT){
  log.error('You must set the CONFLUENT_ENDPOINT environment variable.');
  process.exit(1);
}
confluentClient.setHost(process.env.CONFLUENT_ENDPOINT);

// Greenlight Twitter Links 
// ==================================================

listenerFactory.createListener({
  pollInterval: 1000,
  topic: 'gl-twitter-links',
  slackWebhookUri: process.env.GL_TWITTER_LINKS_SLACK_WEBHOOK_URI,
  transform: function(record){
    return {
      text: 'Found new content at <' + record.url +'>',
      unfurl_links: true,
      icon_emoji: ':page_facing_up:',
      username: 'Twitter Article Discovery'
    };
  }
});