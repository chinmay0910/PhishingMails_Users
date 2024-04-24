const campaign2users = require("../models/campaign2")
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

// Route 1: route for the api with the route og http://localhost:3300/createuser
const createUser = async (req, res) => {
    try {
        userEmail = (await campaign2users.find({ email: req.body.email })).length
        if (userEmail == 0) {
            const user = await campaign2users.create({
                email: req.body.Email
            })

            const data = {
                user: {
                    id: user._id
                }
            }

            const authtoken = jwt.sign(data, JWT_SECRET);

            success = true;
            res.json({ success, authtoken });
        } else {
            return res.status(400).json({ error: "Email Id already Exists" })
        }
    } catch (err) {
        res.status(500).send("Internal Server Error occured while Authennticating")
    }
}



module.exports = { createUser } 