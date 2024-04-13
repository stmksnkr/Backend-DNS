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
} = require("@aws-sdk/client-route-53");

const app = express();

app.use(bodyParser.json());
app.use(cors());

const route53Client = new Route53Client({ region: "ap-southeast-2" });
// Define a GET endpoint to list hosted zones
app.get("/hostedzones", async (req, res) => {
  try {
    const data = await route53Client.send(new ListHostedZonesCommand({}));
    // const modifiedData = data.HostedZones.map(zone => {
    //     return {
    //       Id: zone.Id,
    //       name: zone.Name,
    //       Type: zone.Type// Assuming 'Name' is the 'type' you mentioned
    //     };
    //   });
    // const hostedZoneIds = data.HostedZones.map(zone => zone.Id);
    // console.log(hostedZoneIds)
    res.json(data.HostedZones);
    // res.json(modifiedData);


  } catch (err) {
    console.log("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/record", async (req, res) => {
  try {
    const data = await route53Client.send(
      new ListResourceRecordSetsCommand({
        HostedZoneId: "Z091983730D76Y9I6FSGS",
      })
    );
    res.json(data);
    
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

  // const input = {
  //   Name: "dname.com",
  //   VPC: {
  //     VPCRegion:"ap-southeast-2",
  //     VPCId: "vpc-04d5146a78b42e358",
  //   },
  //   CallerReference: "280abbdb-7ac6-4cb9-83a0-ebfe79a25d7c", // required
  //   HostedZoneConfig: {
  //     // HostedZoneConfig
  //     Comment: "STRING_VALUE",
  //     PrivateZone: true || false,
  //   },
  //   DelegationSetId: "STRING_VALUE",
  // };
  // const command = new CreateHostedZoneCommand(input);

  // try {
  //   await route53Client.send(command);
  //   res.status(200).json({ message: "DNS record created successfully" });
  // } catch (error) {
  //   console.error("Error creating DNS record:", error);
  //   res
  //     .status(500)
  //     .json({ message: "Failed to create DNS record", error: error.message });
  // }
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








app.post("/dns", async (req, res) => {
  const { domain, recordName, recordType, recordValue } = req.body;

  const params = {
    HostedZoneId: "Z06528153MWMTCIJIIBZ1",
    ChangeBatch: {
      Changes: [
        {
          Action: "CREATE",
          ResourceRecordSet: {
            Name: recordName + "." + domain,
            Type: recordType,
            TTL: 300,
            ResourceRecords: [
              {
                Value: recordValue,
              },
            ],
          },
        },
      ],
    },
  };

  try {
    await route53Client.send(new ChangeResourceRecordSetsCommand(params));
    res.status(200).json({ message: "DNS record created successfully" });
  } catch (error) {
    console.error("Error creating DNS record:", error);
    res
      .status(500)
      .json({ message: "Failed to create DNS record", error: error.message });
  }
});





// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
