# Label[i] - API

Remote API for the Label[i] platform

### Communication

Routes are detailled in differents namespaces in documentation.  
You need to send your datas with the content type __application/x-www-form-urlencoded__.  

### Model

All datas have a model to describe them.  
Theses models are placed in _./models_ folder.

To use them, you need [mongoose](http://mongoosejs.com/).  
Mongoose's documentation is available [here](http://mongoosejs.com/docs/guide.html).

### Routes

Routes are the link between REST requests and NodeJS functions.  
They're defined in _./routes_ folder and in _./api.js_ file.  

_api.js_ is the center of the API. It collect all routes defined in the _./routes_ folder to create the API.  

#### Add a new route

You just need to create a new file in the _./routes_ folder and add the file to the _api.js_ file with this line :  
`app.use(require('./routes/myFile'));` 

Next, add a new router and the model to your new module.  
`var MyModel = require('../models/mymodel'); // Add the model`  
`var express = require('express'); // Get ExpressJS module`  
`var router = express.Router(); // Get the router for the app`  
`router.route('/myFile').get(myFileFunction); // Route a URL to a function`  
`module.exports = router; // Export the router`  

#### Use Express.Request and Express.Response

`function myFileFunction(req, res)`  

These two parameters are detailled in [Express](http://expressjs.com/) documentation (available [here](http://expressjs.com/4x/api.html)).  

### Tests

To use tests, you need [Mocha](http://mochajs.org/) and [Chai](http://chaijs.com/).  

To launch all tests :  
`cd ./api_folder`  
`mocha`  

### Documentation

To re-generate a new documentation, you need [JSDoc](https://github.com/jsdoc3/jsdoc) (documentation [here](http://usejsdoc.org/)).  

To generate documentation :  
`cd ./api_folder`  
`jsdoc ./routes -d ./doc --readme ./doc_readme.md`  

This command will generate documentation of _./routes_ folder in _./doc_ folder, and user the _./doc_readme.md_ file to generate index.html.