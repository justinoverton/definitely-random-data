'use strict'

const seedrandom = require('seedrandom');

class Prng {
  
  constructor(fn) {
    this.fn = fn || Math.random;
  }
  
  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(this.fn() * (max - min)) + min;
  }
  
  getRandomFloat(min, max) {
    return this.fn() * (max - min) + min;
  }
}

const defaults = {
  defaultRng: new Prng(seedrandom())
};

class Source {
  
  getItem(rng) {
    throw `getItem() is not implemented on ${this.constructor.name}`;
  }
  
  repeat(min, max) {
    return new RangeSource(this, min, max);
  }
  
  withRng(rng) {
    return new RngOverrideSource(this, rng);
  }
}

class ListSource extends Source {
  
  constructor(obj, ctx) {
    super(ctx);
    this.list = obj;
  }
  
  getItem(rng) {
    rng = rng || defaults.defaultRng;
    let idx = rng.getRandomInt(0, this.list.length);
    return this.list[idx];
  }
}

function flatten(arr) {
  return arr.reduce(function (f, a) {
    return f.concat(Array.isArray(a) ? flatten(a) : a);
  }, []);
}

class RngOverrideSource extends Source {
  constructor(src, rng) {
    super();
    this.src = src;
    this.rng = rng;
  }
  
  getItem() {
    return this.src.getItem(this.rng);
  }
}

class RangeSource extends Source {
  
  constructor(src, min, max) {
    super();
    this.src = src;
    this.min = min;
    this.max = Math.max(max || 1, min);
  }
  
  getItem(rng) {
    
    rng = rng || defaults.defaultRng;  
    let ret = [];
    
    let n = 1;
    if(this.min !== 1 || this.max !== 1)
      n = rng.getRandomInt(this.min, this.max+1);
    
    for(let idx=0; idx<n; idx++){
      //don't pass the possibly overriden rng down to the next level (prevents infinite overrides)
      ret.push(this.src.getItem());
    }
    
    return flatten(ret);
  }
  
}

class LiteralSource extends Source {
  constructor(literal) {
    super();
    this.literal = literal;
  }
  
  getItem() {
    return this.literal;
  }
}

class TokenSource extends Source {
  constructor(tokens) {
    super();
    this.tokens = tokens;
  }
  
  getItem() {
    
    let ret = [];
    
    for(let i=0; i<this.tokens.length; i++) {
      let token = this.tokens[i];
      
      if(token instanceof Source) {
        ret.push(token.getItem());
      } else {
        ret.push(token);
      }
    }
    
    return flatten(ret);
  }
}

class Generator {
  
  constructor() {
    
  }
  
  literal(o) {
    return new LiteralSource(o);
  }
  
  tokens() {
    let arr = Array.prototype.slice.call(arguments, 0);
    return new TokenSource(flatten(arr));
  }
  
  list(arr) {
    return new ListSource(arr);
  }
  
}

exports.ListSource = ListSource;
exports.TokenSource = TokenSource;
exports.LiteralSource = LiteralSource;
exports.RangeSource = RangeSource;
exports.RngOverrideSource = RngOverrideSource;
exports.AbstractSource = Source;
exports.Prng = Prng;
exports.Defaults = defaults;


exports.Generator = Generator;