const express = require('express');
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pbafkul.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        // get category data
        const productCategoryCollection = client.db('PerfectDealDb').collection('ProductCategoryCollection');
        const userCollection = client.db('PerfectDealDb').collection('usersCollection');
        const allProductsCollection = client.db('PerfectDealDb').collection('allProductsCollection');
        const bookingCollection = client.db('PerfectDealDb').collection('bookingCollection');
        const paymentCollection = client.db('PerfectDealDb').collection('paymentCollection');
        const wishListCollection = client.db('PerfectDealDb').collection('wishListCollection');
        const advertiseCollection = client.db('PerfectDealDb').collection('advertiseCollection');
        app.get('/productCategorys', async (req, res) => {
            const query = {};
            const result = await productCategoryCollection.find(query).toArray();
            res.send(result);
        });
        app.get('/allProduct',async(req,res)=>{
            const query={ paid: false};
            const result=await allProductsCollection.find(query).toArray();
            res.send(result);
        })
        // add user
        app.post('/users', async (req, res) => {
            const users = req.body;
            console.log(users)
            const result = await userCollection.insertOne(users);
            res.send(result);
        });

        // 
        app.put('/googleUser', async (req, res) => {
            const email = req.query.email;
            const name = req.query.name;
            console.log(name)
            const filter = { email: (email) };
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'buyer',
                    name: name

                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, option);
            res.send(result);
        });

  

        // get all users
        app.get('/allUsers', async (req, res) => {
            const query = { role: 'buyer' };
            const result = await userCollection.find(query).toArray();
            res.send(result);
        });

        // all sellers
        app.get('/allSellers', async (req, res) => {
            const query = { role: 'seller' };
            const result = await userCollection.find(query).toArray();
            res.send(result);
        });





        app.put('/allSellers/verified/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            const filter = { email: (email) };
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    verified: 'verified'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, option);
            res.send(result);
        });



        // update unverify
        app.put('/allSellers/unverifyed/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const filter = { email: (email) };
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    verified: 'unverified'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, option);
            res.send(result);
        });


        // delete a user
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });


        // seller delete

        app.delete('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });
        // all products
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = {
                category_id: (id),
                paid: false
            }
            const result = await allProductsCollection.find(query).toArray();
            res.send(result);
        });



        // get all seller product
        app.get('/myproducts', async (req, res) => {
            const selleremail = req.query.email;
            console.log(selleremail);
            const query = { email: selleremail };
            const result = await allProductsCollection.find(query).toArray();
            res.send(result);
        });


        // add advertisecollection 
        app.put('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }

            const result = await allProductsCollection.updateOne(filter, updatedDoc, option);
            res.send(result);
        });

        // delete my product

        app.get('/allProduct/advetrise', async (req, res) => {
            const query = {
                advertise: true,
                paid: false
            };
            const result = await allProductsCollection.find(query).toArray();
            res.send(result);
        });
        //get user 
        app.get('/getUser', async (req, res) => {
            const useremail = req.query.email;
            console.log(useremail);
            const query = { email: useremail }
            const result = await userCollection.findOne(query);
            console.log(result);
            res.send(result);
        });

        // demo for update some data 

        // app.get('/add',async(req,res)=>{
        //     const filter={};
        //     const option = { upsert: true }
        //     const updatedDoc = {
        //         $set: {
        //             advertise: false
        //         }
        //     }
        //     const result = await allProductsCollection.updateMany(filter, updatedDoc, option);
        //     res.send(result);
        // }); 




        app.delete('/myproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await allProductsCollection.deleteOne(query);
            res.send(result);
        });

        app.post('/addProduct', async (req, res) => {
            const product = req.body;
            console.log(product);
            const result = await allProductsCollection.insertOne(product);
            res.send(result);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const id=req.body.order_id;
            const newEmail = req.body.email;
            const query = { order_id: id, email: newEmail };
            const findOrder = await bookingCollection.findOne(query);
            if (findOrder) {
                res.send(false);
            } else {
                const result = await bookingCollection.insertOne(booking);
                res.send(result);
            }
        });


        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.resale_price;
            const order_id = booking.order_id;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,

                // order_id:order_id,
                "payment_method_types": [
                    "card"
                ]
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) };
            const order_id = payment.order_id;
            console.log(order_id);
            const newFilter = { _id: ObjectId(order_id) };
            const option = { upsert: true };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateResult = await bookingCollection.updateOne(filter, updatedDoc, option);
            const productResult = await allProductsCollection.updateOne(newFilter, updatedDoc, option);
            res.send(result);
        });



        //get bookings with id 
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.findOne(query);
            res.send(result);
        });

        // get my oders
        app.get('/myorder', async (req, res) => {
            
            const email = req.query.email;
            const query = { email: email }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })


        // my wishList
        app.post('/wishlist', async (req, res) => {
            const wishList = req.body;
            const id = req.body.product_id;
            const newEmail = req.body.email;
            const query = { product_id: id, email: newEmail }
            const findOrder = await wishListCollection.findOne(query);
            if (findOrder) {
                res.send(false);
            } else {
                const result = await wishListCollection.insertOne(wishList);
                res.send(result);
            }
        });
        // get user wishlist data
        app.get('/wishlists', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await wishListCollection.find(query).toArray();
            res.send(result);
        });

        // 

    } finally {

    }
}
run().catch(error => console.log(error));




app.get('/', (req, res) => {
    res.send('server is running');
});



app.listen(port, () => console.log('server is running on', port));