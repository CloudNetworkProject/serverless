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

