import dotenv from 'dotenv';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { v4 as uuidv4 } from 'uuid';
import insertItemToDynamoDB from './mailTracker.mjs';
dotenv.config();

const mailgun = new Mailgun(formData);

const domain = process.env.domainName;
const apiKey = process.env.MAILGUN_API_KEY;
const mg = mailgun.client({ username: 'api', key: apiKey });

const isValidUrl = (url) => {
    // Regular expression for a valid URL
    const urlPattern = new RegExp('^(https?|ftp):\\/\\/[\\w-]+(\\.[\\w-]+)+([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?$');
    return urlPattern.test(url);
  };

const sendEmailConfirmation = async (userEmail, submissionUrl, assignmentStatus, assignmentPath, assignmentName, gcpPath) => {
    let textData;
    let htmlData;
    if(assignmentStatus)
    {
        textData = `Dear ${userEmail},\n\n` +
        `Your submission has been received successfully. You can access it through the provided link.\n` +
        `Assignment Path: ${assignmentPath}\n\n` +
        `If you face any problems or have inquiries, feel free to reach out to me.\n\n` +
        `Sincerely,\n` +
        `Admin Team`;
        htmlData = `<p>Dear ${userEmail},</p>` +
        `<p>Your submission has been received successfully. You can access it through the provided link.</p>` +
        `<p><strong>Assignment Name:</strong> ${assignmentName} </p>` +
        `<p><strong>Downloadble Link:</strong> <a href="${assignmentPath}">Link</a> </p>` +
        `<p><strong>Cloud Storage Path:</strong> ${gcpPath}</p>` +
        `<p>If you face any problems or have inquiries, feel free to reach out to me.</p>` +
        `<p>Sincerely,<br/>Admin Team</p>`
    }
    else if(isValidUrl(submissionUrl) && submissionUrl.endsWith('.zip')){
        textData = `Dear ${userEmail},\n\n` +
        `There seems to be an issue with your assignment submission. We were unable to access the zip file from the submission URL\n` +
        `Ensure that the provided submission URL (.zip) is accessible and resubmit it before the deadline.\n\n` +
        `Assignment Name: ${assignmentName} \n\n` +
        `Submission URL: ${submissionUrl}\n\n` +
        `Sincerely,\n` +
        `Admin Team`;
        htmlData = `<p>Dear ${userEmail},</p>` +
        `<p>There seems to be an issue with your assignment submission. We were unable to access the zip file from the submission URL</p>` +
        `<p>Ensure that the provided submission URL (.zip) is accessible and resubmit it before the deadline</p>` +
        `<p><strong>Assignment Name:</strong> ${assignmentName} </p>` +
        `<p><strong>Submission URL:</strong> ${submissionUrl} </p>` +
        `<p>If you encounter any issues or have questions, please contact me.</p>` +
        `<p>Sincerely,<br/>Admin Team</p>`
    }
    else{
        textData = `Dear ${userEmail},\n\n` +
        `Your assignment submission faced an issue, as we were unable to access the zip file from the provided submission URL\n` +
        `Kindly verify your submission and resubmit it prior to the deadline.\n\n` +
        `Assignment Name: ${assignmentName} \n\n` +
        `Submission URL: ${submissionUrl}\n\n` +
        `Sincerely,\n` +
        `Admin Team`;
        htmlData = `<p>Dear ${userEmail},</p>` +
        `<p>Your assignment submission faced an issue, as we were unable to access the zip file from the provided submission URL</p>` +
        `<p>Kindly verify your submission and resubmit it prior to the deadline.</p>` +
        `<p><strong>Assignment Name:</strong> ${assignmentName} </p>` +
        `<p><strong>Submission URL:</strong> ${submissionUrl} </p>` +
        `<p>If you encounter any issues or have questions, please contact me.</p>` +
        `<p>Sincerely,<br/>Admin Team</p>`
        
    }

    const mailData = {
        from: 'Admin <Admin@' + domain + '>',
        to: [userEmail],
        cc: ['ckongarac@gmail.com'],
        subject: `Assignment submission status`,
        text: textData,
        html: htmlData
      };

    try {
        const msg = await mg.messages.create(domain, mailData);
        console.log(msg);
        const epochTime = Date.now();
        const uniqueId = uuidv4();
        const item =  
            {
                uniqueId: {S : uniqueId},
                emailId: { S : userEmail },
                assignmentName: { S: assignmentName},
                submissionURL: { S : submissionUrl },
                epochTime : {S: epochTime.toString()}
            }
        insertItemToDynamoDB(item);
    } catch (err) {
        console.log(err);
    }
}

export default sendEmailConfirmation;
