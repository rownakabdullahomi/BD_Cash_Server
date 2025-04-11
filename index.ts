const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');

import { Request, Response } from "express";

const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());









const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.d3h8n.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const userCollection = client.db("bd_cash").collection("users");



    // Users APIs
    app.post("/users", async (req: Request, res: Response) => {
        // console.log(req.body);

        const query = { email: req.body.email };
        const existingUser = await userCollection.findOne(query);
        if (!existingUser) {
            // Insert new user into the database
            const result = await userCollection.insertOne(req.body);
            res.send(result);
        }
        else {
            res.send({ message: "User already exists in the database" });
        }
    })






















    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);













app.get('/', (req: Request, res: Response) => {
  res.send('Node + TypeScript Server is running!');
});

app.listen(port, () => {
  console.log(`Hello Server running on http://localhost:${port}`);
});

export default app;