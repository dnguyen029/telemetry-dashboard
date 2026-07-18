async function check180Days() {
  const jwt = process.env.RINGCENTRAL_JWT;
  const clientId = process.env.RINGCENTRAL_CLIENT_ID;
  const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
  const server = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";

  try {
    const tokenUrl = `${server}/restapi/oauth/token`;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Check dates from 180 days ago to 91 days ago
    const today = new Date();
    const ninetyOneDaysAgo = new Date();
    ninetyOneDaysAgo.setDate(today.getDate() - 91);
    
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(today.getDate() - 180);

    const dateFrom = new Date(Date.UTC(oneEightyDaysAgo.getUTCFullYear(), oneEightyDaysAgo.getUTCMonth(), oneEightyDaysAgo.getUTCDate(), 0, 0, 0, 0)).toISOString();
    const dateTo = new Date(Date.UTC(ninetyOneDaysAgo.getUTCFullYear(), ninetyOneDaysAgo.getUTCMonth(), ninetyOneDaysAgo.getUTCDate(), 23, 59, 59, 999)).toISOString();

    console.log(`Checking if RingCentral has logs from ${oneEightyDaysAgo.toISOString().split("T")[0]} to ${ninetyOneDaysAgo.toISOString().split("T")[0]}...`);
    const logUrl = `${server}/restapi/v1.0/account/~/call-log?dateFrom=${dateFrom}&dateTo=${dateTo}&view=Simple&direction=Inbound&perPage=5`;
    const logRes = await fetch(logUrl, {
      headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
    });

    if (logRes.ok) {
      const logData = await logRes.json();
      console.log(`Status: OK. Found ${logData.records?.length || 0} records in sample.`);
    } else {
      console.log(`API returned error: ${logRes.status} ${await logRes.text()}`);
    }

  } catch (err) {
    console.error(err);
  }
}

check180Days();
