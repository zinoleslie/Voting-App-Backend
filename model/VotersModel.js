const bcrypt = require('bcryptjs');
const {Schema, Types} = require('mongoose');
const mongoose = require('mongoose')

const VoterSchema = new Schema({
    Fullname:{type: String, required: true},
    Email:{type: String, required: true, unique: true},
    Password:{type: String, required: true},
    VotedElections: [{type: Types.ObjectId, ref:"Election", required: true}],
    isAdmin: {type: Boolean, default:false}
})

// harsh password before saving to data base
VoterSchema.pre('save', async function (next) {
    //check if the password is modified or used before 
    if (!this.isModified('Password')) {
        return next()
    }
    try {
        const Salt = await bcrypt.genSalt(10) //generating a salt to harsh the password omitted at 10 times
        this.Password = await bcrypt.hash(this.Password, Salt);
        next();
    } catch (error) {
        next(error)
    }
});

module.exports = mongoose.model('Voter', VoterSchema); 