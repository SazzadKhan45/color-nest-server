const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Mongo_db info
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
//
async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const db = client.db("ArtifyNest_db");
    const artsCollection = db.collection("arts");
    const addGalleyCollection = db.collection("add_galley");
    const userCollection = db.collection("user");

    // Post Art work Api
    app.post("/explore-art", async (req, res) => {
      try {
        const newArt = req.body;
        // Insert into MongoDB collection
        const result = await artsCollection.insertOne(newArt);
        res.send(result);
      } catch (error) {
        console.error("Error adding artwork:", error);
        res.status(500).json({
          success: false,
          message: "Failed to add artwork",
          error: error.message,
        });
      }
    });

    // Get art api for home page
    app.get("/homepage-art", async (req, res) => {
      try {
        // Fetch 6 latest artworks
        const cursor = artsCollection.find().sort({ postedAt: -1 }).limit(6);
        const result = await cursor.toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching homepage artworks:", error);
        res.status(500).json({ message: "Failed to load homepage artworks" });
      }
    });

    //Explore All artworks api
    app.get("/explore-art", async (req, res) => {
      try {
        // Fetch 6 latest artworks
        const cursor = artsCollection.find();
        const result = await cursor.toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching homepage artworks:", error);
        res.status(500).json({ message: "Failed to load homepage artworks" });
      }
    });

    //Get art by id api
    app.get("/explore-art/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await artsCollection.findOne(query);

        if (!result) {
          return res.status(404).json({ message: "Artwork not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching artwork by ID:", error);
        res.status(500).json({ message: "Failed to fetch artwork" });
      }
    });

    // Add gallery post api
    app.post("/add-gallery", async (req, res) => {
      const newAddGallery = req.body;
      const result = await addGalleyCollection.insertOne(newAddGallery);
      res.send(result);
    });

    // Get add gallery post api
    app.get("/add-gallery", async (req, res) => {
      try {
        const email = req.query.email; // get email from query ?email=value

        let query = {};
        if (email) {
          query = { userEmail: email };
        }

        const cursor = addGalleyCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    // Add Gallery item delete api
    app.delete("/add-gallery/:id", async (req, res) => {
      try {
        const artId = req.params.id;
        const query = { id: artId };

        const result = await addGalleyCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.send({
            success: true,
            message: "Gallery item deleted successfully.",
          });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Gallery item not found." });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Server error while deleting." });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    //
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
