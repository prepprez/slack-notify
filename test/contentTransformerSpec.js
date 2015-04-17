'use strict';

var expect = require('chai').expect;
var t = require('../lib/contentChangeTransformer');

describe('Content Transfomer', function(){

  describe('#handleContentCreatedEvent', function(){

    it('should work', function(){
      var result = t.handleContentCreatedEvent({
        description: 'Content created',
        data: JSON.stringify({
          newRecord: {
            emptyArray: [],
            stringArray: ['Hello', 'World'],
            string: 'Hello World',
            number: 123,
            object: {hello: 'World'},
            emptyObject: {}
          }
        })
      });
      
      expect(result.attachments[0].fields.length).to.eql(4);
      expect(result.attachments[0].fields).to.eql([
        { title: 'stringArray', value: 'Hello, World', short: true },
        { title: 'string', value: 'Hello World', short: true },
        { title: 'number', value: 123, short: true },
        { title: 'object', value: JSON.stringify({hello: 'World'}), short: true }
      ]);      

    });

  });

});