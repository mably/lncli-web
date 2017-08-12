// app/zpay32.js

const debug = require("debug")("lncliweb:zpay32");
const logger = require("winston");
const Promise = require("promise");
const crypto = require("crypto");
const zbase32 = require("zbase32");
const fastcrc32 = require("fast-crc32c");

// TODO
module.exports = function () {

	var module = {};

	module.encode = function (paymentRequest) {
		var pubKeyHex = paymentRequest.pubKeyHex;
		var pubKeyBuffer = Buffer.from(pubKeyHex, "hex");
		var paymentHashHex = paymentRequest.paymentHashHex;
		var paymentHashBuffer = Buffer.from(paymentHashHex, "hex");
		var amountValueHex = convertLongToBigEndianBuffer(paymentRequest.value).toString("hex");
		var valueBuffer = Buffer.from(amountValueHex, "hex");
		var dataBuffer = Buffer.concat([pubKeyBuffer, paymentHashBuffer, valueBuffer]);
		var crc32 = fastcrc32.calculate(dataBuffer);
		//console.log(crc32);
		var crc32Buffer = Buffer.allocUnsafe(4);
		crc32Buffer.writeUInt32BE(crc32, 0);
		var buffer = Buffer.concat([dataBuffer, crc32Buffer]);
		var bufferHex = buffer.toString("hex");
		var bufferHexRotated = bufferHex.substr(1, bufferHex.length - 1) + bufferHex.substr(0, 1);
		//console.log(bufferHexRotated);
		return zbase32.encode(Buffer.from(bufferHexRotated, "hex"));
	};

	module.decode = function (paymentRequestBase32) {
		var decodedPaymentRequest = zbase32.decode(paymentRequestBase32);
		if (decodedPaymentRequest.length != 77) {
			throw "Invalid payment request, decoded length should be 77 bytes.";
		}
		var bufferHexRotated = Buffer.from(decodedPaymentRequest).toString("hex");
		//console.log(bufferHexRotated);
		var bufferHex = bufferHexRotated.substr(bufferHexRotated.length - 1, bufferHexRotated.length)
				+ bufferHexRotated.substr(0, bufferHexRotated.length - 1);
		//console.log(bufferHex);
		var buffer = Buffer.from(bufferHex, "hex");
		//console.log(buffer);
		var pubKeyBuffer = buffer.slice(0, 33);
		var pubKeyHex = pubKeyBuffer.toString("hex");
		//console.log(pubKeyHex);
		var paymentHashBuffer = buffer.slice(33, 65);
		var paymentHashHex = paymentHashBuffer.toString("hex");
		//console.log(paymentHashHex);
		var valueBuffer = buffer.slice(65, 73);
		//console.log(valueBuffer);
		var value = convertBigEndianBufferToLong(valueBuffer);
		//console.log(value);
		var crcBuffer = buffer.slice(73, 77);
		var crc32 = crcBuffer.readUInt32BE();
		var dataBuffer = buffer.slice(0, 73);
		//console.log(dataBuffer.toString("hex"));
		var calculatedcrc32 = fastcrc32.calculate(dataBuffer);
		//console.log(crc32, calculatedcrc32);
		if (crc32 === calculatedcrc32) {
			var paymentRequest = {
				pubKeyHex: pubKeyHex,
				paymentHashHex: paymentHashHex,
				value: value
			};
			return paymentRequest;
		} else {
			throw "Payment request CRC32C check failed!";
		}
	};

	return module;
};

var zpay32 = module.exports();

var convertLongToBigEndianBuffer = function (longValue) {
	var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
	for (var index = 0; index < byteArray.length; index++) {
		var byte = longValue & 0xff;
		byteArray[index] = byte;
		longValue = (longValue - byte) / 256;
	}
	return Buffer.from(byteArray).swap64();
};

var convertBigEndianBufferToLong = function (longBuffer) {
	var longValue = 0;
	var byteArray = Buffer.from(longBuffer).swap64();
	for (var i = byteArray.length - 1; i >= 0; i--) {
		longValue = (longValue * 256) + byteArray[i];
	}
	return longValue;
};

var pubKeyHex = "0315976de23b04f363f6b3a23cb7263c1fe98b5de18e4210fb67c52c810df1b04b";
//var paymentHashHex = crypto.randomBytes(32).toString("hex");
var paymentHashHex = "4e67764598fca6b07f96e706b9e3c3561fbd2f38cc019f97e4c503123b5bfe77";
var value = 3;

var paymentRequest = {
	pubKeyHex: pubKeyHex,
	paymentHashHex: paymentHashHex,
	value: value
};
console.log(paymentRequest);

var encodedPayReq = zpay32.encode(paymentRequest);
console.log(encodedPayReq);

var decodedPayReq = zpay32.decode(encodedPayReq);
console.log(decodedPayReq);
