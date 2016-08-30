'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var seedrandom = require('seedrandom');
var util = require('util');

var Prng = function () {
  function Prng(fn) {
    _classCallCheck(this, Prng);

    this.fn = fn || Math.random;
  }

  _createClass(Prng, [{
    key: 'getRandomInt',
    value: function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(this.fn() * (max - min)) + min;
    }
  }, {
    key: 'getRandomFloat',
    value: function getRandomFloat(min, max) {
      if (util.isUndefined(min)) min = 0;
      if (util.isUndefined(max)) max = 1;

      return this.fn() * (max - min) + min;
    }
  }]);

  return Prng;
}();

var defaults = {
  defaultRng: new Prng(seedrandom())
};

var Source = function () {
  function Source() {
    _classCallCheck(this, Source);
  }

  _createClass(Source, [{
    key: 'get',
    value: function get(rng) {
      return this.getItem(rng || defaults.defaultRng);
    }
  }, {
    key: 'getItem',
    value: function getItem(rng) {
      throw 'getItem() is not implemented on ' + this.constructor.name;
    }
  }, {
    key: 'repeat',
    value: function repeat(min, max) {
      return new RangeSource(this, min, max);
    }
  }, {
    key: 'withRng',
    value: function withRng(rng) {
      return new RngOverrideSource(this, rng);
    }

    /*
    Wraps a source such that it will execute only if a certain probability is met.
    It's basically a special case of repeat(0, 1). 
    
    repeat(0,1) is an uniform distribution of 0 or 1 and would be the same as flip() or flip(0.5).  However the 
    result of a flip isn't necessarily an array (whereas repeat(0,1) is), and the probability is controlled
    
    */

  }, {
    key: 'flip',
    value: function flip(successProbability, defaultValue) {
      return new FlipSource(this, successProbability, defaultValue);
    }
  }]);

  return Source;
}();

var ListSource = function (_Source) {
  _inherits(ListSource, _Source);

  function ListSource(obj, ctx) {
    _classCallCheck(this, ListSource);

    var _this = _possibleConstructorReturn(this, (ListSource.__proto__ || Object.getPrototypeOf(ListSource)).call(this, ctx));

    _this.list = obj;
    return _this;
  }

  _createClass(ListSource, [{
    key: 'getItem',
    value: function getItem(rng) {
      var idx = rng.getRandomInt(0, this.list.length);
      return this.list[idx];
    }
  }]);

  return ListSource;
}(Source);

function flatten(arr) {
  return arr.reduce(function (f, a) {
    return f.concat(Array.isArray(a) ? flatten(a) : a);
  }, []);
}

var RngOverrideSource = function (_Source2) {
  _inherits(RngOverrideSource, _Source2);

  function RngOverrideSource(src, rng) {
    _classCallCheck(this, RngOverrideSource);

    var _this2 = _possibleConstructorReturn(this, (RngOverrideSource.__proto__ || Object.getPrototypeOf(RngOverrideSource)).call(this));

    _this2.src = src;
    _this2.rng = rng;
    return _this2;
  }

  _createClass(RngOverrideSource, [{
    key: 'getItem',
    value: function getItem() {
      return this.src.get(this.rng);
    }
  }]);

  return RngOverrideSource;
}(Source);

var RangeSource = function (_Source3) {
  _inherits(RangeSource, _Source3);

  function RangeSource(src, min, max) {
    _classCallCheck(this, RangeSource);

    var _this3 = _possibleConstructorReturn(this, (RangeSource.__proto__ || Object.getPrototypeOf(RangeSource)).call(this));

    _this3.src = src;
    _this3.min = min;
    _this3.max = Math.max(max || 1, min);
    return _this3;
  }

  _createClass(RangeSource, [{
    key: 'getItem',
    value: function getItem(rng) {

      var ret = [];

      var n = 1;
      if (this.min !== 1 || this.max !== 1) n = rng.getRandomInt(this.min, this.max + 1);

      for (var idx = 0; idx < n; idx++) {
        //don't pass the possibly overriden rng down to the next level (prevents infinite overrides)
        ret.push(this.src.get());
      }

      return flatten(ret);
    }
  }]);

  return RangeSource;
}(Source);

var FlipSource = exports.FlipSource = function (_Source4) {
  _inherits(FlipSource, _Source4);

  function FlipSource(src, prob, defaultValue) {
    _classCallCheck(this, FlipSource);

    var _this4 = _possibleConstructorReturn(this, (FlipSource.__proto__ || Object.getPrototypeOf(FlipSource)).call(this));

    _this4.src = src;
    _this4.prob = prob || 0.5;
    _this4.defaultValue = defaultValue;
    return _this4;
  }

  _createClass(FlipSource, [{
    key: 'getItem',
    value: function getItem(rng) {

      if (rng.getRandomFloat() < this.prob) {
        return this.src.get();
      }

      if (this.defaultValue && this.defaultValue instanceof Source) {
        return this.defaultValue.get();
      }

      return this.defaultValue;
    }
  }]);

  return FlipSource;
}(Source);

var LiteralSource = function (_Source5) {
  _inherits(LiteralSource, _Source5);

  function LiteralSource(literal) {
    _classCallCheck(this, LiteralSource);

    var _this5 = _possibleConstructorReturn(this, (LiteralSource.__proto__ || Object.getPrototypeOf(LiteralSource)).call(this));

    _this5.literal = literal;
    return _this5;
  }

  _createClass(LiteralSource, [{
    key: 'getItem',
    value: function getItem() {
      return this.literal;
    }
  }]);

  return LiteralSource;
}(Source);

var TokenSource = function (_Source6) {
  _inherits(TokenSource, _Source6);

  function TokenSource(tokens) {
    _classCallCheck(this, TokenSource);

    var _this6 = _possibleConstructorReturn(this, (TokenSource.__proto__ || Object.getPrototypeOf(TokenSource)).call(this));

    _this6.tokens = tokens;
    return _this6;
  }

  _createClass(TokenSource, [{
    key: 'getItem',
    value: function getItem() {

      var ret = [];

      for (var i = 0; i < this.tokens.length; i++) {
        var token = this.tokens[i];

        if (token instanceof Source) {
          ret.push(token.get());
        } else {
          ret.push(token);
        }
      }

      return flatten(ret);
    }
  }]);

  return TokenSource;
}(Source);

var OneOfTokenSource = exports.OneOfTokenSource = function (_Source7) {
  _inherits(OneOfTokenSource, _Source7);

  function OneOfTokenSource(tokens) {
    _classCallCheck(this, OneOfTokenSource);

    var _this7 = _possibleConstructorReturn(this, (OneOfTokenSource.__proto__ || Object.getPrototypeOf(OneOfTokenSource)).call(this));

    _this7.tokens = tokens;
    return _this7;
  }

  _createClass(OneOfTokenSource, [{
    key: 'getItem',
    value: function getItem(rng) {
      var idx = rng.getRandomInt(0, this.tokens.length);

      var token = this.tokens[idx];

      if (token instanceof Source) {
        return token.get();
      } else {
        return token;
      }
    }
  }]);

  return OneOfTokenSource;
}(Source);

var ObjectTokenSource = exports.ObjectTokenSource = function (_Source8) {
  _inherits(ObjectTokenSource, _Source8);

  function ObjectTokenSource(obj) {
    _classCallCheck(this, ObjectTokenSource);

    var _this8 = _possibleConstructorReturn(this, (ObjectTokenSource.__proto__ || Object.getPrototypeOf(ObjectTokenSource)).call(this));

    _this8.obj = obj;
    return _this8;
  }

  _createClass(ObjectTokenSource, [{
    key: 'getItem',
    value: function getItem() {
      return this.resolveValue(this.obj);
    }
  }, {
    key: 'resolveValue',
    value: function resolveValue(token, parent) {

      if (token === null) return null;

      if (util.isUndefined(token)) return undefined;

      if (token instanceof Source) {
        return token.get();
      } else if (util.isArray(token)) {
        var ret = [];

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = token[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var o = _step.value;

            ret.push(this.resolveValue(o, parent || ret));
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return ret;
      } else if (util.isFunction(token)) {
        return token(parent);
      } else if (util.isObject(token)) {
        var _ret = {};

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.keys(token)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var key = _step2.value;

            _ret[key] = this.resolveValue(token[key], parent || _ret);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        return _ret;
      }

      return token;
    }
  }]);

  return ObjectTokenSource;
}(Source);

var MarkovChainSource = exports.MarkovChainSource = function (_Source9) {
  _inherits(MarkovChainSource, _Source9);

  function MarkovChainSource(obj) {
    _classCallCheck(this, MarkovChainSource);

    return _possibleConstructorReturn(this, (MarkovChainSource.__proto__ || Object.getPrototypeOf(MarkovChainSource)).call(this));
  }

  _createClass(MarkovChainSource, [{
    key: 'getItem',
    value: function getItem() {
      return this.resolveValue(this.obj);
    }
  }, {
    key: 'resolveValue',
    value: function resolveValue(token, parent) {

      if (token === null) return null;

      if (util.isUndefined(token)) return undefined;

      if (token instanceof Source) {
        return token.get();
      } else if (util.isArray(token)) {
        var ret = [];

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = token[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var o = _step3.value;

            ret.push(this.resolveValue(o, parent || ret));
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        return ret;
      } else if (util.isFunction(token)) {
        return token(parent);
      } else if (util.isObject(token)) {
        var _ret2 = {};

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = Object.keys(token)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var key = _step4.value;

            _ret2[key] = this.resolveValue(token[key], parent || _ret2);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        return _ret2;
      }

      return token;
    }
  }]);

  return MarkovChainSource;
}(Source);

var Generator = function () {
  function Generator() {
    _classCallCheck(this, Generator);
  }

  _createClass(Generator, [{
    key: 'seedPrng',
    value: function seedPrng(seed) {
      defaults.defaultRng = new Prng(seedrandom(seed));
    }
  }, {
    key: 'literal',
    value: function literal(o) {
      return new LiteralSource(o);
    }
  }, {
    key: 'tokens',
    value: function tokens() {
      var arr = Array.prototype.slice.call(arguments, 0);
      return new TokenSource(flatten(arr));
    }
  }, {
    key: 'list',
    value: function list(arr) {
      return new ListSource(arr);
    }
  }, {
    key: 'oneOf',
    value: function oneOf() {
      var arr = Array.prototype.slice.call(arguments, 0);
      return new OneOfTokenSource(arr);
    }
  }, {
    key: 'map',
    value: function map(obj) {
      return new ObjectTokenSource(obj);
    }
  }]);

  return Generator;
}();

exports.ListSource = ListSource;
exports.TokenSource = TokenSource;
exports.LiteralSource = LiteralSource;
exports.RangeSource = RangeSource;
exports.RngOverrideSource = RngOverrideSource;
exports.AbstractSource = Source;
exports.Prng = Prng;
exports.Defaults = defaults;
exports.Generator = Generator;
//# sourceMappingURL=drd.js.map
