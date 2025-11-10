const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
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
    const userCollection = db.collection("user");

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

    // POST API
    app.post("/test", async (req, res) => {
      try {
        const data = req.body; // get data from frontend
        const result = await artsCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error inserting data" });
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
