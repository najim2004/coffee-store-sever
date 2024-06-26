const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
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
    await client.connect();

    const database = client.db("coffeeStoreDB").collection("coffees");

    // get all coffees
    app.get("/coffees", async (req, res) => {
      const coffees = await database.find().toArray();
      res.json(coffees);
    });

    // get single coffee
    app.get("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const coffee = await database.findOne({ _id: new ObjectId(id) });
      res.json(coffee);
    });

    // set single coffee
    app.post("/coffees", async (req, res) => {
      const newCoffee = req.body;
      console.log("this is new coffee:", newCoffee);
      const result = await database.insertOne(newCoffee);
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
      const result = await database.updateOne(findId, updatedCoffee, options);
      res.json(result);
    });

    // delete single coffee
    app.delete("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const findId = { _id: new ObjectId(id) };
      const result = await database.deleteOne(findId);
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
