// implementation1의 hashstore.js의 TPS측정

const { Client, TopicCreateTransaction, TopicMessageSubmitTransaction } = require('@hashgraph/sdk');
require("dotenv").config();
const readline = require('readline');
const fs = require('fs');

// Set the number of transactions to perform
const numTransactions = 10;

// Create a variable to store the received messages
const savedMessages = [];

// Interface for input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    //////////// Connection Establishment starts ////////////////////////////////////
    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // Create our connection to the Hedera network
    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    // If we weren't able to grab it, we should throw a new error
    if (!myAccountId || !myPrivateKey) {
        throw new Error(
            "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
        );
    }

    ///////////////////////////// Send hash namager.js /////////////////////////////////////////////////////
    const tpsResults = [];
    const startTime = Date.now();
    let newTopicId;

    for (let i = 0; i < numTransactions; i++) {
        const transaction = new TopicCreateTransaction();

        // Sign with the client operator private key and submit the transaction to a Hedera network
        const txResponse = await transaction.execute(client);

        // Request the receipt of the transaction
        const receipt = await txResponse.getReceipt(client);

        // Get the topicID 
        newTopicId = receipt.topicId;
        // console.log('\nTopic ID: ' + newTopicId);

        const endTime = Date.now();
        const elapsedTime = (endTime - startTime) / 1000; // Convert to seconds
        const tps = (i + 1) / elapsedTime;
        tpsResults.push(tps);
    }

    // Save TPS values to a text file
    fs.writeFileSync('hashstore_tps_first_TopicCreateTransaction.txt', tpsResults.join('\n'));
    console.log(`First TopicCreateTransaction TPS values have been saved to hashstore_tps_first_TopicCreateTransaction.txt`);
    ////////////////////////////////////////////////////////////////////////////////////////////
    const tpsResults2 = [];
    const startTime2 = Date.now();

    for (let i = 0; i < numTransactions; i++) {
        // Create a new TopicMessageSubmitTransaction
        await new TopicMessageSubmitTransaction({
                        topicId: newTopicId, 
                        message: savedMessages[0], 
                    }).execute(client);

        const endTime = Date.now();
        const elapsedTime = (endTime - startTime2) / 1000; // Convert to seconds
        const tps = (i + 1) / elapsedTime;
        tpsResults2.push(tps);
    }

    // Save TPS values to a text file
    fs.writeFileSync('hashstore_tps_first_TopicMessageSubmitTransaction.txt', tpsResults2.join('\n'));
    console.log(`First TopicMessageSubmitTransaction TPS values have been saved to hashstore_tps_first_TopicMessageSubmitTransaction.txt`);

} 

main();