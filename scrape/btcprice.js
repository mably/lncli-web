//utilisation de l'api coinmarketcap pour recup du cours BTC
//coinmarketcap met son api a jour toutes les 5 mns

//adresse bitcoin 'https://api.coinmarketcap.com/v1/ticker/Bitcoin/?convert=EUR'


//dependances
//npm install --save cheerio
//npm install --save request


var request = require('request');
var cheerio = require('cheerio');

request("https://api.coinmarketcap.com/v1/ticker/Bitcoin/?convert=EUR", function(error, response, body) {
  if(error) {
    console.log("Error: " + error);
  }
  console.log("Status code: " + response.statusCode);

  var valeurs = JSON.parse(body);
  var btcusd = valeurs[0].price_usd;
  var btceur = valeurs[0].price_eur;
  console.log(btcusd, btceur);        
           

});
