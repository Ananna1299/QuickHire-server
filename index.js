const express = require('express')
const cors = require("cors");
const app = express()
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;



//middleware
app.use(express.json());
app.use(cors());


// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded files statically
app.use("/uploads", express.static(uploadsDir));









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
     const applicationsCollection = dB.collection("applications");


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

       //latest jobs
        app.get('/sort-jobs', async (req, res) => {
            const cursor = jobsCollection.find();
            const result = await cursor.toArray();
            res.send(result);


        })


        //get all courses
     app.get('/jobs', async (req, res) => {
      const {search="",type}=req.query

      
      const query = search
        ? { title: { $regex: search, $options: "i" } }
        : {};


         if (type && type !== "All") {
        query.tags = type;
      }

        
           const job = await jobsCollection.find(query).toArray();


         
          res.send(job)
});



//get api(get a specific job)
    app.get("/jobs/:id",async(req,res)=>{
        const id=req.params.id;
        console.log(id)
        const query={_id: new ObjectId(id)}
        const result = await jobsCollection.findOne(query);
        //console.log(result)
        res.send(result)
    })



    //application 
    const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `resume-${Date.now()}${ext}`);
      },
    });

    const upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (req, file, cb) => {
        const allowed = [".pdf", ".doc", ".docx"];
        if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
          return cb(new Error("Only PDF, DOC, DOCX allowed"));
        }
        cb(null, true);
      },
    });

    //post application
     app.post("/application", upload.single("resume"), async (req, res) => {
      try {
        const { job_id, title, name, email, cover_note } = req.body;

        // Check duplicate
        const existingApplication = await applicationsCollection.findOne({
          job_id,
          email,
        });
        if (existingApplication) {
          return res.status(400).send({
            success: false,
            message: "You have already applied for this job!",
          });
        }

        // Insert application
        const newApplication = {
          job_id,
          title,
          name,
          email,
          cover_note: cover_note || "",
          resume_link: req.file ? `/uploads/${req.file.filename}` : "",
          created_at: new Date(),
        };

        const result = await applicationsCollection.insertOne(newApplication);

        res.send({
          success: true,
          message: "Application submitted successfully!",
          result,
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Server error" });
      }
    })


   


// delete job
app.delete("/jobs/:id", async (req, res) => {
  const id = req.params.id;

  const query = { _id: new ObjectId(id) };
  const result = await jobsCollection.deleteOne(query);

  res.send(result);
});






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
