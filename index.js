const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pbafkul.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{

        // get category data
        const productCategoryCollection=client.db('PerfectDealDb').collection('ProductCategoryCollection');

        app.get('/ProductCategory',async(req,res)=>{
            const query={};
            const result= await productCategoryCollection.find(query).toArray();
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