require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");

import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";

const cors = require("cors");
import jwt, { VerifyErrors } from "jsonwebtoken";
const cookieParser = require("cookie-parser");

const app = express();

const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
  optionalSuccessStatus: 200,
};

//  Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d3h8n.mongodb.net/?appName=Cluster0`;

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

    // Generate jwt
    app.post("/jwt", async (req: Request, res: Response) => {
      const email = req.body;
      // create token
      const token = jwt.sign(email, process.env.SECRET_KEY as string, {
        expiresIn: "5d",
      });
      // console.log(token)
      // res.send(token)
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // verifyToken
    const verifyToken = (req: Request, res: Response, next: NextFunction) => {
      const token = req.cookies?.token;
      // console.log(token);
      if (!token)
        return res.status(401).send({ message: "unauthorized access" });
      jwt.verify(
        token,
        process.env.SECRET_KEY as string,
        (err: VerifyErrors | null, decoded: any) => {
          if (err) {
            return res.status(401).send({ message: "unauthorized access" });
          }
          (req as Request & { user?: any }).user = decoded;
        }
      );
      next();
    };

    // Remove cookie from browser when logout
    app.get("/logout", async (req: Request, res: Response) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

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

    // get all users
    app.get("/all/users", verifyToken, async (req: Request, res: Response) => {
      const type = "user";
      const query = { type };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // delete a user
    app.delete(
      "/delete/user/:email",
      verifyToken,
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const query = { email };
        const result = await userCollection.deleteOne(query);
        res.send(result);
      }
    );

    // get a specific user role
    app.get(
      "/user/role/:email",
      verifyToken,
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const query = { email };
        const result = await userCollection.findOne(query);
        res.send(result);
      }
    );

    app.post(
      "/add-money-request",
      verifyToken,
      async (req: Request, res: Response) => {
        const result = await transactionCollection.insertOne(req.body);
        res.send(result);
      }
    );
    app.post(
      "/pay-money-request",
      verifyToken,
      async (req: Request, res: Response) => {
        const result = await transactionCollection.insertOne(req.body);
        res.send(result);
      }
    );

    // get all transactions
    app.get(
      "/transactions",
      verifyToken,
      async (req: Request, res: Response) => {
        const result = await transactionCollection.find().toArray();
        res.send(result);
      }
    );

    // get all transactions of a user
    app.get(
      "/all/transactions/:email",
      verifyToken,
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const query = { createdBy: email };
        const result = await transactionCollection.find(query).toArray();
        res.send(result);
      }
    );

    // get a transaction by id
    app.get(
      "/transaction/:id",
      verifyToken,
      async (req: Request, res: Response) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await transactionCollection.findOne(query);
        res.send(result);
      }
    );
    // get the latest transaction by email
    app.get(
      "/latest/transaction/:email",
      verifyToken,
      async (req: Request, res: Response) => {
        const email = req.params.email;
        const query = { createdBy: email };
        const result = await transactionCollection.findOne(query, {
          sort: { _id: -1 }, // or `_id: -1`
        });
        res.send(result);
      }
    );

    app.patch(
      "/transaction/:id",
      verifyToken,
      async (req: Request, res: Response) => {
        const id = req.params.id;
        const {
          requestAmount,
          transactionType,
          currentBalance,
          totalAdded,
          totalPaid,
          status,
        } = req.body;
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
          $inc: {},
        };

        const amount = parseFloat(requestAmount);

        if (transactionType === "Add Money") {
          updateDoc.$inc.currentBalance = amount;
          updateDoc.$inc.totalAdded = amount;
        } else if (transactionType === "Pay Money") {
          updateDoc.$inc.currentBalance = -amount;
          updateDoc.$inc.totalPaid = amount;
        }

        const result = await transactionCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    );

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
