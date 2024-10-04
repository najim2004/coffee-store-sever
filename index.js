const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Coffee making server is running");
});

// ---------------- mongodb ----------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d0cidbu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const coffeeCollection = client.db("coffeeStoreDB").collection("coffees");
    const usersCollection = client.db("coffeeStoreDB").collection("users");

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("42", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          // sameSite: "none",
        })
        .send({ success: true });
    });

    // get all coffees
    app.get("/coffees", async (req, res) => {
      const coffees = await coffeeCollection.find().toArray();
      console.log("cookies", req.cookies.token);
      res.json(coffees);
    });

    // get single coffee
    app.get("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const coffee = await coffeeCollection.findOne({ _id: new ObjectId(id) });
      res.json(coffee);
    });

    // set single coffee
    app.post("/coffees", async (req, res) => {
      const newCoffee = req.body;
      console.log("this is new coffee:", newCoffee);
      const result = await coffeeCollection.insertOne(newCoffee);
      res.json(result);
    });

    // update single coffee
    app.put("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const coffee = req.body;
      const findId = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedCoffee = {
        $set: {
          Name: coffee.Name,
          Chef: coffee.Che,
          Supplier: coffee.Supplier,
          Taste: coffee.Taste,
          Price: coffee.Price,
          Category: coffee.Category,
          Details: coffee.Details,
          Photo: coffee.Photo,
        },
      };
      const result = await coffeeCollection.updateOne(
        findId,
        updatedCoffee,
        options
      );
      res.json(result);
    });

    // delete single coffee
    app.delete("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const findId = { _id: new ObjectId(id) };
      const result = await coffeeCollection.deleteOne(findId);
      res.json(result);
    });

    // user related apis
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.json(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.json(result);
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

// ---------------- mongodb ----------------

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
