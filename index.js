var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
const request = require('request');
const DATA_GOV_URL = 'https://api.nal.usda.gov/ndb/';

var Clarifai = require('clarifai');
var secrets = require('./secrets.json');

var app = express();
var upload = multer({
  storage: multer.memoryStorage()
});

var clarifaiApp = new Clarifai.App(
  secrets.CLARIFAI_CLIENT_ID,
  secrets.CLARIFAI_CLIENT_SECRET
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res) {
  res.send('Welcome to FoodHabit!');
});

app.post('/food', upload.single('image'), function(req, res) {
  var imageInBase64 = req.file.buffer.toString('base64');
  // TODO: Don't hardcode the food-items model.
  clarifaiApp.models.predict('bd367be194cf45149e75f01d59f77ba7', { base64: imageInBase64 })
    .then(function(response) {
      food = {
        predictions: response.outputs[0].data.concepts.map(function(concept) {
          return concept.name;
        }).slice(0, 5)
      }
      console.log(food.predictions);
      request(
        getFormattedDataGovUrl('search/', food.predictions[0], 5),
        function(dataGovErr, dataGovResponse, dataGovBody) {
          res.status(200).json(JSON.parse(dataGovBody).list.item.map(function(foodItem) {
            return foodItem.name;
          }));
        });
    }, function(err) {
      console.error(err);
      res.status(500).send();
    });
});

function getFormattedDataGovUrl(path, searchTerm, amount) {
  return (DATA_GOV_URL + path +
    '?format=json&q=' + searchTerm +
    '&sort=r' +
    '&max=' + amount +
    '&offset=0' +
    '&api_key=' + secrets.DATA_GOV_API_KEY);
}

app.listen(3000, function() {
  console.log('Listening on port 3000');
});
