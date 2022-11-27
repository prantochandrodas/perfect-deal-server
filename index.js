const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pbafkul.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req,res,next){
    const authHeader= req.headers.authorization;
    if(!authHeader){
      return  res.status(401).send('unauthorized access');
    }
    const token=authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
        if(err){
            return res.status(403).send({message:'Forbiden access'})
        }
        req.decoded=decoded;
        next();
    })
}

const verifyAdmin = async (req, res, next) => {
    // console.log('inside verify admin ',req.decoded.email);
    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail };
    const user = await usersCollection.findOne(query);
    if (user?.role !== "admin") {
        return res.status(403).send({ message: 'frobidden access' })
    }
    next();
}
async function run() {
    try {

        //JWT
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            }
            const user = await userCollection.findOne(query);
            if (user && user.email) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.send({ accessToken: '' });
        });

        // get category data
        const productCategoryCollection = client.db('PerfectDealDb').collection('ProductCategoryCollection');
        const userCollection = client.db('PerfectDealDb').collection('usersCollection');
        const allProductsCollection = client.db('PerfectDealDb').collection('allProductsCollection');
        const bookingCollection = client.db('PerfectDealDb').collection('bookingCollection');
        app.get('/productCategorys', async (req, res) => {
            const query = {};
            const result = await productCategoryCollection.find(query).toArray();
            res.send(result);
        });



        // add user
        app.post('/users', async (req, res) => {
            const users = req.body;
            const result = await userCollection.insertOne(users);
            res.send(result);
        });

        //is user is admin 
        app.get('/user/admin/:email',async(req,res)=>{
            const email=req.params.email;
            const query={email};
            const user=await userCollection.findOne(query);
            res.send({isAdmin:user?.role==='admin'});
        });

        // is user is seller
        app.get('/user/seller/:email',async(req,res)=>{
            const email=req.params.email;
            const query={email};
            const user=await userCollection.findOne(query);
            res.send({isSeller:user?.role==='seller'});
        });
        // get all users
        app.get('/allUsers',async(req,res)=>{
            const query={ role:'buyer'};
            const result=await userCollection.find(query).toArray();
            res.send(result);
        });

        // all sellers
        app.get('/allSellers',async(req,res)=>{
            const query={ role:'seller'};
            const result=await userCollection.find(query).toArray();
            res.send(result);
        });
        // delete a user
        app.delete('/users/:id',async(req,res)=>{
            const id=req.params.id;
            const query={_id:ObjectId(id)};
            const result=await userCollection.deleteOne(query);
            res.send(result);
        });

        // all products
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { category_id: (id) }
            const result = await allProductsCollection.find(query).toArray();
            res.send(result);
        });

        // add email
        //  app.get('/addEmail',async(req,res)=>{
        //     const filter={};
        //     const option = {upsert:true}
        //     const updatedDoc={
        //         $set:{
        //             email: 'sagor@gmail.com'
        //         }
        //     }
        //     const result = await allProductsCollection.updateMany(filter,updatedDoc,option);
        //     res.send(result);
        // });


        app.post('/addProduct',async(req,res)=>{
            const product=req.body;
            const result=await allProductsCollection.insertOne(product);
            res.send(result);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);

        });

        // get my oders
        app.get('/myorder',async(req,res)=>{
            // const decodedEmail=req.decoded.email;
            // if(email !== decodedEmail){
                //     return res.status(403).send({message:'forbidden access'});
                // }
                
                // console.log('token', req.headers.authorization);
                const email=req.query.email;
                const query={email:email}
            const result=await bookingCollection.find(query).toArray();
            res.send(result);
        })

        // 

    } finally {

    }
}
run().catch(error => console.log(error));




app.get('/', (req, res) => {
    res.send('server is running');
});



app.listen(port, () => console.log('server is running on', port));