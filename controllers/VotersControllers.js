const VoterModel = require('../model/VotersModel');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
// const {authMiddleware} = require('../')

exports.CreateVoter = async (req, res) => {
    const { Fullname, Email, Password, Password2 } = req.body;

    try {
        //check if the email already exist
        let newEmail = Email.toLowerCase();
        const emailExist = await VoterModel.findOne({ Email: newEmail });
        if (emailExist) {
            return res.status(400).json({ message: 'User already exist...' })
        }
        if (!Fullname || !Email || !Password || !Password2) {
            return res.status(422).json({ message: 'please fill in all fields...' })
        }
        if (Password !== Password2) {
            return res.status(422).json({ message: "passwords do not match..." })
        }

        //if the person registering is archiever@gmail.com he should be admin
        let isAdmin = false
        if (Email == 'archiever@gmail.com') {
            isAdmin = true // Set isAdmin to true for this specific email
        }

        // Check password length
        if (Password.length < 6) {
            return res.status(422).json({ message: "Password must be at least 6 characters long" });
        }

        const newVoter = new VoterModel({ Fullname, Email: newEmail, Password, isAdmin });
        const savedVoter = await newVoter.save();
        res.status(200).json({ success: true, message: 'Voter created successfully', data: savedVoter });
    } catch (error) {
        res.status(500).json({ message: "error creating voter", error: error })
    }
}




exports.loginVoter = async (req, res) => {
    const { Email, Password } = req.body;
    try {
        const newEmail = Email.toLowerCase()
        const existingEmail = await VoterModel.findOne({ Email: newEmail });
        //check if email exist in db
        if (!existingEmail) {
            return res.status(400).json({ message: "Invalid credentials" });

        }
        if (!Email || !Password) {
            return res.status(400).json({ message: 'fill in all fields' })
        }
        // Compare the password with the hashed password in the database
        const isPasswordMatch = await bcrypt.compare(Password, existingEmail.Password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        //Generating a jwt token
        const Token = jwt.sign(
            {
                id: existingEmail._id,
                Email: existingEmail.Email,
                isAdmin: existingEmail.isAdmin,
            },
            process.env.JWT_KEY,
            { expiresIn: '2h' }
        );

        res.status(200).json({ success: true, data: existingEmail, token: Token });

    } catch (error) {
        res.status(500).json({ message: "failed to Login", error: error })
    }
}


//get single voter
exports.getVoter = async (req, res) => {
    // console.log("User info in allVoters:", req.user);
    const { id } = req.params;
    try {
        const voterID = await VoterModel.findById(id);
        if (!voterID) {
            return res.json({ message: 'invalid ID' })
        }
        res.status(200).json({ success: true, message: ' fetched Voter', data: voterID })
    } catch (error) {

    }
}



/*this requires admin permission */
exports.allVoters = async (req, res) => {
    //making sure only can admins
    console.log("User info in allVoters:", req.user);
    if (!req.user.isAdmin) {
        return res.json({ message: "only admins have access to this" })
    }
    try {
        const allVoters = await VoterModel.find()
        res.status(200).json({ succuess: true, message: "fetched voters", data: allVoters })
    } catch (error) {
        res.status(500).json({ message: "error getting voters", error: error.message })
    }
}