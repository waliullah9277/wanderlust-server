import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from 'cors'

const app = express()
const PORT = 8000

app.use(cors())
app.use(express.json())


const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB()
const db = mongoClient.db('wanderlust')
const destinationCollection = db.collection("destination")


app.post("/add-destination", async (req, res) => {
    try {
        const data = req.body;

        const result = await destinationCollection.insertOne(data);

        res.status(201).json({
            success: true,
            message: "Destination added successfully",
            insertedId: result.insertedId,
        });
    } catch (error) {
        console.error("Add destination error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add destination",
        });
    }
});


app.get("/destinations", async(req, res)=>{
    const data = await destinationCollection.find().toArray()
    res.send(data)
})

app.get("/destinations/:id", async(req, res)=>{
  const {id} = req.params;
  const result = await destinationCollection.findOne({_id: new ObjectId(id)})
  res.send(result)
})

app.patch("/destinations/:id", async(req, res) =>{
  const {id} = req.params
  const updatedData = req.body
  const result = await destinationCollection.updateOne(
    {_id: new ObjectId(id)},
    {$set: updatedData}
  )
  res.json(result)
})

app.delete("/destinations/:id", async(req, res)=>{
  const {id} = req.params
  const result = await destinationCollection.deleteOne({_id: new ObjectId(id)})
  res.json(result)
})

app.get("/", (req, res)=>{
    res.send({message: "Server is running is fine!"})
})

app.listen(PORT, ()=>{
    console.log(`Server is running at ${PORT}`)
})