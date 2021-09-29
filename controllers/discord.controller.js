const express = require('express');
const fetchP = import('node-fetch').then(mod => mod.default)
const fetch = (...args) => fetchP.then(fn => fn(...args))
const btoa = require('btoa');
const { catchAsync } = require('../utils.js');
const { url } = require('inspector');
const { URLSearchParams } = require('url');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcryptjs");
const { error } = require('console');
const prisma = new PrismaClient();

const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const redirect = encodeURIComponent('http://localhost:8080/api/discord/callback');
const redirect2 = 'http://localhost:8080/api/discord/callback';

router.get('/login', (req, res) => {
  res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=email&response_type=code&redirect_uri=${redirect}`);
});

router.get('/callback', catchAsync(async (req, res) => {
  // if (!req.query.code) throw new Error('NoCodeProvided');
  if (!req.query.code) {
    res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&scope=email&response_type=code&redirect_uri=${redirect}`);
  }
  const code = req.query.code;
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirect2);

  const response = await fetch(`https://discordapp.com/api/oauth2/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });

  const json = await response.json();

  var tokenDiscord = "Bearer " + json.access_token;
  const response2 = await fetch(`http://discordapp.com/api/users/@me`,
    {
      method: 'GET',
      headers: {
        Authorization: tokenDiscord,
      },
    });

  const json2 = await response2.json();
  if (json2) {
    try {
      // Check if already a registered user
      const is_Registered = await prisma.account.findUnique({
        where: { email: json2.email }
      });

      if (!is_Registered) {

        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(process.env.commomPass, salt);
        var otherData = "discordId:" + json2.id;

        // create account 
        const created_User = await prisma.account.create({
          data: {
            name: json2.username,
            email: json2.email,
            password: hash,
            otherData: otherData
          }
        });
      }

      const token = jwt.sign({ id: json2.email }, process.env.secretOrKey, {
        expiresIn: 86400,
      });
      res.setHeader("Authentication", token);
      res.status(200).json({
        ok: "true",
        data: { token: "Bearer " + token }
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        ok: false,
        error: "Something went wrong"
      });
    }
  } else {

    return res.status(400).json({
      ok: false,
      error: "Get user data from discord failed!"
    });
  }
}));

module.exports = router;
