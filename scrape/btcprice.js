//utilisation de l'api coinmarketcap pour recup du cours BTC
//coinmarketcap mettan son api a jour toutes les 5 mns, on a juste besoin de faire tourner le
//script toutes les 5 mns et de mettre en cache les valeurs recuperees

//adresse bitcoin 'https://api.coinmarketcap.com/v1/ticker/Bitcoin/?convert=EUR'


//dependance pour schedule script toutes les 5mns
//npm install later  http://bunkat.github.io/later/



var later = require('later');
var cronSched = later.parse.cron('*/5 * * * * ?'); //doit cron le scraper


//dependances scraper
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

//mise en cache du cours récupéré


