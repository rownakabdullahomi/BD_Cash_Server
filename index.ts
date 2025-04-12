const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");

import { Request, Response } from "express";
import { ObjectId } from "mongodb";

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
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("bd_cash").collection("users");
    const transactionCollection = client
      .db("bd_cash")
      .collection("transactions");

    // Users APIs
    app.post("/users", async (req: Request, res: Response) => {
      // console.log(req.body);

      const query = { email: req.body.email };
      const existingUser = await userCollection.findOne(query);
      if (!existingUser) {
        // Insert new user into the database
        const result = await userCollection.insertOne(req.body);
        res.send(result);
      } else {
        res.send({ message: "User already exists in the database" });
      }
    });

    // get a specific user role
    app.get("/user/role/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      const query = { email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post("/add-money-request", async (req: Request, res: Response) => {
      const result = await transactionCollection.insertOne(req.body);
      res.send(result);
    });
    app.post("/pay-money-request", async (req: Request, res: Response) => {
      const result = await transactionCollection.insertOne(req.body);
      res.send(result);
    });

    // get all transactions
    app.get("/transactions", async (req: Request, res: Response) => {
      const result = await transactionCollection.find().toArray();
      res.send(result);
    });
    // get a transaction by id
    app.get("/transaction/:id", async (req: Request, res: Response) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await transactionCollection.findOne(query);
      res.send(result);
    });
    // get the latest transaction by email
    app.get("/latest/transaction/:email", async (req: Request, res: Response) => {
      const email = req.params.email;
      const query = { createdBy : email };
      const result = await transactionCollection.findOne(query, {
        sort: { _id: -1 }, // or `_id: -1` 
      });
      res.send(result);
    });

    app.patch("/transaction/:id", async (req: Request, res: Response) => {
      const id = req.params.id;
      const { requestAmount, transactionType, currentBalance, totalAdded, totalPaid, status } = req.body;
      const query = { _id: new ObjectId(id) };
      
     
    // Define the base update operation
    const updateDoc: {
      $set: { status: string };
      $inc: {
        currentBalance?: number;
        totalAdded?: number;
        totalPaid?: number;
      };
    } = {
      $set: { status },
      $inc: {}
    };

     const amount = parseFloat(requestAmount);

    if (transactionType === "Add Money") {
      updateDoc.$inc.currentBalance = amount;
      updateDoc.$inc.totalAdded = amount;
    } 
    else if (transactionType === "Pay Money") {
      updateDoc.$inc.currentBalance = -amount;
      updateDoc.$inc.totalPaid = amount;
    }

      const result = await transactionCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req: Request, res: Response) => {
  res.send("Node + TypeScript Server is running!");
});

app.listen(port, () => {
  console.log(`Hello Server running on http://localhost:${port}`);
});

export default app;
