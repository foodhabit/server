var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');

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
      res.status(200).json(response.outputs[0].data.concepts.map(function(concept) {
        return concept.name;
      }).slice(0, 5));
    }, function(err) {
      console.error(err);
      res.status(500).send();
    });
});

app.listen(3000, function() {
  console.log('Listening on port 3000');
});
