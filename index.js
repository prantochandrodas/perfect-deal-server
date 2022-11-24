const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pbafkul.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const verifyAdmin =async(req,res,next)=>{
    console.log('inside verify admin ',req.decoded.email);
    const decodedEmail=req.decoded.email;
    const query={email:decodedEmail};
    const user=await usersCollection.findOne(query);
    if(user?.role !== "admin"){
        return res.status(403).send({message:'frobidden access'})
    }
    next();
 } 
async function run(){
    try{

        //JWT
        app.get('/jwt',async(req,res)=>{
            const email=req.query.email;
            const query={
                email:email
            }
            const user=await userCollection.findOne(query);
            if(user && user.email){
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.send({accessToken:''});
        });

        // get category data
        const productCategoryCollection=client.db('PerfectDealDb').collection('ProductCategoryCollection');
        const userCollection=client.db('PerfectDealDb').collection('usersCollection');
        app.get('/productCategorys',async(req,res)=>{
            const query={};
            const result= await productCategoryCollection.find(query).toArray();
            res.send(result);
        });
        
        // add user
        app.post('/users',async(req,res)=>{
            const users=req.body;
            const result=await userCollection.insertOne(users);
            res.send(result);
        });



    }finally{

    }
}   
run().catch(error=>console.log(error));




app.get('/', (req, res) => {
    res.send('server is running');
});



app.listen(port, () => console.log('server is running on', port));