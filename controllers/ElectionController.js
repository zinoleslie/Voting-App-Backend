const ElectionModel = require("../model/ElectionModel");
const CandidateModel = require("../model/CandidateModel");
const VotersModel = require("../model/VotersModel");
const { v4: uuid } = require("uuid");
const cloudinary = require("../utils/cloudinary");
const Path = require("path");
const streamifier = require("streamifier");





exports.createElection = async (req, res) => {
    console.log("User info in createElection:", req.user);
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admins have access to this" });
    }

    try {
        const { Title, Description } = req.body;
        if (!Title || !Description) {
            return res.status(422).json({ message: "Fill in all fields" });
        }

        if (!req.files || !req.files.thumbnail) {
            return res.status(422).json({ message: "Choose a thumbnail" });
        }

        const { thumbnail } = req.files;
        if (thumbnail.size > 1000000) {
            return res.status(422).json({ message: "File too big. Choose a file with less than 1MB" });
        }

        // Use a Promise to handle Cloudinary upload
        const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: "image", folder: "elections" },
                (error, result) => {
                    if (error || !result.secure_url) {
                        reject({ message: "Couldn't save image to Cloudinary", error });
                    } else {
                        resolve(result.secure_url);
                    }
                }
            );

            // Convert file buffer into a readable stream
            streamifier.createReadStream(thumbnail.data).pipe(stream);
        });

        const imageUrl = await uploadPromise;

        // Save the election data in the database
        const newElection = new ElectionModel({
            Title,
            Description,
            thumbnail: imageUrl, // Store the Cloudinary URL
        });

        const savedElection = await newElection.save();
        res.status(200).json({
            success: true,
            message: "Election created successfully",
            data: savedElection,
        });

    } catch (error) {
        res.status(500).json({ message: "Failed to create election", error: error.message });
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




exports.updateElection = async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admins have access to this" });
    }

    const { id } = req.params;
    try {
        const { Title, Description } = req.body;
        if (!Title || !Description) {
            return res.status(422).json({ message: "Fill in all fields" });
        }

        let updatedData = { Title, Description };

        if (req.files && req.files.thumbnail) {
            const { thumbnail } = req.files;
            if (thumbnail.size > 1000000) {
                return res.status(422).json({ message: "File too big... must be less than 1MB" });
            }

            // Upload image directly to Cloudinary using Streamifier
            const uploadPromise = new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: "image", folder: "elections" },
                    (error, result) => {
                        if (error || !result.secure_url) {
                            reject({ message: "Failed to upload image to Cloudinary", error });
                        } else {
                            resolve(result.secure_url);
                        }
                    }
                );

                streamifier.createReadStream(thumbnail.data).pipe(stream);
            });

            const imageUrl = await uploadPromise;
            updatedData.thumbnail = imageUrl; // Store Cloudinary URL
        }

        const updatedElection = await ElectionModel.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedElection) {
            return res.status(404).json({ message: "Election not found" });
        }

        res.status(200).json({
            success: true,
            message: "Election updated successfully",
            data: updatedElection,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update election", error: error.message });
    }
};

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
