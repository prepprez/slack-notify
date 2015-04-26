'use strict';

var _ = require('lodash');

var ContentChangeTransformer = function(){};

ContentChangeTransformer.prototype.transform = function(event) {
  if(event.event === 'ARTICLE_CREATED'){
    return this.transformArticleCreatedEvent(event);
  } else if (event.event === 'CONTENTPIECE_CREATED') {
    // Don't handle content piece events -> Too much noise
    return null;
  } else if (_.contains(event.event, 'MICROTASK')) {
    // Don't publish Microtask events
    return null;
  } else if (_.includes(event.event, 'CREATED')) {
    return this.handleContentCreatedEvent(event);
  } else if (_.includes(event.event, 'UPDATED')) {
    return this.handleContentUpdatedEvent(event);
  } else if (_.includes(event.event, 'DELETED')) {
    return this.handleContentDeletedEvent(event);    
  } else {
    return null;
  }
};

ContentChangeTransformer.prototype.transformArticleCreatedEvent = function(event) {
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

ContentChangeTransformer.prototype.handleContentCreatedEvent = function(event){
  var newRecord = JSON.parse(event.data).newRecord;
  var newRecordFiltered = _.omit(newRecord, 'updatedAt', 'updatedBy', 'createdAt', 'createdBy', '_v', '_id');
  var fields = _.map(newRecordFiltered, function(value, key){
    var valueString = null;
    if (_.isArray(value) && !_.isEmpty(value)){
      valueString = value.join(', ');
    } else if (_.isObject(value) && !_.isEmpty(value)){
      valueString = JSON.stringify(value);
    } else if (_.isString(value) || _.isNumber(value) || _.isDate(value) || _.isBoolean(value) || _.isFinite(value)){
      valueString = value;
    }
    if(!valueString){
      return null;
    }
    return { title: key, value: valueString, short: true};
  });
  fields =  _(fields).filter(_.identity).reject(_.isEmpty).reject(_.isNull).value();
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
      // New Value
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
    }
    return valueText ? { title: key, value: valueText, short: true } : null;
  }, _.identity));
  fields =  _(fields).filter(_.identity).reject(_.isEmpty).reject(_.isNull).value();
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
