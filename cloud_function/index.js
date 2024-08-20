// Trigger-function and Visitor Count

const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const functions = require('@google-cloud/functions-framework');
const cors = require('cors'); // Import CORS middleware

// Create a new Express application
const app = express();
const firestore = new Firestore();

// Use CORS middleware
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Function to get and increment visitor count from Firestore
async function getAndIncrementVisitorCount() {
  const visitorRef = firestore.collection('visitorCounters').doc('counter');

  // Run a transaction to ensure atomicity
  const result = await firestore.runTransaction(async (transaction) => {
    const doc = await transaction.get(visitorRef);
    if (!doc.exists) {
      throw new Error('Document does not exist!');
    }

    const currentCount = parseInt(doc.data().count || '0', 10);
    const newCount = currentCount + 1;

    // Update the document with the new count
    transaction.update(visitorRef, { count: newCount });

    return newCount;
  });

  return result;
}

// Define the route to handle GET requests
app.get('/', async (req, res) => {
  try {
    const count = await getAndIncrementVisitorCount();
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting and incrementing visitor count:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Export the function to be used by Google Cloud Functions
functions.http('Trigger-function', app);