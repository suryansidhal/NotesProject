require("dotenv").config();

const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Note = require("./models/Note");
const authMiddleware = require("./middleware/authMiddleware");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/notes", authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;

        const note = new Note({
            title,
            content,
            userId: req.userId
        });

        await note.save();

        res.status(201).json({
            message: "Note created successfully",
            note
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/notes", authMiddleware, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.userId });

        res.status(200).json({
            notes
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.delete("/notes/:id", authMiddleware, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
    }
});

app.put("/notes/:id", authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;

        const note = await Note.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.userId
            },
            {
                title,
                content
            },
            {
                new: true
            }
        );

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        res.status(200).json({
            message: "Note updated successfully",
            note
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } 
    catch (error) {
    console.log("ERROR NAME:", error.name);
    console.log("ERROR MESSAGE:", error.message);
    }
}

connectDB();