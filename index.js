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
    const myFavoritesCollection = db.collection("my-favorites");
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

    // Like or Unlike art
    app.patch("/artData/like/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.body.email;

      const query = { _id: new ObjectId(id) };
      const alreadyLiked = await artsCollection.findOne({
        _id: new ObjectId(id),
        likedBy: userEmail,
      });

      if (alreadyLiked) {
        // If user already liked, remove their like
        const updateDoc = {
          $inc: { likeCount: +1 },
          $pull: { likedBy: userEmail },
        };
        await artsCollection.updateOne(query, updateDoc);
        return res.send({ message: "Like removed" });
      } else {
        // If not liked yet
        const updateDoc = {
          $inc: { likeCount: 1 },
          $push: { likedBy: userEmail },
        };
        await artsCollection.updateOne(query, updateDoc);
        return res.send({ message: "Liked successfully" });
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
    app.get("/gallery/:email", async (req, res) => {
      try {
        const userEmail = req.params.email;
        const query = { email: userEmail };
        const result = await artsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching gallery data:", error);
        res.status(500).send({ message: "Failed to fetch gallery data" });
      }
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

    // Get Favorites api
    app.get("/myFavorites", async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { email: email } : {};
        const result = await myFavoritesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // MyFavorites post data api
    app.post("/myFavorites", async (req, res) => {
      const cursor = req.body;
      const result = await myFavoritesCollection.insertOne(cursor);
      res.send(result);
    });

    // Add Gallery item delete api
    app.delete("/add-gallery/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await artsCollection.deleteOne({
          _id: new ObjectId(id),
        });
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
        res
          .status(500)
          .send({ success: false, message: "Server error while deleting." });
      }
    });

    // My Favorites art remove database api
    app.delete("/myFavorites/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { artId: id };

        const result = await myFavoritesCollection.deleteOne(query);

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
