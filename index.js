const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express ();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.cifvw1u.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const categoryCollection =client.db('resaleMarket').collection('categories');

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
        
        const categoryDetailsCollection =client.db('resaleMarket').collection('category_details');
        app.get('/category_details', async(req, res) => {
            let query = {};
            if(req.query.id){
                query={
                    categoryID: req.query.id
                }
            };
            const category_details = await categoryDetailsCollection.find(query).toArray();
            res.send(category_details);
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