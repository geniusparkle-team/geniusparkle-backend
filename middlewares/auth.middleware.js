const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')
require('dotenv').config();

module.exports.auth = async (req, res, next) => {
  let token;
  if (
    req.headers.authentication &&
    req.headers.authentication.startsWith("Bearer ")
  ) {
    token = req.headers.authentication.split("Bearer ")[1];
  } else {
    return res.status(401).json({ error: "UnAuthorized" });
  }

  try {
    const data = jwt.verify(token, process.env.secretOrKey);
    const user = await prisma.account.findUnique({
      where: {
        email: data.email
      },
    });
    if (!user) {
      throw new Error()
    };
    req.user = user;
    next()
  } catch (error) {
    res.status(403).json({ error: "UnAuthorized" })
  } finally {
    async () =>
      await prisma.$disconnect()
  }
};