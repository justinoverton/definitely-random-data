'use strict'

const seedrandom = require('seedrandom');
const util = require('util');

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
  
  get(rng) {
    return this.getItem(rng || defaults.defaultRng);
  }
  
  getItem(rng) {
    throw `getItem() is not implemented on ${this.constructor.name}`;
  }
  
  repeat(min, max) {
    return new RangeSource(this, min, max);
  }
  
  withRng(rng) {
    return new RngOverrideSource(this, rng);
  }
  
  /*
  Wraps a source such that it will execute only if a certain probability is met.
  It's basically a special case of repeat(0, 1). 
  
  repeat(0,1) is an uniform distribution of 0 or 1 and would be the same as flip() or flip(0.5).  However the 
  result of a flip isn't necessarily an array (whereas repeat(0,1) is), and the probability is controlled
  
  */
  flip(successProbability, defaultValue) {
    return new FlipSource(this, successProbability, defaultValue);
  }
}

class ListSource extends Source {
  
  constructor(obj, ctx) {
    super(ctx);
    this.list = obj;
  }
  
  getItem(rng) {
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
    return this.src.get(this.rng);
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
    
    let ret = [];
    
    let n = 1;
    if(this.min !== 1 || this.max !== 1)
      n = rng.getRandomInt(this.min, this.max+1);
    
    for(let idx=0; idx<n; idx++){
      //don't pass the possibly overriden rng down to the next level (prevents infinite overrides)
      ret.push(this.src.get());
    }
    
    return flatten(ret);
  }
  
}

let FlipSource = exports.FlipSource = class FlipSource extends Source {
  
  constructor(src, prob, defaultValue) {
    super();
    this.src = src;
    this.prob = prob || 0.5;
    this.defaultValue = defaultValue;
  }
  
  getItem(rng) {
    
    if(rng.getRandomFloat() < this.prob) {
      return this.src.get();
    }
    
    if(this.defaultValue && this.defaultValue instanceof Source) {
      return this.defaultValue.get();
    }
    
    return this.defaultValue;
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
        ret.push(token.get());
      } else {
        ret.push(token);
      }
    }
    
    return flatten(ret);
  }
}

let OneOfTokenSource = exports.OneOfTokenSource = class OneOfTokenSource extends Source {
    constructor(tokens) {
        super();
        this.tokens = tokens;
    }
    
    getItem(rng) {
        let idx = rng.getRandomInt(0, this.tokens.length);
        
        let token = this.tokens[idx];
        
        if(token instanceof Source) {
          return token.get();
        } else {
          return token;
        }
    }
};

let ObjectTokenSource = exports.ObjectTokenSource = class ObjectTokenSource extends Source {
    constructor(obj) {
        super();
        this.obj = obj;
    }
    
    getItem() {
        return this.resolveValue(this.obj);
    }
    
    resolveValue(token, parent) {
        
        if(token === null)
            return null;
        
        if(util.isUndefined(token))
            return undefined;
        
        if(token instanceof Source) {
          return token.get();
        } else if(util.isArray(token)) {
            let ret = [];
            
            for(let o of token) {
                ret.push(this.resolveValue(o, parent || ret));
            }
            
            return ret;
        } else if(util.isFunction(token)) {
            return token(parent);  
        } else if(util.isObject(token)) {
            let ret = {};
            
            for (let key of Object.keys(token)) {
                ret[key] = this.resolveValue(token[key], parent || ret);
            }
            
            return ret;
        }
        
        return token;
    };
}

let MarkovChainSource = exports.MarkovChainSource = class MarkovChainSource extends Source {
    constructor(obj) {
        super();
    }
    
    getItem() {
        return this.resolveValue(this.obj);
    }
    
    resolveValue(token, parent) {
        
        if(token === null)
            return null;
        
        if(util.isUndefined(token))
            return undefined;
        
        if(token instanceof Source) {
          return token.get();
        } else if(util.isArray(token)) {
            let ret = [];
            
            for(let o of token) {
                ret.push(this.resolveValue(o, parent || ret));
            }
            
            return ret;
        } else if(util.isFunction(token)) {
            return token(parent);  
        } else if(util.isObject(token)) {
            let ret = {};
            
            for (let key of Object.keys(token)) {
                ret[key] = this.resolveValue(token[key], parent || ret);
            }
            
            return ret;
        }
        
        return token;
    };
};

class Generator {
  
  constructor() {
    
  }
  
  seedPrng(seed) {
    defaults.defaultRng = new Prng(seedrandom(seed));
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
  
  oneOf() {
      let arr = Array.prototype.slice.call(arguments, 0);
      return new OneOfTokenSource(arr);
  }
  
  map(obj) {
      return new ObjectTokenSource(obj);
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