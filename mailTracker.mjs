import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
dotenv.config();
 
const tableName = process.env.DynamoDBName
const dynamoDBRegion = 'us-east-1';
const dynamoDbClient = new DynamoDBClient({ region: dynamoDBRegion });
 
const insertItemToDynamoDB = async (itemData) => {
  const params = {
    TableName: tableName,
    Item: itemData,
  };
 
  try
  {
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);
    console.log('Item inserted successfully.', params);
  }
  catch (error)
  {
    console.error('Error inserting item:', error);
    throw error;
  }
};
 
export default insertItemToDynamoDB;