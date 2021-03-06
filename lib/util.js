"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseIntoNumber = exports.generateUUID = exports.bytes2BigEndUint32 = void 0;

const bigInt = require('big-integer');

const crc32 = require('crc').crc32;

const bytes2BigEndUint32 = function (byteArray) {
  return (byteArray[3] | byteArray[2] << 8 | byteArray[1] << 16 | byteArray[0] << 24) >>> 0;
};

exports.bytes2BigEndUint32 = bytes2BigEndUint32;

const generateUUID = content => {
  let randContent = content + Math.random() * 1e5;
  let c = Math.abs(crc32(randContent));
  return bigInt(Date.now()).multiply(bigInt(1e6)).add(bigInt(c)).toString();
};

exports.generateUUID = generateUUID;

const parseIntoNumber = function (amount) {
  if (typeof amount !== "string") {
    throw new Error("Amount should be a string.");
  }

  let [integer, decimal] = amount.split('.');

  if (decimal.length !== 6) {
    throw new Error("Precision must be 6-digit.");
  }

  let value = bigInt(integer);
  value = value.multiply(bigInt(1000000));
  value = value.add(bigInt(decimal));
  return value;
};

exports.parseIntoNumber = parseIntoNumber;