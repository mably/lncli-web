// app/zpay32.js
/* eslint-disable no-bitwise */

// const debug = require('debug')('lncliweb:zpay32');
// const logger = require('winston');
const zbase32 = require('zbase32');
const fastcrc32 = require('fast-crc32c');

const convertLongToBigEndianBuffer = (longValue) => {
  const byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let index = 0; index < byteArray.length; index += 1) {
    const byte = longValue & 0xff;
    byteArray[index] = byte;
    longValue = (longValue - byte) / 256;
  }
  return Buffer.from(byteArray).swap64();
};

const convertBigEndianBufferToLong = (longBuffer) => {
  let longValue = 0;
  const byteArray = Buffer.from(longBuffer).swap64();
  for (let i = byteArray.length - 1; i >= 0; i -= 1) {
    longValue = (longValue * 256) + byteArray[i];
  }
  return longValue;
};

// TODO
module.exports = function factory() {
  const module = {};

  module.encode = function encode(paymentRequest) {
    const { pubKeyHex } = paymentRequest;
    const pubKeyBuffer = Buffer.from(pubKeyHex, 'hex');
    const { paymentHashHex } = paymentRequest;
    const paymentHashBuffer = Buffer.from(paymentHashHex, 'hex');
    const amountValueHex = convertLongToBigEndianBuffer(paymentRequest.value).toString('hex');
    const valueBuffer = Buffer.from(amountValueHex, 'hex');
    const dataBuffer = Buffer.concat([pubKeyBuffer, paymentHashBuffer, valueBuffer]);
    const crc32 = fastcrc32.calculate(dataBuffer);
    // console.log(crc32);
    const crc32Buffer = Buffer.allocUnsafe(4);
    crc32Buffer.writeUInt32BE(crc32, 0);
    const buffer = Buffer.concat([dataBuffer, crc32Buffer]);
    const bufferHex = buffer.toString('hex');
    const bufferHexRotated = bufferHex.substr(1, bufferHex.length - 1) + bufferHex.substr(0, 1);
    // console.log(bufferHexRotated);
    return zbase32.encode(Buffer.from(bufferHexRotated, 'hex'));
  };

  module.decode = function decode(paymentRequestBase32) {
    const decodedPaymentRequest = zbase32.decode(paymentRequestBase32);
    if (decodedPaymentRequest.length !== 77) {
      throw Error('Invalid payment request, decoded length should be 77 bytes.');
    }
    const bufferHexRotated = Buffer.from(decodedPaymentRequest).toString('hex');
    // console.log(bufferHexRotated);
    const bufferHex = bufferHexRotated.substr(bufferHexRotated.length - 1, bufferHexRotated.length)
      + bufferHexRotated.substr(0, bufferHexRotated.length - 1);
    // console.log(bufferHex);
    const buffer = Buffer.from(bufferHex, 'hex');
    // console.log(buffer);
    const pubKeyBuffer = buffer.slice(0, 33);
    const pubKeyHex = pubKeyBuffer.toString('hex');
    // console.log(pubKeyHex);
    const paymentHashBuffer = buffer.slice(33, 65);
    const paymentHashHex = paymentHashBuffer.toString('hex');
    // console.log(paymentHashHex);
    const valueBuffer = buffer.slice(65, 73);
    // console.log(valueBuffer);
    const value = convertBigEndianBufferToLong(valueBuffer);
    // console.log(value);
    const crcBuffer = buffer.slice(73, 77);
    const crc32 = crcBuffer.readUInt32BE();
    const dataBuffer = buffer.slice(0, 73);
    // console.log(dataBuffer.toString("hex"));
    const calculatedcrc32 = fastcrc32.calculate(dataBuffer);
    // console.log(crc32, calculatedcrc32);
    if (crc32 === calculatedcrc32) {
      return {
        pubKeyHex,
        paymentHashHex,
        value,
      };
    }
    throw Error('Payment request CRC32C check failed!');
  };

  return module;
};

const zpay32 = module.exports();

const pubKeyHex = '0315976de23b04f363f6b3a23cb7263c1fe98b5de18e4210fb67c52c810df1b04b';
// var paymentHashHex = crypto.randomBytes(32).toString("hex");
const paymentHashHex = '4e67764598fca6b07f96e706b9e3c3561fbd2f38cc019f97e4c503123b5bfe77';
const value = 3;

const paymentRequest = {
  pubKeyHex,
  paymentHashHex,
  value,
};
console.log(paymentRequest);

const encodedPayReq = zpay32.encode(paymentRequest);
console.log(encodedPayReq);

const decodedPayReq = zpay32.decode(encodedPayReq);
console.log(decodedPayReq);
