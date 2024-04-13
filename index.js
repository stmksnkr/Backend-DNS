const AWS = require('aws-sdk');


AWS.config.update({
  accessKeyId: 'AKIASMIZTRLJI5YXTU5B',
  secretAccessKey: 'FC1tpHjTCOKPkv6QiKykXH6RMXCaScX5Kxq0VHMYY',
  region: 'ap-southeast-2' 
});


const route53 = new AWS.Route53();
route53.createHostedZone

async function getAllDNSRecords() {
  try {
   
    const hostedZones = await route53.listHostedZones().promise();

  
    for (const hostedZone of hostedZones.HostedZones) {
      const zoneId = hostedZone.Id;

      
      const records = await route53.listResourceRecordSets({ HostedZoneId: zoneId }).promise();

    
      console.log(`DNS records for hosted zone ${hostedZone.Name}:`);
      for (const record of records.ResourceRecordSets) {
        console.log(record);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getAllDNSRecords();
