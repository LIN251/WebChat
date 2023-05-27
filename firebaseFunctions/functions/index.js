const { Timestamp } = require('firebase-admin/firestore');
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require("firebase-admin");
const app = require('express')();
const firebase = require("firebase/compat/app")
const { auth, signInWithEmailAndPassword } = require('firebase/compat/auth')


const firebaseConfig = {
    apiKey: "AIzaSyBsDzjRklhvVhxDEC03aWO_FyXV4ywG8qk",
    authDomain: "learnreact-bac4f.firebaseapp.com",
    projectId: "learnreact-bac4f",
    storageBucket: "learnreact-bac4f.appspot.com",
    messagingSenderId: "951002555579",
    appId: "1:951002555579:web:a5eea899a98c425820f59e",
    measurementId: "G-VBHXR2BTJD"
};

firebase.initializeApp(firebaseConfig);
admin.initializeApp();
const db = admin.firestore();

app.get('/screams', (req,res)=>{
    db
    .collection('screams')
    .orderBy('createdAt','desc')
    .get()
    .then(data => {
        let screams = [];
        data.forEach(doc =>{
            screams.push({
                screamID: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        })
        return res.json(screams);
    })
    .catch(error => console.log(error));
})

app.post('screams',(req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };
    db
    .collection("screams")
    .add(newScream)
    .then((doc) => {
        res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((error) => {
        console.error(error);
        return res.status(500).json({ error: 'something went wrong' });
    });
});

// sign up route
let token, userID;
app.post("/signup", (req,res)=>{
    const newUser = {
        email : req.body.email,
        password : req.body.password,
        confirmPassword : req.body.confirmPassword,
        handle : req.body.handle,
    }

    db.doc(`/users/${newUser.handle}`).get()
    .then(doc=>{
        if (doc.exists){
            return res.status(400).json({handle: "this handle is already taken"})
        }else{
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then(data =>{
        userID = data.user.uid;
        return data.user.getIdToken();
    })
    .then(token=>{
        token = token;
        const userCredentials = {
            handle: newUser.handle,
            email : newUser.email,
            createdAt : new Date().toISOString(),
            userID: userID
        }
        return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(()=>{
        return res.status(201).json({token})
    })
    .catch((error)=>{
        console.log(error);
        if(error.code === "auth/email-already-in-use"){
            return res.status(400).json({email: "Email is already in use"})
        }
        return res.status(500).json({error: error.code})
    })
})

exports.api = functions.https.onRequest(app);
