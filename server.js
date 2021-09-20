const express = require('express');
const cors = require('cors');

require('dotenv').config();

// create express app
const app = express();

// Setup server port
const port = process.env.PORT;

// CORS
app.use(cors());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(express.json())

app.use(function(err, req, res, next) {
    // error handling logic
    console.error(err.stack);
    res.status(500).json({ msg: "something wrong" });

});

// define a simple route
app.get('/', (req, res) => {
    res.json({ "message": "genius-park-api" });
});

// Handle oauth callbacks
const oauthRouter = require('./routes/oauth.routes')
app.use('/oauth/', oauthRouter)

// auth routes
const authRouter = require('./routes/auth.routes');
app.use('/api/auth', authRouter);

// mail routes
const mailRouter = require('./routes/mail.routes');
app.use('/api/mail', mailRouter);

// listen for requests
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
