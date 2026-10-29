import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from 'jose';

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
const bookingCollection = db.collection("bookings")


const verifyToken = async (req, res, next) =>{
  const authHeader = req.headers.authorization
  // console.log(authHeader)
  if(!authHeader){
    return res.status(401).send({ msg: "Unauthorized!" })
  }
  const token = authHeader.split(" ")[1]
  if(!token){
    return res.status(401).send({ msg: "Unauthorized!" })
  }

  const JWKS = createRemoteJWKSet( new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))

  try{
    const {payload} = await jwtVerify(token, JWKS)
    console.log(payload)
    next()
  }
  catch(error){
    return res.status(500).send({ msg: "Server Error!" })
  }

}

// add destination api
app.post("/add-destination", verifyToken, async (req, res) => {
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

// show destination
app.get("/destinations", async(req, res)=>{
    const data = await destinationCollection.find().toArray()
    res.send(data)
})

// show featured-destinations
app.get("/featured-destinations", async(req, res)=>{
    const data = await destinationCollection.find().limit(5).toArray()
    res.send(data)
})

// destination details
app.get("/destinations/:id", verifyToken, async(req, res)=>{
  const {id} = req.params;
  const result = await destinationCollection.findOne({_id: new ObjectId(id)})
  res.send(result)
})

// update destination
app.patch("/destinations/:id", verifyToken, async(req, res) =>{
  const {id} = req.params
  const updatedData = req.body
  const result = await destinationCollection.updateOne(
    {_id: new ObjectId(id)},
    {$set: updatedData}
  )
  res.json(result)
})


// delete destination
app.delete("/destinations/:id",verifyToken, async(req, res)=>{
  const {id} = req.params
  const result = await destinationCollection.deleteOne({_id: new ObjectId(id)})
  res.json(result)
})

// app.post("/booking", async(req, res)=>{
//   const data = req.body
//   const result = await bookingCollection.insertOne(data)
//   res.send(result)
// })

// booking email
app.post("/booking", verifyToken, async (req, res) => {
  try {
    const { _id, ...data } = req.body;

    const destinationId = _id;

    // Check existing booking
    const existingBooking = await bookingCollection.findOne({
      email: data.email,
      destinationId: destinationId,
    });

    if (existingBooking) {
      return res.status(409).send({
        success: false,
        message: "You have already booked this destination!",
      });
    }

    // Save booking
    const bookingData = {
      ...data,
      destinationId,
    };

    const result = await bookingCollection.insertOne(bookingData);

    res.status(201).send({
      success: true,
      message: "Booking successful!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Booking error:", error);

    res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
});

app.get("/my-bookings/:email", verifyToken, async(req, res)=>{
  const {email} = req.params
  const result = await bookingCollection.find({email: email}).toArray()
  res.send(result)
})

app.delete("/my-booking/:id", verifyToken, async(req, res)=>{
  const {id} = req.params
  const result = await bookingCollection.deleteOne({_id: new ObjectId(id)})
  res.send(result)
})

app.get("/", (req, res)=>{
    res.send({message: "Server is running is fine!"})
})

app.listen(PORT, ()=>{
    console.log(`Server is running at ${PORT}`)
})

export default app;