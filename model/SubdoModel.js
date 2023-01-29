const mongoose = require('mongoose');

const subdoSchema = new mongoose.Schema(
{
        username: { type: String },
        type: { type: String },
        sub: { type: String },
        content: { type: String },
        ttl: { type: Number },
        proxies: { type: Boolean }
  },
  { timestamps: true }
);

const Subdomain = mongoose.model('Subdomain', subdoSchema);

module.exports = Subdomain;
