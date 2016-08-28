'use strict'

const drd = require('../dist/drd');
const should = require('should');

describe('DRD Explicit', function() {
  
  describe('RngOverrideSource', function() {
    
    it('should override default rng', function() {
      
      let nums = [0, 1, 2, 3];
      
      let mockDefaultRng = {
          getRandomInt: function(min, max) {
            return -1; //wrong rng
          }
      };
      
      let overriddenRng = {
          getRandomInt: function(min, max) {
            return 1; //right rng
          }
      };
      
      class TestOverrideSource extends drd.AbstractSource {
        getItem(rng) {
          return rng.getRandomInt();
        }
      }
      
      let rs = new drd.RngOverrideSource(new TestOverrideSource(), overriddenRng);
      
      //The behavior is that the (default) rng is passed in, but the override source ignores it and uses its local one
      rs.getItem(mockDefaultRng).should.equal(1);
    });
    
  });
  
  describe('RangeSource', function() {
    
    it('should repeat items', function() {
      
      let nums = [0, 1, 2, 3];
      
      let rs = new drd.RangeSource(new drd.LiteralSource('a'), 0, 3);
      
      let rng = {
          getRandomInt: function(min, max) {
              
              min.should.equal(0);
              max.should.equal(4); //incremented 1 because rand is exclusive
              
              return nums.shift();
          }
      };
      
      rs.getItem(rng).join('').should.equal('');
      rs.getItem(rng).join('').should.equal('a');
      rs.getItem(rng).join('').should.equal('aa');
      rs.getItem(rng).join('').should.equal('aaa');
    });
    
  });
  
  describe('LiteralSource', function() {
    
    it('should return literal string', function() {
      
      let a = new drd.LiteralSource('a');
      
      a.getItem().should.equal('a');
    });
    
    it('should return literal number', function() {
      
      let a = new drd.LiteralSource(1);
      
      a.getItem().should.equal(1);
    });
    
    it('should return literal object', function() {
      let o = {o: 'a'};
      let a = new drd.LiteralSource(o);
      
      a.getItem().should.equal(o);
    });
    
  });
  
  describe('ListSource', function() {
    
    it('should get items from list', function() {
      
      let nums = [1, 0, 2];
      
      let ls = new drd.ListSource(['b', 'a', 'c']);
      let rng = {
          getRandomInt: function(min, max) {
              
              min.should.equal(0);
              max.should.equal(3);
              
              return nums.shift();
          }
      };
      
      ls.getItem(rng).should.equal('a');
      ls.getItem(rng).should.equal('b');
      ls.getItem(rng).should.equal('c');
    });
    
  });
  
  describe('TokenSource', function() {
    
    it('should accept other sources', function() {
      
      let a = new drd.TokenSource(['a']);
      let na = new drd.TokenSource(['n', a]);
      let banana = new drd.TokenSource(['b', a, na, na]);
      
      banana.getItem().join('').should.equal('banana');
    });
    
  });
  
});

describe('DRD Fluent', function() {
  
  describe('RngOverrideSource', function() {
    
    it('should override default rng', function() {
      
      let nums = [0, 1, 2, 3];
      
      let mockDefaultRng = {
          getRandomInt: function(min, max) {
            return -1; //wrong rng
          }
      };
      
      let overriddenRng = {
          getRandomInt: function(min, max) {
            return 1; //right rng
          }
      };
      
      class TestOverrideSource extends drd.AbstractSource {
        getItem(rng) {
          return rng.getRandomInt();
        }
      }
      
      let rs = new TestOverrideSource().withRng(overriddenRng);
      
      //The behavior is that the (default) rng is passed in, but the override source ignores it and uses its local one
      rs.getItem(mockDefaultRng).should.equal(1);
    });
    
  });
  
  describe('RangeSource', function() {
    
    it('should repeat items', function() {
      
      let nums = [0, 1, 2, 3];
      
      let rs = new drd.LiteralSource('a').repeat(0, 3);
      
      let rng = {
          getRandomInt: function(min, max) {
              
              min.should.equal(0);
              max.should.equal(4); //incremented 1 because rand is exclusive
              
              return nums.shift();
          }
      };
      
      rs.getItem(rng).join('').should.equal('');
      rs.getItem(rng).join('').should.equal('a');
      rs.getItem(rng).join('').should.equal('aa');
      rs.getItem(rng).join('').should.equal('aaa');
    });
    
  });
  
  describe('LiteralSource', function() {
    
    it('should return literal string', function() {
      
      let g = new drd.Generator();
      
      let a = g.literal('a');
      
      a.getItem().should.equal('a');
    });
    
    it('should return literal number', function() {
      
      let g = new drd.Generator();
      
      let a = g.literal(1);
      
      a.getItem().should.equal(1);
    });
    
    it('should return literal object', function() {
      let o = {o: 'a'};
      let g = new drd.Generator();
      
      let a = g.literal(o);
      
      a.getItem().should.equal(o);
    });
    
  });
  
  describe('ListSource', function() {
    
    it('should get items from list', function() {
      
      let nums = [1, 0, 2];
      let g = new drd.Generator();
      
      let ls = g.list(['b', 'a', 'c']);
      let rng = {
          getRandomInt: function(min, max) {
              
              min.should.equal(0);
              max.should.equal(3);
              
              return nums.shift();
          }
      };
      
      ls.getItem(rng).should.equal('a');
      ls.getItem(rng).should.equal('b');
      ls.getItem(rng).should.equal('c');
    });
    
  });
  
  describe('TokenSource', function() {
    
    it('should accept other sources', function() {
      
      let g = new drd.Generator();
      
      let a = g.tokens('a');
      let na = g.tokens('n', a);
      let banana = g.tokens('b', a, na, na);
      
      banana.getItem().join('').should.equal('banana');
    });
    
  });
  
});