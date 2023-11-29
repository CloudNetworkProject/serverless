import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import cloudStorage from './cloudStorage.mjs';
import sendEmailConfirmation from './mailgunEmail.mjs';
dotenv.config();
const bucketName = process.env.bucketName;

const downloadRepo = async (repoUrl, destination) => {
  try {
    const zipUrl = repoUrl;
    const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
    // Check if the response contains a valid zip file
    const contentType = response.headers['content-type'];
    if (contentType !== 'application/zip') {
      throw new Error('Invalid content type. Expected application/zip.');
    }
    const zipFilePath = path.join('/tmp', `${destination}.zip`);
    fs.writeFileSync(zipFilePath, Buffer.from(response.data));
 
    console.log('Repository cloned and zipped successfully.');
  } catch (error) {
    isValidZipURL = false;
    console.error('Error downloading repository:');
    throw error;
  }
};
 
export const handler = async (event) =>
{
  let submittedUserEmail, submissionURL, signedUrl, assignmentName, gcpPath;
  try
  {
    const snsMessage = JSON.parse(event.Records[0].Sns.Message);
    
    submittedUserEmail = snsMessage.email;
    assignmentName = snsMessage.assignmentName;
    submissionURL = snsMessage.submissionUrl;
    const submissionCount = snsMessage.submissionCount;
    const submittedassignmentID = snsMessage.assignmentId;
 
    await downloadRepo(submissionURL, submittedassignmentID);
 
    const submittedBucketName = `${assignmentName}/${submittedUserEmail}/SubmissionAttempt-${submissionCount}`;
    gcpPath = bucketName+'/'+submittedBucketName
    
    signedUrl = await cloudStorage(`/tmp/${submittedassignmentID}.zip`, submittedBucketName);

    await sendEmailConfirmation(submittedUserEmail,submissionURL,true,signedUrl,assignmentName,gcpPath);
  }
  catch (error)
  {
    await sendEmailConfirmation(submittedUserEmail,submissionURL,false,signedUrl,assignmentName,gcpPath);
    console.error('Error:', error.message);
    return {statusCode: 500,body: 'Error processing SNS message.'};
  }
};

// const event1 = {
//     "Records": [
//       {
//         "EventVersion": "1.0",
//         "EventSubscriptionArn": "arn:aws:sns:us-east-1:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
//         "EventSource": "aws:sns",
//         "Sns": {
//           "SignatureVersion": "1",
//           "Timestamp": "2019-01-02T12:45:07.000Z",
//           "Signature": "tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==",
//           "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-ac565b8b1a6c5d002d285f9598aa1d9b.pem",
//           "MessageId": "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
//           "Message": "{\"submissionUrl\":\"https://github.com/sanjayvarma199/Array-1/archive/refs/heads/master.zip\",\"email\":\"sanjaydatla49@gmail.com\",\"assignmentId\":\"12345\",\"assignmentName\":\"Assignment1\",\"submissionCount\":\"1\"}",
//           "Type": "Notification",
//           "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&amp;SubscriptionArn=arn:aws:sns:us-east-1:123456789012:test-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
//           "TopicArn":"arn:aws:sns:us-east-1:123456789012:sns-lambda",
//           "Subject": "TestInvoke"
//         }
//       }
//     ]
// };

// handler(event1);