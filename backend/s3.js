const { S3Client } = require('@aws-sdk/client-s3');

// No accessKeyId / secretAccessKey here on purpose. When this code runs on
// your EC2 instance, the IAM role attached to the instance (clouddrop-ec2-role)
// supplies temporary AWS credentials automatically — that's the whole point
// of using an instance role instead of hardcoded keys.
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports = s3;
