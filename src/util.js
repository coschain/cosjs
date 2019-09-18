import crc32 from 'crc/crc32'
const bigInt = require('big-integer');

export const bytes2BigEndUint32 = function (byteArray) {
  return (byteArray[3] | byteArray[2] << 8 | byteArray[1] << 16 | byteArray[0] << 24) >>> 0;
};

export const generateUUID = (content) => {
  let randContent = content + Math.random() * 1e5;
  let c = Math.abs(crc32(randContent));
  return bigInt(Date.now()).multiply(bigInt(1e6)).add(bigInt(c)).toString();
};

export const parseIntoNumber = function (amount) {
  let [integer, decimal] = amount.split('.');
  let value = bigInt(integer);
  decimal = '0.' + decimal;
  value = value.multiply(bigInt(1000000));
  value = value.add(bigInt(Number(decimal) * 1000000));
  return value
};
