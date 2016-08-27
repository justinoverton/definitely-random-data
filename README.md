
# Definitely Random Data

A framework for creating random data with a definite structure. 

## Installation

    npm install definitely-random-data

## Usage

```
'use strict'

const drd = require('definitely-random-data');

let g = new drd.Generator();

//define tokens
let firstName = g.list(['John', 'Clint', 'Robin', 'Gary']);
let lastName = g.list(['Wayne', 'Eastwood', 'Williams', 'Cooper']);

//tokens and literals can be combined
let fullName = g.tokens(firstName, ' ', lastName);
console.log(fullName.getItem().join(''));

//repeating tokens are easy
let number = g.list([0,1,2,3,4,5,6,7,8,9]);
let phone = g.tokens('555-555-', number.repeat(4));
console.log(phone.getItem().join(''));

//repeating a range is easy as well, even if it's a literal
let subdomain = g.literal('www');
let url = g.tokens(subdomain.repeat(0, 1), 'example.com');

console.log(url.getItem().join('.'));
```