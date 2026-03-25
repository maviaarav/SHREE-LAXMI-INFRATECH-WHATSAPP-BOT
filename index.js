const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
dotenv = require('dotenv');
dotenv.config();
const { sequelize } = require('./models/relationship');
const { User, RenewalTable ,nocRegistration,premiseRegistration,quotationAmount } = require('./models/relationship');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs')


const port = 3000;

const VERIFY_TOKEN = "my_verify_token";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/payments', express.static('payments'));

// Test route
app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

const storage = multer.diskStorage({
  destination : (req,file,cd) =>{
    cd(null, 'uploads/')

  },
  filename : (req,file,cd) =>{
    const  uniqueFileName = Date.now() + path.extname(file.originalname)
    cd(null, uniqueFileName)
  }
})

const upload = multer({storage})

const paymentStorage = multer.diskStorage({
  destination: (req,file, cb) =>{
    cb(null, 'payments/')
  },
  filename : (req,file,cb) =>{
    const fileName = file.originalname.split('.')[0];
    cb(null, fileName)
  }
})
const paymentUpload = multer({storage: paymentStorage})

// function to send QR code for payment


const QRcode = async (amount, orderID) =>{
  const upiID = process.env.UPI_ID;
  const comPanyName = 'Shree Laxmi Infratech';
  const UPI_Link = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(comPanyName)}&am=${amount}&cu=INR&tn=${orderID}`
  const fileName = `qrcode${orderID}.png`
  try{
    await QRCode.toFile(`payments/${fileName}`, UPI_Link, {
      width: 300,
    })
    console.log("Image created: ", fileName)
    return fileName;
  }catch(error){
    console.error("Error generating QR code:", error);
    throw error;
  }
}







app.get('/quotationForm', (req,res)=>{
  let { phoneNumber = '', name = '', type = '' } = req.query

  if (typeof phoneNumber === 'string' && phoneNumber.includes('?')) {
    const legacyParts = phoneNumber.split('?');
    phoneNumber = legacyParts[0] || phoneNumber;

    for (const part of legacyParts.slice(1)) {
      const [k, ...v] = part.split('=');
      const value = decodeURIComponent((v || []).join('=') || '');
      if (k === 'name' && !name) {
        name = value;
      }
      if (k === 'type' && !type) {
        type = value;
      }
    }
  }

  if (!phoneNumber || !name || !type) {
    return res.status(400).send('Missing required query parameters: phoneNumber, name, type');
  }

  const normalizedPhoneNumber = String(phoneNumber).replace(/[^0-9]/g, '');
  if (!normalizedPhoneNumber) {
    return res.status(400).send('Invalid phone number in query parameter.');
  }

  const safeName = String(name).trim();
  const safeType = String(type).trim().toLowerCase();

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quotation Form - Shree Laxmi Infratech</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
        }

        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
          overflow-y: auto;
          max-height: 95vh;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #667eea;
          padding-bottom: 20px;
        }

        .header h1 {
          color: #333;
          font-size: 28px;
          margin-bottom: 5px;
        }

        .header p {
          color: #666;
          font-size: 14px;
        }

        .form-section {
          margin-bottom: 25px;
        }

        .form-section h3 {
          color: #667eea;
          font-size: 16px;
          margin-bottom: 15px;
          border-left: 4px solid #667eea;
          padding-left: 10px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        input, textarea, select {
          width: 100%;
          padding: 12px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.3s ease;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        .input-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .input-group input {
          margin-bottom: 0;
        }

        .btn-submit {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          margin-top: 20px;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:active {
          transform: translateY(0);
        }

        .info-box {
          background: #f8f9ff;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
          color: #555;
          font-size: 13px;
          line-height: 1.6;
        }

        .required {
          color: #e74c3c;
        }

        @media (max-width: 600px) {
          .container {
            padding: 25px;
          }

          .header h1 {
            font-size: 24px;
          }

          .input-group {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Quotation Form</h1>
          <p>Shree Laxmi Infratech</p>
        </div>

        <form method="POST" action="/quotationAmount" enctype="multipart/form-data">
          
          <div class="form-section">
            <h3>Upload Documents</h3>
            <input type="hidden" name="phoneNumber" value="${normalizedPhoneNumber}" />
            <input type="hidden" name="name" value="${safeName}" />
            <input type="hidden" name="type" value="${safeType}" />

           <h4 class="info-box">Please upload the necessary documents for your application. Accepted formats: PDF Only.</h4>
           <input type="file" name="pdf" accept="application/pdf" required />
           <h4 class="info-box">Please enter the quotation amount.</h4>
           <input type="text" name="amount" placeholder="Enter quotation amount" />
           <h4 class="info-box">Please enter the order number.</h4>
           <input type="text" name="orderNo" placeholder="Enter order number" />
          </div>
          <button type="submit" class="btn-submit">📤 Send Quotation </button>
        </form>
      </div>
    </body>
    </html>
    `)

})







app.get('/renewal', async (req,res)=>{
  try{
    console.log("Fetching renewal data...");
    const data = await User.findAll({
      include: [{ model: RenewalTable }]
    });
    res.json(data);
  }catch(error){
    console.error("Error fetching renewal data:", error);
    res.status(403).json({ error: "Something went wrong" });
  }
})



app.get('/quotationAmount', async(req,res)=>{
  try{
    console.log('Fetching quotation details...');
    const data = await User.findAll({
      include: [{model: quotationAmount}]
    })
    res.status(200).json(data)
  }catch(error){
    console.log("Error in fetching quotation details:", error)
    res.status(403).json({ error: "Something went wrong" });
  }

})

app.post('/quotationAmount', upload.single('pdf'), async (req,res)=>{
  try{
    const { phoneNumber, name, type, amount, orderNo } = req.body || {}

    if (!phoneNumber || !name || !type || !amount || !orderNo) {
      return res.status(400).json({ error: 'Missing required quotation fields.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required.' });
    }

    let user = await User.findOne({
      where: { phoneNumber },
    })
    if(!user){
      user = await User.create({ name, phoneNumber, address: 'N/A' })

    }

    const pdfUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`
    console.log(pdfUrl)

    await quotationAmount.create({
      phoneNumber,
      name,
      type,
      amount,
      pdfUrl,
      status: 'pending',
      userId: user.id,
      orderNo
    })

    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product : 'whatsapp',
        to: phoneNumber,
        type: "document",
        document: {
          link: pdfUrl,
          filename: req.file.originalname
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    )
    setTimeout(() => {
      sendButton(phoneNumber, "Please review the quotation at your earliest convenience.\n\nReply by selecting one of the options below:", [
        { id: "accept_quotation", title: "✅ Accept Quotation" },
        { id: "quotation_reject", title: "❌ Reject Quotation" },
      ])
    }, 3000)


    res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Thank You</title>
    <style>
      body {
        font-family: Arial;
        background: #f4f6f9;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .card {
        background: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      }
      h2 {
        color: #28a745;
      }
      p {
        margin-top: 10px;
        color: #555;
      }
    </style>
  </head>
  <body>
    <div class="card">

  <h2>Quotation Sent to ${name}!</h2>
    </div>
  </body>
  </html>
`);
  }catch (error){
    console.log("Error in fetching quotation details:", error)
    res.status(403).json({ error: "Something went wrong" });
  }
})

















app.get('/premiseRegistration', async (req,res)=>{
  try{
    console.log("Fetching renewal data...");
    const data = await User.findAll({
      include: [{model: premiseRegistration}]
    })
    res.json(data)
  }catch(error){
    console.error("Error fetching premiseRegistration Data: ", error)
    res.status(403).send({ error: "Something went wrong" })
  }
})

app.post('/premiseRegistration', async (req,res)=>{
  const { name, phoneNumber, address, OwnerName,House_no,ColonyName,Landmark,Locality,EmailAgent,MobileAgent,AgentName,RegistrationNeworOld,whetherPrivateorpublic,whetherCommercialorResidential,type,ocAvailable,ocNumber,ocDate,Make,serialNo,weight,proposedDateofcommencement,proposedDateofcompletion,ApprovedbuildingplanDocument,DrawingsofPremise,SafetyCertificate,SignatureofOwner,personCapacity , quantity } = req.body
  let user = await User.findOne({
    where: {phoneNumber},
  })
  if(!user){
     user = await User.create({name, phoneNumber, address})
  }
  console.log("Receiving Premise Registration details: ", req.body)

  const PersonJsonData = JSON.parse(weight)
  const NoOfPerson = PersonJsonData.weight.map(n => Number(n) / 68)
  console.log("Number of Persons", NoOfPerson)


  await premiseRegistration.create({
    OwnerName,
    House_no,
    ColonyName,
    Landmark,
    Locality,
    EmailAgent,
    MobileAgent,
    AgentName,
    RegistrationNeworOld,
    whetherCommercialorResidential,
    whetherPrivateorpublic,
    type,
    ocAvailable,
    ocNumber,
    ocDate,
    Make,
    serialNo: JSON.stringify(serialNo),
    weight: JSON.stringify(weight),
    proposedDateofcommencement,
    proposedDateofcompletion,
    ApprovedbuildingplanDocument,
    DrawingsofPremise,
    SafetyCertificate,
    SignatureofOwner,
    quantity,
    personCapacity : JSON.stringify(NoOfPerson)

  })
     res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Thank You</title>
    <style>
      body {
        font-family: Arial;
        background: #f4f6f9;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .card {
        background: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      }
      h2 {
        color: #28a745;
      }
      p {
        margin-top: 10px;
        color: #555;
      }
    </style>
  </head>
  <body>
    <div class="card">

  <h2>Thank you ${name}!</h2>
  <p>Your ${type} application has been submitted.</p>
      <p>We will contact you shortly.</p>
    </div>
  </body>
  </html>
`);

  
})

app.get('/premiseRegistrationForm', async (req, res) => {
  const { phoneNumber, type = 'lift' } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Missing required query parameter: phoneNumber' });
  }

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Premise Registration Form</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: linear-gradient(120deg, #eef4ff 0%, #f7fbf8 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .card {
      width: 100%;
      max-width: 820px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 14px 35px rgba(0, 0, 0, 0.12);
      overflow: hidden;
    }

    .header {
      padding: 20px 24px;
      border-bottom: 1px solid #ececec;
    }

    .header h2 {
      margin: 0 0 8px;
      color: #1f2937;
      font-size: 24px;
    }

    .progress {
      height: 8px;
      background: #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      width: 33.33%;
      background: linear-gradient(90deg, #2563eb, #0ea5e9);
      transition: width 0.25s ease;
    }

    form { padding: 0; }

    .slides {
      display: flex;
      width: 300%;
      transition: transform 0.3s ease;
    }

    .slide {
      width: 100%;
      padding: 22px 24px;
    }

    .section-title {
      margin: 0 0 16px;
      color: #0f172a;
      font-size: 18px;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .field {
      display: flex;
      flex-direction: column;
    }

    .field.full { grid-column: 1 / -1; }

    label {
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 700;
      color: #374151;
    }

    input, select, textarea {
      width: 100%;
      border: 1px solid #cfd6df;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
    }

    textarea {
      min-height: 84px;
      resize: vertical;
    }

    .help {
      margin-top: 6px;
      color: #64748b;
      font-size: 12px;
    }

    .nav {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 18px 24px 24px;
      border-top: 1px solid #ececec;
    }

    .btn {
      border: none;
      border-radius: 8px;
      padding: 12px 16px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
    }

    .btn-prev {
      background: #e2e8f0;
      color: #1e293b;
    }

    .btn-next, .btn-submit {
      background: #2563eb;
      color: #fff;
    }

    .hidden { display: none; }

    @media (max-width: 720px) {
      .grid { grid-template-columns: 1fr; }
      .slide { padding: 18px; }
      .header { padding: 16px 18px; }
      .nav { padding: 14px 18px 18px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>Premise Registration</h2>
      <div class="progress"><div id="progressBar" class="progress-bar"></div></div>
    </div>

    <form id="premiseForm" method="POST" action="/premiseRegistrationForm" enctype="multipart/form-data">
      <input type="hidden" name="phoneNumber" value="${phoneNumber}" />
      <input type="hidden" name="serialNo" id="serialNoJson" />
      <input type="hidden" name="weight" id="weightJson" />

      <div id="slides" class="slides">
        <section class="slide">
          <h3 class="section-title">Page 1: Owner and Agent Details</h3>
          <div class="grid">
            <div class="field"><label>Name</label><input type="text" name="name" required /></div>
            <div class="field"><label>Phone Number</label><input type="text" value="${phoneNumber}" disabled /></div>
            <div class="field full"><label>Address</label><input type="text" name="address" required /></div>
            <div class="field"><label>Owner Name</label><input type="text" name="OwnerName" required /></div>
            <div class="field"><label>Agent Name</label><input type="text" name="AgentName" required /></div>
            <div class="field"><label>Agent Email</label><input type="email" name="EmailAgent" required /></div>
            <div class="field"><label>Agent Mobile</label><input type="text" name="MobileAgent" required /></div>
          </div>
        </section>

        <section class="slide">
          <h3 class="section-title">Page 2: Premise Details</h3>
          <div class="grid">
            <div class="field"><label>House No</label><input type="text" name="House_no" required /></div>
            <div class="field"><label>Colony Name</label><input type="text" name="ColonyName" required /></div>
            <div class="field"><label>Landmark</label><input type="text" name="Landmark" required /></div>
            <div class="field"><label>Locality</label><input type="text" name="Locality" required /></div>
            <div class="field"><label>Registration</label>
              <select name="RegistrationNeworOld" required>
                <option value="new">New</option>
                <option value="old">Old</option>
              </select>
            </div>
            <div class="field"><label>Private/Public</label>
              <select name="whetherPrivateorpublic" required>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div class="field"><label>Commercial/Residential</label>
              <select name="whetherCommercialorResidential" required>
                <option value="commercial">Commercial</option>
                <option value="residential">Residential</option>
              </select>
            </div>
            <div class="field"><label>Type</label>
              <select name="type" id="typeSelect" required>
                <option value="lift">Lift</option>
                <option value="escalator">Escalator</option>
                <option value="transformer">Transformer</option>
                <option value="dg">DG</option>
              </select>
            </div>
            <div class="field"><label>OC Available</label>
              <select name="ocAvailable" required>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div class="field"><label>OC Number</label><input type="text" name="ocNumber" /></div>
            <div class="field"><label>OC Date</label><input type="date" name="ocDate" /></div>
            <div class="field"><label>Make</label><input type="text" name="Make" /></div>
            <div class="field"><label>Quantity</label><input type="number" name="quantity" min="1" value="1" required /></div>
            <div class="field full"><label>Serial Numbers</label><textarea id="serialNoInput" placeholder="Enter comma-separated serial numbers" required></textarea></div>
            <div class="field full"><label>Weight per Unit</label><textarea id="weightInput" placeholder="Enter comma-separated weights (kg), example: 340, 510" required></textarea><div class="help">Person capacity will be auto-calculated as weight / 68 for lift/escalator.</div></div>
            <div class="field"><label>Proposed Commencement Date</label><input type="date" name="proposedDateofcommencement" /></div>
            <div class="field"><label>Proposed Completion Date</label><input type="date" name="proposedDateofcompletion" /></div>
          </div>
        </section>

        <section class="slide">
          <h3 class="section-title">Page 3: Files Upload</h3>
          <div class="grid">
            <div class="field full"><label>Approved Building Plan</label><input type="file" name="ApprovedbuildingplanDocument" accept=".pdf,.jpg,.jpeg,.png" /></div>
            <div class="field full"><label>Drawings of Premise</label><input type="file" name="DrawingsofPremise" accept=".pdf,.jpg,.jpeg,.png" /></div>
            <div class="field full"><label>Safety Certificate</label><input type="file" name="SafetyCertificate" accept=".pdf,.jpg,.jpeg,.png" /></div>
            <div class="field full"><label>Owner Signature</label><input type="file" name="SignatureofOwner" accept=".pdf,.jpg,.jpeg,.png" /></div>
          </div>
        </section>
      </div>

      <div class="nav">
        <button type="button" id="prevBtn" class="btn btn-prev hidden">Back</button>
        <button type="button" id="nextBtn" class="btn btn-next">Next</button>
        <button type="submit" id="submitBtn" class="btn btn-submit hidden">Submit Application</button>
      </div>
    </form>
  </div>

  <script>
    const slides = document.getElementById('slides');
    const progressBar = document.getElementById('progressBar');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const typeSelect = document.getElementById('typeSelect');
    const form = document.getElementById('premiseForm');

    let step = 0;

    typeSelect.value = "${type}";

    function updateStep() {
      slides.style.transform = 'translateX(-' + (step * 33.3333) + '%)';
      progressBar.style.width = ((step + 1) / 3) * 100 + '%';
      prevBtn.classList.toggle('hidden', step === 0);
      nextBtn.classList.toggle('hidden', step === 2);
      submitBtn.classList.toggle('hidden', step !== 2);
    }

    nextBtn.addEventListener('click', function () {
      if (step < 2) {
        step += 1;
        updateStep();
      }
    });

    prevBtn.addEventListener('click', function () {
      if (step > 0) {
        step -= 1;
        updateStep();
      }
    });

    form.addEventListener('submit', function () {
      const serialRaw = document.getElementById('serialNoInput').value || '';
      const weightRaw = document.getElementById('weightInput').value || '';

      const serialArray = serialRaw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const weightArray = weightRaw
        .split(',')
        .map(w => Number(w.trim()))
        .filter(w => !Number.isNaN(w));

      document.getElementById('serialNoJson').value = JSON.stringify(serialArray);
      document.getElementById('weightJson').value = JSON.stringify({ weight: weightArray });
    });

    updateStep();
  </script>
</body>
</html>
`);
});

app.post('/premiseRegistrationForm', upload.fields([
  { name: 'ApprovedbuildingplanDocument', maxCount: 1 },
  { name: 'DrawingsofPremise', maxCount: 1 },
  { name: 'SafetyCertificate', maxCount: 1 },
  { name: 'SignatureofOwner', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      address,
      OwnerName,
      House_no,
      ColonyName,
      Landmark,
      Locality,
      EmailAgent,
      MobileAgent,
      AgentName,
      RegistrationNeworOld,
      whetherPrivateorpublic,
      whetherCommercialorResidential,
      type,
      ocAvailable,
      ocNumber,
      ocDate,
      Make,
      serialNo,
      weight,
      proposedDateofcommencement,
      proposedDateofcompletion,
      quantity
    } = req.body;

    const selectedType = Array.isArray(type) ? type[0] : type;

    let user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      user = await User.create({ name, phoneNumber, address });
    }

    let serialNoValue = [];
    let weightArray = [];

    try {
      serialNoValue = Array.isArray(serialNo) ? serialNo : JSON.parse(serialNo || '[]');
    } catch (error) {
      serialNoValue = [];
    }

    try {
      const parsedWeight = JSON.parse(weight || '{"weight":[]}');
      if (Array.isArray(parsedWeight)) {
        weightArray = parsedWeight.map(Number).filter(n => !Number.isNaN(n));
      } else if (Array.isArray(parsedWeight.weight)) {
        weightArray = parsedWeight.weight.map(Number).filter(n => !Number.isNaN(n));
      }
    } catch (error) {
      weightArray = [];
    }

    const personCapacityArray = (selectedType === 'lift' || selectedType === 'escalator')
      ? weightArray.map(n => n / 68)
      : null;

    const getUploadedUrl = (field) => {
      const file = req.files?.[field]?.[0];
      if (!file) return null;
      const baseUrl = process.env.BASE_URL || '';
      return `${baseUrl}/uploads/${file.filename}`;
    };

    await premiseRegistration.create({
      OwnerName,
      House_no,
      ColonyName,
      Landmark,
      Locality,
      EmailAgent,
      MobileAgent,
      AgentName,
      RegistrationNeworOld,
      whetherCommercialorResidential,
      whetherPrivateorpublic,
      type: selectedType,
      ocAvailable: ocAvailable === 'true' || ocAvailable === true,
      ocNumber: ocNumber || null,
      ocDate: ocDate || null,
      Make: Make || null,
      serialNo: JSON.stringify(serialNoValue),
      weight: JSON.stringify(weightArray),
      proposedDateofcommencement: proposedDateofcommencement || null,
      proposedDateofcompletion: proposedDateofcompletion || null,
      ApprovedbuildingplanDocument: getUploadedUrl('ApprovedbuildingplanDocument'),
      DrawingsofPremise: getUploadedUrl('DrawingsofPremise'),
      SafetyCertificate: getUploadedUrl('SafetyCertificate'),
      SignatureofOwner: getUploadedUrl('SignatureofOwner'),
      quantity: Number(quantity) || null,
      personCapacity: personCapacityArray ? JSON.stringify(personCapacityArray) : null,
      userId: user.id
    });

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Submitted</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      font-family: Arial, sans-serif;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 28px;
      width: min(540px, 92vw);
      text-align: center;
      box-shadow: 0 8px 22px rgba(0,0,0,0.12);
    }
    h2 { color: #16a34a; margin-bottom: 8px; }
    p { color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Thank you ${name}!</h2>
    <p>Your Premise Registration for ${selectedType} has been submitted successfully.</p>
  </div>
</body>
</html>
`);

    normalText(phoneNumber, `Thank you ${name}! Your Premise Registration for *${type}* application has been submitted. \n\n The details are as follows: \n- Type: ${type} \n- Quantity: ${quantity} \n- Address: ${address}\n\n We will contact you shortly. \nOur team will send you the quotation. \n\n note: *If you want to apply for different services or renewal of NOC, reply with "another service".*`);
normalText(918006243900, `New NOC Registration Application Received:\n\n*Name: ${name}*\n\n*Phone: +${phoneNumber}*\n\n*Address: ${address}*\n\n*Type: ${type}*\n\n*Quantity: ${quantity}*\n\n*weight: ${weight || 'N/A'}*\n\n*Person Capacity: ${personCapacity || 'N/A'}* \n\n*Please review the application and send the quotation on* http://localhost:3000/quotationForm?phoneNumber=${phoneNumber}.`);
  } catch (error) {
    console.error('Error creating premise registration form data:', error);
    res.status(500).json({ error: 'Something went wrong while submitting premise registration form.' });
  }
});
app.get('/nocRegistration', async (req,res)=>{
  try{
    console.log("Fetching NOC registration data...");
    const data = await User.findAll({
      include: [{ model: nocRegistration }]
    });
    res.json(data);
  }catch(error){
    console.error("Error fetching NOC registration data:", error);
    res.status(403).json({ error: "Something went wrong" });
  }
})

app.get('/nocRegistration/:phoneNumber', async(req,res)=>{
  const { phoneNumber } = req.params;
  try{
    console.log(`Fetching NOC registration data for phone number: ${phoneNumber}...`);
    const user = await User.findOne({
      where: { phoneNumber },
      
    });
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  }catch(error){
    console.error(`Error fetching NOC registration data for ${phoneNumber}:`, error);
    res.status(403).json({ error: "Something went wrong" });
  }

})
app.post('/nocRegistration', async (req,res)=>{
  try{
    const {name, phoneNumber, address, type, capacity, quantity, kva} = req.body;
    let user = await User.findOne({where: { phoneNumber }})
    if(!user){
      user = await User.create({name, phoneNumber, address})
    }
    let kvaValue = null;
    let capacityValue = null;

    if(type === 'transformer' || type === 'dg'){
      kvaValue = kva;
    }
    if(type === 'lift' || type === 'escalator'){
      capacityValue = capacity;
    }

    console.log("Received renewal data:", req.body);

    const nocTypeDetails = await nocRegistration.create({
      type,
      capacity: JSON.stringify(capacityValue),
      quantity,
      kva: JSON.stringify(kvaValue),
      userId: user.id
    })

    res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Thank You</title>
    <style>
      body {
        font-family: Arial;
        background: #f4f6f9;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .card {
        background: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      }
      h2 {
        color: #28a745;
      }
      p {
        margin-top: 10px;
        color: #555;
      }
    </style>
  </head>
  <body>
    <div class="card">

  <h2>Thank you ${name}!</h2>
  <p>Your ${type} application has been submitted.</p>
      <p>We will contact you shortly.</p>
    </div>
  </body>
  </html>
`);
normalText(phoneNumber, `Thank you ${name}! Your Noc Registration for *${type}* application has been submitted. \n\n The details are as follows: \n- Type: ${type} \n- Quantity: ${quantity} \n- Address: ${address}\n\n We will contact you shortly. \nOur team will send you the quotation. \n\n note: *If you want to apply for different services or renewal of NOC, reply with "another service".*`);
normalText(918006243900, `New NOC Registration Application Received:\n\n*Name: ${name}*\n\n*Phone: +${phoneNumber}*\n\n*Address: ${address}*\n\n*Type: ${type}*\n\n*Quantity: ${quantity}*\n\n*KVA: ${kvaValue || 'N/A'}*\n\n*Capacity: ${capacityValue || 'N/A'}* \n\n*Please review the application and send the quotation on* http://localhost:3000/quotationForm?phoneNumber=${phoneNumber}.`);
  }catch(error){
      console.error("Error fetching NOC registration data:", error);
    res.status(403).json({ error: "Something went wrong" });
  }
})


app.get('/NoCRegistrationForm',(req,res)=>{
  const { phoneNumber, type } = req.query;
  if(!phoneNumber || !type){
    return res.status(400).json({ error: "Missing required query parameters" });
  }
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>NOC Registration Form</title>

  <style>
    body {
      font-family: Arial;
      background: #f4f6f9;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }

    .container {
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 420px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      overflow-y: auto;
      max-height: 90vh;
    }

    h2 {
      text-align: center;
      margin-bottom: 15px;
    }

    .type-box {
      background: #e9f3ff;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 15px;
      font-weight: bold;
      color: #007bff;
    }

    label {
      display: block;
      margin-top: 12px;
      font-weight: bold;
    }

    input {
      width: 100%;
      padding: 10px;
      margin-top: 5px;
      border-radius: 6px;
      border: 1px solid #ccc;
    }

    button {
      width: 100%;
      padding: 12px;
      margin-top: 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
    }

    button:hover {
      background: #0056b3;
    }
  </style>
</head>

<body>

  <div class="container">
    <h2>NOC Registration Form</h2>

    <div class="type-box">
      Type: ${type.toUpperCase()}
    </div>

    <form method="POST" action="/nocRegistration">
    

      <input type="hidden" name="type" value="${type}" />
      <input type="hidden" name="phoneNumber" value="${phoneNumber}" />

      <label>Name</label>
      <input type="text" name="name" required />

      <label>Address</label>
      <input type="text" name="address" required />

      <label>Quantity</label>
      <input type="number" id="quantity" name="quantity" required />

      <div id="dynamicFields"></div>

      <button type="submit">Submit Application</button>
    </form>
  </div>

<script>
  const type = "${type}";
  const quantityInput = document.getElementById('quantity');
  const dynamicFields = document.getElementById('dynamicFields');

  quantityInput.addEventListener('input', function () {
    const qty = parseInt(this.value) || 0;
    dynamicFields.innerHTML = '';

    for (let i = 1; i <= qty; i++) {

      if (type === 'transformer' || type === 'dg') {
        dynamicFields.innerHTML += \`
          <label>KVA for Unit \${i}</label>
          <input type="number" name="kva[]" required />
        \`;
      } else if (type === 'lift' || type === 'escalator') {
        dynamicFields.innerHTML += \`
          <label>Capacity for Unit \${i}</label>
          <input type="number" name="capacity[]" required />
        \`;
      }
    }
  });
</script>

</body>
</html>
`);

})





app.get('/renewal/:phoneNumber', async(req,res)=>{
  const { phoneNumber } = req.params;
  try{
    console.log(`Fetching renewal data for phone number: ${phoneNumber}...`);
    const user = await User.findOne({
      where: { phoneNumber },
      include: [{ model: RenewalTable }]
    });
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  }catch(error){
    console.error(`Error fetching renewal data for ${phoneNumber}:`, error);
    res.status(403).json({ error: "Something went wrong" });
  }
})

app.post('/renewal', async (req,res)=>{
  try{
    const {name, phoneNumber, address, type, capacity, quantity, kva} = req.body;

   
    let kvaValue = null;
    let capacityValue = null;
    if(type === 'transformer' || type === 'dg'){
      kvaValue = kva;
    }
    if(type === 'lift' || type === 'escalator'){
      capacityValue = capacity;
    }

    console.log("Received renewal data:", req.body);

    let user = await User.findOne({where: { phoneNumber }});
    if(!user){
      user = await User.create({ name, phoneNumber, address });
    }



    const renewalTypeDetails = await RenewalTable.create({
      type,
      capacity: JSON.stringify(capacityValue),
      quantity,
      kva: JSON.stringify(kvaValue),
      userId: user.id
    })
    res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Thank You</title>
    <style>
      body {
        font-family: Arial;
        background: #f4f6f9;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .card {
        background: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      }
      h2 {
        color: #28a745;
      }
      p {
        margin-top: 10px;
        color: #555;
      }
    </style>
  </head>
  <body>
    <div class="card">

  <h2>Thank you ${name}!</h2>
  <p>Your ${type} application has been submitted.</p>
      <p>We will contact you shortly.</p>
    </div>
  </body>
  </html>
`);
normalText(phoneNumber, `Thank you ${name}! Your ${type} application has been submitted. \n\n The details are as follows: \n- Type: ${type} \n- Quantity: ${quantity} \n- Address: ${address}\n\n We will contact you shortly. \nOur team will send you the quotation. \n\n note: *If you want to apply for different services or renewal of NOC, reply with "another service".*`);
normalText(918006243900, `New NOC Renewal Application Received:\n\n*Name: ${name}*\n\n*Phone: +${phoneNumber}*\n\n*Address: ${address}*\n\n*Type: ${type}*\n\n*Quantity: ${quantity}*\n\n*KVA: ${kvaValue || 'N/A'}*\n\n*Capacity: ${capacityValue || 'N/A'}* \n\n*Please review the application and send the quotation on* http://localhost:3000/quotationForm?phoneNumber=${phoneNumber}.`);

  }catch(error){
    console.error("Error creating renewal data:", error);
    res.status(403).json({ error: "Something went wrong" });
   
  }
  
})





app.get('/form',(req,res)=>{
  const { phoneNumber, type } = req.query;
  if(!phoneNumber || !type){
    return res.status(400).json({ error: "Missing required query parameters" });
  }
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>NOC Renewal Form</title>

  <style>
    body {
      font-family: Arial;
      background: #f4f6f9;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }

    .container {
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 420px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      overflow-y: auto;
      max-height: 90vh;
    }

    h2 {
      text-align: center;
      margin-bottom: 15px;
    }

    .type-box {
      background: #e9f3ff;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 15px;
      font-weight: bold;
      color: #007bff;
    }

    label {
      display: block;
      margin-top: 12px;
      font-weight: bold;
    }

    input {
      width: 100%;
      padding: 10px;
      margin-top: 5px;
      border-radius: 6px;
      border: 1px solid #ccc;
    }

    button {
      width: 100%;
      padding: 12px;
      margin-top: 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
    }

    button:hover {
      background: #0056b3;
    }
  </style>
</head>

<body>

  <div class="container">
    <h2>NOC Renewal Form</h2>

    <div class="type-box">
      Type: ${type.toUpperCase()}
    </div>

    <form method="POST" action="/renewal">
    

      <input type="hidden" name="type" value="${type}" />
      <input type="hidden" name="phoneNumber" value="${phoneNumber}" />

      <label>Name</label>
      <input type="text" name="name" required />

      <label>Address</label>
      <input type="text" name="address" required />

      <label>Quantity</label>
      <input type="number" id="quantity" name="quantity" required />

      <div id="dynamicFields"></div>

      <button type="submit">Submit Application</button>
    </form>
  </div>

<script>
  const type = "${type}";
  const quantityInput = document.getElementById('quantity');
  const dynamicFields = document.getElementById('dynamicFields');

  quantityInput.addEventListener('input', function () {
    const qty = parseInt(this.value) || 0;
    dynamicFields.innerHTML = '';

    for (let i = 1; i <= qty; i++) {

      if (type === 'transformer' || type === 'dg') {
        dynamicFields.innerHTML += \`
          <label>KVA for Unit \${i}</label>
          <input type="number" name="kva[]" required />
        \`;
      } else if (type === 'lift' || type === 'escalator') {
        dynamicFields.innerHTML += \`
          <label>Capacity for Unit \${i}</label>
          <input type="number" name="capacity[]" required />
        \`;
      }
    }
  });
</script>

</body>
</html>
`);

})



// 🔐 Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  } else {
    console.log('VERIFICATION FAILED');
    return res.sendStatus(403);
  }
});





const processedMessages = new Set();


// ✅ Send List Function

const listButton = async (to, text , options) =>{
    try{
        await axios.post(
            `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to,
                type: 'interactive',
                interactive : {
                    type: 'list',
                    body: {text},
                    action : {
                        button: 'View Options',
                        sections :  [
                            {
                                title : "Services",
                                rows : options.map(opt =>({
                                    id: opt.id,
                                    title: opt.title
                                }))
                            }
                        ]
                    }
                }
            },
            {
            headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
        )
    }catch (error){
        console.error("❌ Error sending list message:", error.response?.data || error.message);
    }
}

// ✅ Send Button Function
const sendButton = async (to, text, buttons) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: "button",
          body: { text },
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("❌ Error sending button:", error.response?.data || error.message);
  }
};
const normalText = async (to, text) =>{
    axios.post(
        `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          text: { body: text }
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      )
      .catch(error => {
        console.error("❌ Error sending text message:", error.response?.data || error.message);
      });
}

app.post('/webhook', async (req, res) => {
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;

    // ❌ Ignore non-message events
    if (!value?.messages) {
      return res.sendStatus(200);
    }

    const message = value.messages[0];

    if (processedMessages.has(message.id)) {
      return res.sendStatus(200);
    }
    processedMessages.add(message.id);

    const from = message.from;
    const text = message.text?.body;

    if (text) {
      const msg = text.toLowerCase().trim();

      console.log("From:", from);
      console.log("Text:", text);

      if (msg === "hi" || msg === "hello") {


        await sendButton(
          from,
          `*Welcome to Shree Laxmi Infratech 🏢* \n\nWe provide expert assistance for:\n\n* Vidyut Suraksha (Electrical Safety)⚡\n\n* Lift & Escalator NOC Registration🛗 \n\n* Permanent Registration\n\n* NOC Renewal Services 🔄\n\n👉 Please click Menu to explore our services.\n\n*Our team will be happy to assist you 😄.*`,
          [
            { id: "menu_main", title: "📋 Menu" }
          ]
        );

        return res.sendStatus(200);
      }

      if (msg === "help") {
        await sendButton(
          from,
          `*Need Assistance?* 🤔\n\nYou can ask me about:\n\n* Vidyut Suraksha (Electrical Safety)⚡\n\n* Lift & Escalator NOC Registration🛗 \n\n* Permanent Registration\n\n* NOC Renewal Services 🔄\n\n👉 Please click Menu to explore our services.\n\n*Our team will be happy to assist you 😄.*`,
          [
            { id: "contact Us", title: "📋 Contact Us" }
          ]
        );

        return res.sendStatus(200);
      }
      if (msg === "another service"){
        await sendButton(
          from,
          `Sure! Please click Menu to explore our services again. 👇`,
          [
            { id: "menu_main", title: "📋 Menu" }
          ]
        );
        return res.sendStatus(200);
      }
      // fallback for unknown text
      await axios.post(
        `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: "Sorry I didn't understand that 😔\n\nPlease send *hi* to start." }
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      return res.sendStatus(200);
    }

    const buttonReply = message?.interactive?.button_reply;
    if(buttonReply){
        console.log("Button Reply ID:", buttonReply.id);
        if (buttonReply.id === 'menu_main'){
            listButton(
                from,
                `Select a service below to get started 👇\n\nWe’re here to assist you with all your approval and registration needs ⚡🛗.`,
                [
                    {id : "noc_renewal", title: 'Noc Renewal'},
                    {id : "noc_registration", title: 'Noc Registation'},
                    {id : "premise_registation", title: 'Premise Registration'},
                    {id : "insurance", title: 'Apply for Insurance '},

                ]
                
            )
            
        }
           if(buttonReply.id === 'accept_quotation'){
          normalText(from, "Thank you for accepting the quotation! Your application has been alloted to our executive, Mr Vikal Mavi. He will contact you shortly to assist you further. If you have any questions in the meantime, feel free to ask at +91 9911940454. We look forward to serving you! 😊")
          normalText(918006243900, `Quotation Accepted:\n\n*Phone: ${from}*\n\nThe customer has accepted the quotation. Please assign an executive to contact the customer and proceed with the service.\n\nCheck the details of the application here: http://localhost:3000/renewal/${from}`)

          const quotation = await quotationAmount.findOne({
            where: { phoneNumber: from },
            order: [['createdAt', 'DESC']]
          })
          await quotation.update({ status: 'accepted' });

          await QRcode(quotation.amount, quotation.orderNo);

          const qrURL = `${process.env.BASE_URL}/payments/qrcode${quotation.orderNo}.png`;

          await axios.post(
            `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
            {
              messaging_product: 'whatsapp',
              to: from,
              type: 'image',
              image: {
                link: qrURL,
                caption: `Scan this QR code to pay ₹${quotation.amount} for your ${quotation.type} application.`
              }
            },
            {
              headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
              }
            }
          )
           normalText(from, "Once paid, please upload payment screenshot.");



        }
        if(buttonReply.id === 'quotation_reject'){
          normalText(from, "Thank you for rejecting the quotation! Your application has been alloted to our executive, Mr Vikal Mavi. He will contact you shortly to assist you further. If you have any questions in the meantime, feel free to ask at +91 9911940454. We look forward to serving you! 😊")
          normalText(918006243900, `Quotation Rejected:\n\n*Phone: +${from}*\n\nThe customer has rejected the quotation. Please assign an executive to contact the customer and proceed with the service.`)
        }

    }

    const listReply = message?.interactive?.list_reply;
    if(listReply){
        console.log("List Reply ID:", listReply.id);

        
        if(listReply.id === 'noc_renewal'){
            
            listButton(
                from,
                `Please select the type of NOC renewal you want to apply for:`,
                [
                    {id : 'transformer_renewal', title: 'Transformer NOC Renewal'},
                    {id : 'DG_renewal', title: 'DG NOC Renewal'},
                    {id : 'lift_renewal', title: 'Lift NOC Renewal'},
                    {id : 'escalator_renewal', title: 'Escalator NOC Renewal'},


                ]
            )
        }
     
        if (listReply.id === 'transformer_renewal'){
          normalText(
            from,
            `To apply for Transformer NOC Renewal, please fill out the form below:\n\nhttp://localhost:3000/form?type=transformer&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of transformers\n- KVA rating for each transformer\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if (listReply.id === 'DG_renewal'){
          normalText(
            from,
            `To apply for DG NOC Renewal, please fill out the form below:\n\nhttp://localhost:3000/form?type=dg&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of DG sets\n- KVA rating for each DG set\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if (listReply.id === 'lift_renewal'){
          normalText(
            from,
            `To apply for Lift NOC Renewal, please fill out the form below:\n\nhttp://localhost:3000/form?type=lift&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of lifts\n- KVA rating for each lift\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if (listReply.id === 'escalator_renewal'){
          normalText(
            from,
            `To apply for Escalator NOC Renewal, please fill out the form below:\n\nhttp://localhost:3000/form?type=escalator&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of escalators\n- KVA rating for each escalator\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if(listReply.id === 'noc_registration'){
           
            listButton(
                from,
                `Please select the type of NOC registration you want to apply for:`,
                [
                    {id : 'transformer_registration', title: 'T/F NOC Registration'},
                    {id : 'DG_registration', title: 'DG NOC Registration'},
                    {id : 'lift_registration', title: 'Lift NOC Registration'},
                    {id : 'escalator_registration', title: 'Escalator NOC Regist.'},


                ]
            )
        }
        if(listReply.id === 'transformer_registration'){
          normalText(
            from,
            `To apply for Transformer NOC Registration, please fill out the form below:\n\nhttp://localhost:3000/NoCRegistrationForm?type=transformer&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of transformers\n- KVA rating for each transformer\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
          if(listReply.id === 'DG_registration'){
          normalText(
            from,
            `To apply for DG NOC Registration, please fill out the form below:\n\nhttp://localhost:3000/NoCRegistrationForm?type=dg&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of DG sets\n- KVA rating for each DG set\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
         if(listReply.id === 'lift_registration'){
          normalText(
            from,
            `To apply for Lift NOC Registration, please fill out the form below:\n\nhttp://localhost:3000/NoCRegistrationForm?type=lift&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of lifts\n- KVA rating for each lift\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
         if(listReply.id === 'escalator_registration'){
          normalText(
            from,
            `To apply for Escalator NOC Registration, please fill out the form below:\n\nhttp://localhost:3000/NoCRegistrationForm?type=escalator&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of escalators\n- KVA rating for each escalator\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if(listReply.id === 'premise_registation'){
         
            listButton(
                from,
                `Please select the type of * premise registration * you want to apply for:`,
                [
                    {id : 'lift_PremiseRegistration', title: 'Lift NOC Registration'},
                    {id : 'escalator_PremiseRegistration', title: 'ESC NOC Registration'},
                ]
            )
        }
        if(listReply.id === 'lift_PremiseRegistration'){
          normalText(
            from,
            `To apply for Lift Premise Registration, please fill out the form below:\n\nhttp://localhost:3000/premiseRegistrationForm?type=lift&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Owner Name\n- House No.\n- Colony Name\n- Landmark\n- Locality\n- Email of Agent (if any)\n- Mobile of Agent (if any)\n- Agent Name (if any)\n- Registration Type (New or Old)\n- Whether Private or Public\n- Whether Commercial or Residential\n- OC Available (Yes or No)\n- OC Number (if OC Available)\n- OC Date (if OC Available)\n- Make of Lift\n- Serial Number of Lift(s)\n- Weight of Lift(s)\n- Proposed Date of Commencement\n- Proposed Date of Completion\n- Quantity of Lifts\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
         if(listReply.id === 'escalator_PremiseRegistration'){
          normalText(
            from,
            `To apply for Escalator Premise Registration, please fill out the form below:\n\nhttp://localhost:3000/premiseRegistrationForm?type=escalator&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Owner Name\n- House No.\n- Colony Name\n- Landmark\n- Locality\n- Email of Agent (if any)\n- Mobile of Agent (if any)\n- Agent Name (if any)\n- Registration Type (New or Old)\n- Whether Private or Public\n- Whether Commercial or Residential\n- OC Available (Yes or No)\n- OC Number (if OC Available)\n- OC Date (if OC Available)\n- Make of Escalator\n- Serial Number of Escalator(s)\n- Weight of Escalator(s)\n- Proposed Date of Commencement\n- Proposed Date of Completion\n- Quantity of Escalators\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if(listReply.id === 'insurance'){
            
            listButton(
                from,
                `Please select the type of * insurance * you want to apply for:`,
                [
                    {id : 'lift_registration', title: 'Lift NOC Registration'},
                    {id : 'escalator_registration', title: 'Escalator NOC '},
                    {id : 'both-registration-1-2', title: 'For both options'},
                ]
            )
        }
        
    }
   
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.sendStatus(500);
  }
});



// Start server
app.listen(port, async() => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully");
  } catch (error) {
    console.error("Database sync failed:", error.message);
  }
});


