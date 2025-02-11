const ElectionModel = require("../model/ElectionModel");
const CandidateModel = require("../model/CandidateModel");
const VotersModel = require("../model/VotersModel");
const { v4: uuid } = require("uuid");
const cloudinary = require("../utils/cloudinary");
const Path = require("path");
const fs = require("fs");

exports.createElection = async (req, res) => {
    //checking to make sure only admins can perform thus action
    console.log('User info in createElection:', req.user);
    if(!req.user.isAdmin){
        return res.json({message:"only admins have access to this"})
    }
    try {
        const { Title, Description } = req.body;
        if (!Title || !Description) {
            return res.status(422).json({ message: "fill in all fields" });
        }

        if (!req.files || !req.files.thumbnail) {
            return res.status(422).json({ message: "choose a thumbnail" });
        }

        const { thumbnail } = req.files;
        if (thumbnail.size > 1000000) {
            return res.status(422).json({ message: 'file too big. choose a file with less than 1mb' });
        }

        // Rename the image with a unique name
        let fileName = thumbnail.name;
        fileName = fileName.split(".");
        fileName = fileName[0] + uuid() + "." + fileName[fileName.length - 1];

        // Upload the file to the 'uploads' folder
        const filePath = Path.join(__dirname, '..', "uploads", fileName);

        await new Promise((resolve, reject) => {
            thumbnail.mv(filePath, (error) => {
                if (error) {
                    reject(error); // Reject if there's an error
                }
                resolve(); // Resolve if no error
            });
        });

        // Store the image on Cloudinary
        const result = await cloudinary.uploader.upload(filePath, { resource_type: "image" });
        if (!result) {
            return res.status(500).json({ message: "error uploading image to cloudinary" });
        }

        // Delete the file from the 'uploads' folder after uploading to Cloudinary


        // Save the election data in the database
        const newElection = new ElectionModel({
            Title,
            Description,
            thumbnail: result.secure_url, // Store the Cloudinary URL
        });

        const savedElection = await newElection.save();
        res.status(200).json({
            success: true,
            message: 'Election created successfully',
            data: savedElection
        });
    } catch (error) {
        res.status(500).json({ message: "failed to create election", error: error.message });
    }
};


//get all elections
exports.getElections = async (req, res) => {

    try {
        const elections = await ElectionModel.find();
        if (!elections || !elections.length === 0 ){
            return res.json({ message: 'no election found' })
        }        res.status(200).json({ success: true, message: ' fetched elections', data: elections })
    } catch (error) {
        res.status(500).json({ success: false, message: "failed to fetch elections", error: error.message })
    }
};


//get single elections
exports.getSingleElection = async (req, res) => {
    //making sure only can admins can edit elections
    if (!req.user.isAdmin) {
        return res.json({ message: "only admins have access to this" })
    }
    const { id } = req.params;
    try {
        const singleElection = await ElectionModel.findById(id);
        if (!singleElection) {
            return res.json({ message: "no election found" })
        }
        res.status(200).json({ success: true, message: ' fetched election', data: singleElection })
    } catch (error) {
        res.status(500).json({ success: false, message: "failed to fetch single election", error: error.message })
    }
}

//get all the election candidates
exports.getAllCandidate = async (req, res) => {
    const { id } = req.params;
    try {
        const Candidates = await CandidateModel.find({ electionId: id });
        res.status(200).json({ success: true, message: ' fetched candidates', data: Candidates })
    } catch (error) {
        res.status(500).json({ message: 'failed to fetch candidate', error: error })
    }
}

//get all voters of an election
exports.electionVoters = async (req, res) => {
    //making sure only can admins can edit elections
    if (!req.user.isAdmin) {
        return res.json({ message: "only admins have access to this" })
    }
    const { id } = req.params;
    if(!id){
        res.status(402).json({message:"no id found"})
    }
    try {
        const VotersData = await ElectionModel.findById({ _id: id }).populate('Voters')
        if(!VotersData) {
            res.status(500).json({message:"no voters found"})
        }
        res.status(200).json({ success: true, message: "fetch voters successful", data: VotersData.Voters })
    } catch (error) {
        res.status(500).json({ message: "failed to fetch voters of the candidate", error: error })
    }
}



//update election
exports.updateElection = async (req, res) => {
    //making sure only can admins can edit elections
    if (!req.user.isAdmin) {
        return res.json({ message: "only admins have access to this" })
    }
    const { id } = req.params;
    try {
        const { Title, Description } = req.body;
        if (!Title || !Description) {
            return res.json({ message: 'fill in all fields' })
        }
        if (req.files.thumbnail) {
            const { thumbnail } = req.files;
            if (thumbnail.size > 1000000) {
                return res.json({ message: 'file too big... must be less tha 1mb' })
            }

            //rename filename
            fileName = thumbnail.name;
            fileName = fileName.split(".");
            fileName = fileName[0] + uuid() + "." + fileName[fileName.length - 1];

            //upload to uploads folder
            const filePath = Path.join(__dirname, '..', "uploads", fileName);

            await new Promise((resolve, reject) => {
                thumbnail.mv(filePath, (error) => {
                    if (error) {
                        reject(error); // Reject if there's an error
                    }
                    resolve(); // Resolve if no error
                });
            });
            //save to cloudinary

            const result = await cloudinary.uploader.upload(filePath, { resource_type: 'image' })
            if (!result.secure_url) {
                return res.json({ message: "failed to store in cloudinary" })
            }

            const newUpdate = await ElectionModel.findByIdAndUpdate(id, {
                Title,
                Description,
                thumbnail: result.secure_url
            },
                { new: true }
            )
            res.status(201).json({ success: true, message: 'updated succesfully', data: newUpdate })
        }
    } catch (error) {
        res.status(500).json({ message: "failed to update election", error: error.message })
    }
}


//DELETE ELECTIONS  
exports.deleteElection = async (req, res) => {
    //making sure only can admins can edit elections
    if (!req.user.isAdmin) {
        return res.json({ message: "only admins have access to this" })
    }
    const { id } = req.params;
    try {
        await ElectionModel.findByIdAndDelete(id);
        //making sure to delete the candidate in the election also 
        await CandidateModel.deleteMany({ electionId: id })
        res.status(200).json({ success: true, message: 'deleted succussfully' })
    } catch (error) {
        res.status(500).json({ message: 'failed to delete election', error: error.message })
    }
}
