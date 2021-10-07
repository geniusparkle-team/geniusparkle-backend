const express = require('express');
const cors = require('cors');

require('dotenv').config();

// create express app
const app = express();

// Setup server port
const port = process.env.PORT;

// Trust proxy to know if http or https is being used
app.enable('trust proxy')

// CORS
const corsMiddleware = cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization']
})

app.use(corsMiddleware);
app.options('*', corsMiddleware);

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(express.json())

app.use(function(err, req, res, next) {
    // error handling logic
    console.error(err.stack);
    res.status(500).json({ msg: "something wrong" });

});

// Authentication Checker
const { authentication, authenticatedOnly } = require('./middlewares/auth.middleware')
app.use(authentication)

// define a simple route
app.get('/', (req, res) => {
    res.json({ "message": "genius-park-api" });
});

// Handles oauth callbacks
const oauthRouter = require('./routes/oauth.routes')
app.use('/oauth/', oauthRouter)

// auth routes
const authRouter = require('./routes/auth.routes');
app.use('/api/auth', authRouter);

// mail routes
const mailRouter = require('./routes/mail.routes');
app.use('/api/mail', mailRouter);

// Videos Api Routes
const videosRouter = require('./routes/videos.routes');
const { verrifyGoogleTokens } = require('./middlewares/google-oauth.middleware');
app.use('/api/videos', authenticatedOnly, verrifyGoogleTokens, videosRouter)

// User data routes
const userRouter = require('./routes/user.routes')
app.use('/api/user', authenticatedOnly, verrifyGoogleTokens, userRouter)

// listen for requests
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
