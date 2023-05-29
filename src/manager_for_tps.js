const crypto = require('crypto');
const { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicMessageQuery } = require('@hashgraph/sdk');
require("dotenv").config();
const fs = require('fs');
const readline = require('readline');

// Set the number of transactions to perform
const numTransactions = 10;

// Interface for input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getUserInput() {
    return new Promise(resolve => {
      rl.question('>', answer => {
        resolve(answer);
      });
    });
}

// Function to calculate the hash of a multimedia file
function calculateHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath); 
        // TODO: 여기를 s3 부분으로 바꿔야 함
        // https://github.com/rosacomputer/programming_practice/blob/main/awsS3HederaCllient.js 여기 보고 할 것 
        // s3 조작법은 여기 참고 : https://www.youtube.com/watch?v=5S_QHyPA7H4

        stream.on('data', (data) => {
        hash.update(data);
        });
    
        stream.on('end', () => {
        const calculatedHash = hash.digest('hex');
        resolve(calculatedHash);
        });
    
        stream.on('error', (error) => {
        reject(error);
        });
    });
}

async function main() {
    // Initialize Hedera client
    const client = Client.forTestnet();
    client.setOperator(process.env.MY_ACCOUNT_ID, process.env.MY_PRIVATE_KEY);

    /////////////////////////// 입력 데이터의 해시 h1을 구한다. ///////////////
    let filePath = await getUserInput();
    const hashFromOriginalFile = await calculateHash(filePath);

    ////////////////////////// 해시 h1을 토픽으로 발행한다. ///////////////////////////////////////////////////
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

        const endTime = Date.now();
        const elapsedTime = (endTime - startTime) / 1000; // Convert to seconds
        const tps = (i + 1) / elapsedTime;
        tpsResults.push(tps);
    }

    // Save TPS values to a text file
    fs.writeFileSync('manager_tps_first_TopicCreateTransaction.txt', tpsResults.join('\n'));
    console.log(`First TopicCreateTransaction TPS values have been saved to manager_tps_first_TopicCreateTransaction.txt`);
    
    //////////////////////////////////////////////////////////////////////////////////////////////////
    const tpsResults2 = [];
    const startTime2 = Date.now();

    for (let i = 0; i < numTransactions; i++) {
        await new TopicMessageSubmitTransaction({
            topicId: newTopicId, 
            message: hashFromOriginalFile, 
        }).execute(client);

        const endTime = Date.now();
        const elapsedTime = (endTime - startTime2) / 1000; // Convert to seconds
        const tps = (i + 1) / elapsedTime;
        tpsResults2.push(tps);
    }

    // Save TPS values to a text file
    fs.writeFileSync('manager_tps_first_TopicMessageSubmitTransaction.txt', tpsResults2.join('\n'));
    console.log(`First TopicMessageSubmitTransaction TPS values have been saved to manager_tps_first_TopicMessageSubmitTransaction.txt`);
        
    ////////////////////////////////////////////////////////////////////////////////////////////

    /////////// 시간이 지나서, 무결성 검사를 위해 hashstore 에게 해시 요청 // resume here! /////////
    const tpsResults3 = [];
    const startTime3 = Date.now();
    let newTopicId2;

    for (let i = 0; i < numTransactions; i++) {
        const transaction3 = new TopicCreateTransaction();

        // Sign with the client operator private key and submit the transaction to a Hedera network
        const txResponse3 = await transaction3.execute(client);

        // Request the receipt of the transaction
        const receipt3 = await txResponse3.getReceipt(client);

        // Get the topicID 
        newTopicId2 = receipt3.topicId;

        const endTime = Date.now();
        const elapsedTime = (endTime - startTime3) / 1000; // Convert to seconds
        const tps = (i + 1) / elapsedTime;
        tpsResults3.push(tps);
    }

    fs.writeFileSync('manager_tps_second_TopicCreateTransaction.txt', tpsResults3.join('\n'));
    console.log(`Second TopicCreateTransaction TPS values have been saved to manager_tps_second_TopicCreateTransaction.txt`);

    //////////////////////////////////////////////////////////////////////////////////
    const tpsResults4 = [];
    const startTime4 = Date.now();

    for (let i = 0; i < numTransactions; i++) {
        await new TopicMessageSubmitTransaction({
            topicId: newTopicId2, 
            message: "GET_HASH", 
        }).execute(client);

        const endTime = Date.now();
        const elapsedTime = (endTime - startTime4) / 1000; // Convert to seconds
        const tps = (i + 1) / elapsedTime;
        tpsResults4.push(tps);
    }

    fs.writeFileSync('manager_tps_second_TopicMessageSubmitTransaction.txt', tpsResults4.join('\n'));
    console.log(`Second TopicMessageSubmitTransaction TPS values have been saved to manager_tps_second_TopicMessageSubmitTransaction.txt`);
}

main();
  

