'use strict';

if(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'){
  require('dotenv').load();  
}

var _ = require('underscore');
var Promise = require('bluebird');
var listenerFactory = require('./lib/listenerFactory');
var log = require('blikk-logjs')('slack-notify-service-main');

if(!process.env.KAFKA_REST_ENDPOINT){
  log.error('You must set the KAFKA_REST_ENDPOINT environment variable.');
  process.exit(1);
}

// Greenlight Twitter Links 
// ==================================================

var listenerPromises = [];

listenerPromises.push(listenerFactory.createListenerAsync({
  pollInterval: 5000,
  topic: 'gl-twitter-links',
  slackWebhookUri: process.env.SLACK_WEBHOOK_LINKS_URI,
  transform: function(record){
    return {
      text: 'Found new content at <' + record.url +'>',
      unfurl_links: true,
      icon_emoji: ':page_facing_up:',
      username: 'Twitter Article Discovery'
    };
  }
}));

listenerPromises.push(listenerFactory.createListenerAsync({
  pollInterval: 15000,
  topic: 'gl-article-content',
  slackWebhookUri: process.env.SLACK_WEBHOOK_ARTICLES_URI,
  transform: function(record){
    return {
      text: 'I added a new article!',
      unfurl_links: false,
      icon_emoji: ':page_facing_up:',
      username: 'CMS Article Bot',
      attachments: [{
        author_name: record.author || record.site,
        title: record.title,
        title_link: record.url,
        text: record.description,
        image_url: record.image,
        color: '#e74c3c',
        fields: [
          { title: 'Site', value: record.site, short: true },
          { title: 'Date', value: record.date, short: true }
        ],
        unfurl_links: false
      }]
    };
  }
}));

Promise.all(listenerPromises).then(function(){
  // OK, wait...
}).catch(function(err){
  log.error({err: err});
  process.exit(1);
});

