'use strict';

var log = require('blikk-logjs')('content-change-transformer');

var ContentChangeTransformer = function(){};

ContentChangeTransformer.prototype.transform = function(event) {
  if(event.event === 'ARTICLE_ADDED'){
    log.info('posting ARTICLE_ADDED event');
    return this.transformArticleAddedEvent(JSON.parse(event.data));
  } else {
    return null;
  }
};

ContentChangeTransformer.prototype.transformArticleAddedEvent = function(record) {
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
};

module.exports = new ContentChangeTransformer();
