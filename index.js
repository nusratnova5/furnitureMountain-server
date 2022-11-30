const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express ();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cifvw1u.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const categoryCollection =client.db('resaleMarket').collection('categories');
        const categoryDetailsCollection =client.db('resaleMarket').collection('category_details');
        const bookingCollection =client.db('resaleMarket').collection('bookings');
        const usersCollection = client.db('resaleMarket').collection('users');

        // app.get('/categories',async(req,res)=>{
        //     const query = {};
        //     const options= await categoryCollection.find(query).toArray();
        //     res.send(options);
        // })
        app.get('/categories', async (req,res)=>{
            const query ={}
            const cursor = categoryCollection.find(query);
            const categories = await cursor.sort({_id: -1}).toArray();
            res.send(categories);
        })
        
        app.get('/category_details', async(req, res) => {
            let query = {};
            if(req.query.id){
                query={
                    categoryID: req.query.id
                }
            };
            const category_details = await categoryDetailsCollection.find(query).toArray();
            res.send(category_details);
        });

        /* Bookingssssssssssss */
        app.post('/bookings', async (req, res) => {
            const body = req.body;
            const result = await bookingCollection.insertOne(body);
            res.send(result);
        });

        app.get('/bookings', async (req, res) => {
            let query = {};
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            };

            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        });


        /* Users */
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
                return res.send({accessToken: token});
            }
            console.log(user);
            res.status(403).send({accessToken: ''});
        })

        app.post('/users', async (req, res) => {
            const body = req.body;
            const result = await usersCollection.insertOne(body);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            let query = {};
            if(req.query.role){
                query = {
                    role: req.query.role
                }
            };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        /* Make admin */
        app.put('/users/admin/:id',verifyJWT, async(req, res) => {
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query);
            if(user?.role !== 'admin'){
                return res.status(403).send({messasge: 'forbidden'})
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        /* Check Admin */
        app.get('/users/admin/:email', async(req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send( {isAdmin: user?.role === 'admin'} );
        });

        /* Seller Check */
        app.get('/users/seller/:email', async(req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send( {isSeller: user?.role === 'Seller'} );
        });

        app.delete('/user/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const users = await usersCollection.deleteOne(query);
            res.send(users);
        })

    }
    finally{

    }
}


run().catch(err=>console.error(err));


app.get('/', async (req,res)=>{
    res.send('resale market running');
})

app.listen(port , ()=> console.log(`resale portal running on ${port}`));