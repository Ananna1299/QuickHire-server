const express = require('express')
const cors = require("cors");
const app = express()
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000;



//middleware
app.use(express.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5w0kzva.mongodb.net/?appName=Cluster0`;

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
    await client.connect();


    const dB = client.db("quick_hire_db");
    const usersCollection = dB.collection("users");
    const jobsCollection = dB.collection('jobs');


    //user data post api
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "admin";
      user.createdAt = new Date();
      const email = user.email;
;

      const userExists = await usersCollection.findOne({ email });
      if (userExists) {
        return res.send({ message: "User already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });


    //post api
       app.post('/jobs', async (req, res) => {
            const newjob = req.body;
            newjob.created_at=new Date().toISOString()
            const result = await jobsCollection.insertOne(newjob);
            res.send(result);
        })


        // 6 featured course
      app.get('/feature-jobs', async (req, res) => {
            const cursor = jobsCollection.find().limit(8);
            const result = await cursor.toArray();
            res.send(result);


        })


        app.get('/sort-jobs', async (req, res) => {
            const cursor = jobsCollection.find();
            const result = await cursor.toArray();
            res.send(result);


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

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
