const CryptoJS = require("crypto-js");

const idNumber = 555;
const key = "ctgoyu20e0apbt";

const encrypt = CryptoJS.AES.encrypt(
  idNumber.toString(),
  key.toString()
).toString();

console.log(encrypt);

const decrypt = CryptoJS.AES.decrypt(encrypt, key).toString(CryptoJS.enc.Utf8);

console.log(decrypt);
