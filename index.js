const express = require("express");
const bodyParser = require("body-parser");

const cors = require('cors');



const {
  Route53Client,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommand,
  CreateHostedZoneCommand,
  DeleteHostedZoneCommand,
  DeleteResourceRecordSetCommand,
} = require("@aws-sdk/client-route-53");

const app = express();

app.use(bodyParser.json());
app.use(cors());

const route53Client = new Route53Client({ region: "ap-southeast-2" });

app.get("/hostedzones", async (req, res) => {
  try {
    const data = await route53Client.send(new ListHostedZonesCommand({}));
    res.json(data.HostedZones);
  } catch (err) {
    console.log("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/record", async (req, res) => {
  const hostedZoneId = req.query.hostedZoneId; // Get the hostedZoneId from the query parameter
    if (!hostedZoneId) {
      return res.status(400).json({ error: 'HostedZoneId parameter is required' });
    }
  
  try {
    const data = await route53Client.send(
      new ListResourceRecordSetsCommand({
        HostedZoneId:hostedZoneId,
      })
    );
    // console.log(data)
    res.json(data.ResourceRecordSets);
    
  } catch (err) {
    console.log("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/create", async (req, res) => {

  const domainName = req.body.domainName;

  try {
    const params = {
        Name: domainName,
        CallerReference: Date.now().toString(), 
        HostedZoneConfig: {
            Comment: "Created via API",
            PrivateZone: false 
        }
    };

    const command = new CreateHostedZoneCommand(params);
    const response = await route53Client.send(command);
    const hostedZoneId = response.HostedZone.Id;
    const hostedZoneName = response.HostedZone.Name;
    console.log(`Hosted zone created successfully with ID: ${hostedZoneId} and ${hostedZoneName}`);
    res.json({ success: true, hostedZoneId });
} catch (error) {
    console.error("Error creating hosted zone:", error);
    res.status(500).json({ success: false, message: "Error creating hosted zone" });
}
});


app.delete('/delete/:hostedZoneId', async (req, res) => {
  const hostedZoneId = req.params.hostedZoneId;
  try {
      
      const params = {
          Id: hostedZoneId
      };
      const command = new DeleteHostedZoneCommand(params);
      await route53Client.send(command);

      console.log(`Hosted zone ${hostedZoneId} deleted successfully`);
      res.json({ success: true, message: `Hosted zone ${hostedZoneId} deleted successfully` });
  } catch (error) {
      console.error("Error deleting hosted zone:", error);
      res.status(500).json({ success: false, message: "Error deleting hosted zone" });
  }
});


app.post("/dns/:hostedZoneId", async (req, res) => {
  const hostedZoneId = req.params.hostedZoneId;
  const { subdomain, domain, type, value } = req.body;
  const domainName = `${subdomain}.${domain}`;
  if (!domainName || !value || !type) {
    return res.status(400).json({ error: 'Missing domainName, value, or type in request body' });
  }

  const params = {
    HostedZoneId: hostedZoneId, 
    ChangeBatch: {
      Changes: [
        {
          Action: 'CREATE',
          ResourceRecordSet: {
            Name: domainName,
            Type: type,
            TTL: 300, // Time to Live in seconds
            ResourceRecords: [
              {
                Value: value
              }
            ]
          }
        }
      ]
    }
  };
  try {
    data = await route53Client.send(new ChangeResourceRecordSetsCommand(params));
    res.status(200).json({ message: "DNS record created successfully"});
  } catch (error) {
    console.error("Error creating DNS record:", error);
    res
      .status(500)
      .json({ message: "Failed to create DNS record", error: error.message });
  }
});



// Start the Express server
app.get('/', (req, res) => {
  res.send({message:'Hello.... api.... working !!!!!!'});
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
