//utilisation de l'api coinmarketcap pour recup du cours BTC
//coinmarketcap met son api a jour toutes les 5 mns

//adresse bitcoin https://api.coinmarketcap.com/v1/ticker/bitcoin/


//dependances
//npm install --save cheerio
//npm install --save request


var request = require('request');
var cheerio = require('cheerio');

request("https://api.coinmarketcap.com/v1/ticker/bitcoin/", function(error, response, body) {
  if(error) {
    console.log("Error: " + error);
  }
  console.log("Status code: " + response.statusCode); //pour info lors de la phase de conception

  var html = cheerio.load(body);


  var valeurs = JSON.parse(body, (key, value) => {
      console.log(value);         
      return key['price_usd'];      //ne semble pas fonctionner         
  });


});
