const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    userName: { type: String },
    nickName: { type: String },
    email: { type: String, unique: true },
    password: { type: String, bcrypt: true },
    admin: { type: Boolean, default: false },
    userlevel: { type: Number, default: 0 },
    auth: { type: Array },
    numberOfLogin: { type: Number, default: 0 },
    loginAt: { type: Date },
    color: { type: String, default: '#91ECEC' }
  },
  {
    timestamp: true
  }
)

userSchema.plugin(require('mongoose-bcrypt'), { rounds: 10 })
const Users = mongoose.model('Users', userSchema)

module.exports = Users
