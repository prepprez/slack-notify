'use strict';

var expect = require('chai').expect;
var t = require('../lib/contentChangeTransformer');

describe('Content Transfomer', function(){

  describe('#handleContentAddedEvent', function(){

    it('should work', function(){
      var result = t.handleContentAddedEvent({
        description: 'Content added',
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

      expect(result.attachments[0].fields[0]).to.eql(
        { title: 'stringArray', value: 'Hello, World', short: true }
      );

      expect(result.attachments[0].fields[1]).to.eql(
        { title: 'string', value: 'Hello World', short: true }
      );

      expect(result.attachments[0].fields[2]).to.eql(
        { title: 'number', value: 123, short: true }
      );

      expect(result.attachments[0].fields[3]).to.eql(
        { title: 'object', value: JSON.stringify({hello: 'World'}), short: true }
      );      

    });

  });

});