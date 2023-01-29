const cors = require("cors");
var bodyParser = require("body-parser");
const fetch = require("node-fetch");
const express = require("express");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const github = require("./../utils/github");
const User = require("../model/UserModel");
require("dotenv").config();

passport.use(github);

const router = express.Router();
router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true }));

router.use(passport.initialize());
router.use(passport.session());
const { CF_GLOBAL_APIKEY, CF_ZONE_ID, CF_EMAIL } = process.env;
const baseUrl = "https://api.cloudflare.com/client/v4/zones/" + CF_ZONE_ID;
const addLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250,
  message: "Too many request from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  handler: function (req, res, next) {
    // lmao 200 OK
    res.status(200).send({
      success: false,
      errors: [
        {
          message: "Rate Limited",
          error_chain: [
            {
              message: "Slow down dude! You're too fast. Wait 15 minutes.",
            },
          ],
        },
      ],
    });
  },
});

router.get("/isexists", async (req, res, next) => {
  const q = req.query.q;
  const type = req.query.type;
  const dom = [];
  fetch(baseUrl + "/dns_records?type=" + type + "&match=all", {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      "X-Auth-Email": CF_EMAIL,
      "X-Auth-Key": CF_GLOBAL_APIKEY,
    },
  })
    .then((d) => d.json())
    .then((x) => {
      if (x.success) {
        let result = x.result;
        for (var i = 0; i < result.length; i++) {
          dom.push(result[i].name);
        }
        res.status(200).json({
          result: dom.includes(q),
        });
      } else {
        console.log(x);
        res.sendStatus(500);
      }
    })
    .catch((x) => {
      console.log(x);
      res.sendStatus(500);
    });
});

router.post("/add", addLimit, async (req, res, next) => {
  let { subdomain, content, type, username } = req.body;
  const data = {
    type,
    name: subdomain + ".botwa.in",
    content,
    ttl: 1,
    proxied: false,
  };

  fetch(baseUrl + "/dns_records", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "X-Auth-Email": CF_EMAIL,
      "X-Auth-Key": CF_GLOBAL_APIKEY,
    },
    body: JSON.stringify(data),
  })
    .then((d) => d.json())
    .then((x) => {
      let dat = {
        type: type,
        sub: subdomain + ".botwa.in",
        content: content,
        ttl: 1,
        proxied: false,
      };
      User.findOneAndUpdate(
        { username: username },
        { $push: { subdomain: dat } },
        function (err, pon) {
          if (err) throw err;
          res.status(200).json({
            result: dat,
          });
        }
      );
    })
    .catch((x) => {
      res.sendStatus(500);
    });
});

module.exports = router;
