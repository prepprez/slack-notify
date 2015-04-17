'use strict';

var _ = require('lodash');
var log = require('blikk-logjs')('content-change-transformer');

var ContentChangeTransformer = function(){};

ContentChangeTransformer.prototype.transform = function(event) {
  if(event.event === 'ARTICLE_ADDED'){
    log.info('posting ARTICLE_ADDED event');
    return this.transformArticleAddedEvent(event);
  } else if (event.event === 'CONTENT_PIECE_ADDED') {
    // Don't handle content piece events -> Too much noise
    return null;
  } else if (_.includes(event.event, 'ADDED')) {
    return this.handleContentAddedEvent(event);
  } else if (_.includes(event.event, 'UPDATED')) {
    return this.handleContentUpdatedEvent(event);
  } else if (_.includes(event.event, 'DELETED')) {
    return this.handleContentDeletedEvent(event);    
  } else {
    return null;
  }
};

ContentChangeTransformer.prototype.transformArticleAddedEvent = function(event) {
  var record = JSON.parse(event.data).newRecord;
  return {
    text: event.description,
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
};

ContentChangeTransformer.prototype.handleContentAddedEvent = function(event){
  var newRecord = JSON.parse(event.data).newRecord;
  var newRecordFiltered = _.omit(newRecord, 'updatedAt', 'updatedBy', 'createdAt', 'createdBy', '_v', '_id');
  var fields = _.filter(_.map(newRecordFiltered, function(value, key){
    var valueString = null;
    if(_.isArray(value) && _.isEmpty(value)){
      valueString = value.join(', ');
    } else if (_.isObject(value) && _.isEmpty(value)){
      valueString = JSON.stringify(value);
    } else if (_.isString(value) || _.isNumber(value) || _.isDate(value) || _.isBoolean(value)){
      valueString = value;
    }
    return { title: key, value: valueString, short: true};
  }), _.identity);
  return {
    text: event.description,
    unfurl_links: false,
    username: 'Content Bot',
    icon_emoji: ':rice_ball:',
    attachments: [{
      fields: fields
    }]
  };
};

ContentChangeTransformer.prototype.handleContentUpdatedEvent = function(event){
  var delta = JSON.parse(event.data).delta;
  delta = _.omit(delta, 'updatedAt', 'updatedBy');
  var fields = _.filter(_.map(delta, function(value, key){
    var valueText = null;
    if(_.isArray(value) && value.length === 1){
      // New value
      valueText = value[0];
    } else if (_.isArray(value) && value.length === 2){
      // Updated value
      valueText = value[1] ? value[1] : 'REMOVED';
    } else if  (_.isArray(value) && value.length === 3){
      if(value[2] === 2){
        valueText = 'TEXT UPDATED (too long to show)';
      } else if(value[2] === 0) {
        valueText = 'REMOVED';
      }
    } else {
      valueText = null;
    }
    return { title: key, value: valueText, short: true};
  }, _.identity));
  return {
    text: event.description,
    unfurl_links: false,
    username: 'Content Bot',
    icon_emoji: ':rice_ball:',
    attachments: [{
      fields: fields
    }]
  };
};

ContentChangeTransformer.prototype.handleContentDeletedEvent = function(event){
  return {
    text: event.description,
    unfurl_links: false,
    username: 'Content Bot',
    icon_emoji: ':rice_ball:'
  };
};

module.exports = new ContentChangeTransformer();
