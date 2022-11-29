const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pbafkul.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbiden access' })
        }
        req.decoded = decoded;
        next();
    })
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
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
                return res.send({ accessToken: token });
            }
            res.send({ accessToken: '' });
        });

        // get category data
        const productCategoryCollection = client.db('PerfectDealDb').collection('ProductCategoryCollection');
        const userCollection = client.db('PerfectDealDb').collection('usersCollection');
        const allProductsCollection = client.db('PerfectDealDb').collection('allProductsCollection');
        const bookingCollection = client.db('PerfectDealDb').collection('bookingCollection');
        const paymentCollection = client.db('PerfectDealDb').collection('paymentCollection');
        const wishListCollection = client.db('PerfectDealDb').collection('wishListCollection');
        app.get('/productCategorys', async (req, res) => {
            const query = {};
            const result = await productCategoryCollection.find(query).toArray();
            res.send(result);
        });
        const verifyAdmin = async (req, res, next) => {
            // console.log('inside verify admin ',req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userCollection.findOne(query);
            if (user?.role !== "admin") {
                return res.status(403).send({ message: 'frobidden access' })
            }
            next();
        }


        const verifySeller = async (req, res, next) => {
            // console.log('inside verify admin ',req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userCollection.findOne(query);
            if (user?.role !== "seller") {
                return res.status(403).send({ message: 'frobidden access' })
            }
            next();
        }

        // add user
        app.post('/users', async (req, res) => {
            const users = req.body;
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

        //is user is admin 
        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });

        // is user is seller
        app.get('/user/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        });




        // get all users
        app.get('/allUsers', verifyJWT, verifyAdmin, async (req, res) => {
            const query = { role: 'buyer' };
            const result = await userCollection.find(query).toArray();
            res.send(result);
        });

        // all sellers
        app.get('/allSellers', verifyJWT, verifyAdmin, async (req, res) => {
            const query = { role: 'seller' };
            const result = await userCollection.find(query).toArray();
            res.send(result);
        });





        app.put('/allSellers/verified/:email', verifyJWT, verifyAdmin, async (req, res) => {
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
        app.put('/allSellers/unverifyed/:email', verifyJWT, verifyAdmin, async (req, res) => {
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
        app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });


        // seller delete

        app.delete('/seller/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
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

       

        // get all seller product
        app.get('/products', verifyJWT, verifySeller, async (req, res) => {
            const selleremail = req.query.email;
            console.log(selleremail);
            const query = { email: selleremail };
            const result = await allProductsCollection.find(query).toArray();
            res.send(result);
        });
        // delete my product

        app.get('/allProduct/advetrise', verifyJWT, async (req, res) => {
            const query = { paid: false };
            const result = await allProductsCollection.find(query).toArray();
            res.send(result);
        });





        app.delete('/products/:id', verifyJWT,verifySeller,async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await allProductsCollection.deleteOne(query);
            res.send(result);
        });

        app.post('/addProduct',verifyJWT,verifySeller, async (req, res) => {
            const product = req.body;
            const result = await allProductsCollection.insertOne(product);
            res.send(result);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);

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
            const newFilter = { _id: ObjectId(order_id) };
            const option = { upsert: true }
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
        app.get('/myorder', verifyJWT, async (req, res) => {
            console.log('token', req.headers.authorization);
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email }

            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })


        // my wishList
            app.post('/wishlist',verifyJWT,async(req,res)=>{
                const wishList=req.body;
                console.log(wishList);
                const result=await wishListCollection.insertOne(wishList);
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