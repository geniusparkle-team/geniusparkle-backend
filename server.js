const path = require('path')
const express = require('express')
const cors = require('cors')

require('dotenv').config()

const authRouter = require('./routes/auth.routes')
const oauthRouter = require('./routes/oauth.routes')
const mailRouter = require('./routes/mail.routes')
const userRouter = require('./routes/user.routes')
const videosRouter = require('./routes/videos.routes')
const { verrifyGoogleTokens } = require('./middlewares/google-oauth.middleware')
const { authentication, authenticatedOnly } = require('./middlewares/auth.middleware')

const app = express()
const port = process.env.PORT || 8080


const corsMiddleware = cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization', 'Authentication'],
})

app.set('emails_views', path.resolve(__dirname, 'EmailTemplates'))
app.enable('trust proxy')

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(function (err, req, res, next) {
    // error handling logic
    console.error(err.stack)
    res.status(500).json({ msg: 'something wrong' })
})

app.use(corsMiddleware)
app.options('*', corsMiddleware)

// Authentication Checker
app.use(authentication)

app.get('/', (req, res) => {
    res.json({ message: 'genius-park-api' })
})

app.use('/oauth/', oauthRouter)
app.use('/api/auth', authRouter)
app.use('/api/mail', mailRouter)
app.use('/api/videos', authenticatedOnly, verrifyGoogleTokens, videosRouter)
app.use('/api/user', authenticatedOnly, verrifyGoogleTokens, userRouter)

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
})
