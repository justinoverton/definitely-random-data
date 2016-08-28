'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var seedrandom = require('seedrandom');

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
      rng = rng || defaults.defaultRng;
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
      return this.src.getItem(this.rng);
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

      rng = rng || defaults.defaultRng;
      var ret = [];

      var n = 1;
      if (this.min !== 1 || this.max !== 1) n = rng.getRandomInt(this.min, this.max + 1);

      for (var idx = 0; idx < n; idx++) {
        //don't pass the possibly overriden rng down to the next level (prevents infinite overrides)
        ret.push(this.src.getItem());
      }

      return flatten(ret);
    }
  }]);

  return RangeSource;
}(Source);

var LiteralSource = function (_Source4) {
  _inherits(LiteralSource, _Source4);

  function LiteralSource(literal) {
    _classCallCheck(this, LiteralSource);

    var _this4 = _possibleConstructorReturn(this, (LiteralSource.__proto__ || Object.getPrototypeOf(LiteralSource)).call(this));

    _this4.literal = literal;
    return _this4;
  }

  _createClass(LiteralSource, [{
    key: 'getItem',
    value: function getItem() {
      return this.literal;
    }
  }]);

  return LiteralSource;
}(Source);

var TokenSource = function (_Source5) {
  _inherits(TokenSource, _Source5);

  function TokenSource(tokens) {
    _classCallCheck(this, TokenSource);

    var _this5 = _possibleConstructorReturn(this, (TokenSource.__proto__ || Object.getPrototypeOf(TokenSource)).call(this));

    _this5.tokens = tokens;
    return _this5;
  }

  _createClass(TokenSource, [{
    key: 'getItem',
    value: function getItem() {

      var ret = [];

      for (var i = 0; i < this.tokens.length; i++) {
        var token = this.tokens[i];

        if (token instanceof Source) {
          ret.push(token.getItem());
        } else {
          ret.push(token);
        }
      }

      return flatten(ret);
    }
  }]);

  return TokenSource;
}(Source);

var Generator = function () {
  function Generator() {
    _classCallCheck(this, Generator);
  }

  _createClass(Generator, [{
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
