const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const { Op } = require('sequelize');
dotenv = require('dotenv');
dotenv.config();
const { sequelize } = require('./models/relationship');
const { User, RenewalTable ,nocRegistration,premiseRegistration,quotationAmount, paymentProof } = require('./models/relationship');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs')


const port = 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
  console.log(`✅ Created directory: uploads`);
}

// Test route
app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ 
      status: 'healthy',
      database: 'connected',
      node_env: process.env.NODE_ENV,
      database_dialect: process.env.DATABASE_DIALECT
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

const storage = multer.memoryStorage();
const upload = multer({storage});

const paymentStorage = multer.memoryStorage();
const paymentUpload = multer({storage: paymentStorage});

// function to send QR code for payment (returns Base64, no file storage)
const QRcode = async (amount, orderID) =>{
  const upiID = process.env.UPI_ID;
  const comPanyName = 'Shree Laxmi Infratech';
  const UPI_Link = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(comPanyName)}&am=${amount}&cu=INR&tn=${orderID}`
  
  try{
    // Generate QR code as Base64 data URL (no file storage)
    const qrDataUrl = await QRCode.toDataURL(UPI_Link, {
      width: 300,
      errorCorrectionLevel: 'H'
    });
    
    console.log("✅ QR Code generated in memory for order:", orderID)
    return qrDataUrl;
  }catch(error){
    console.error("❌ Error generating QR code:", error);
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
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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
          body {
            align-items: flex-start;
            padding: 12px;
          }

          .container {
            padding: 18px;
            border-radius: 10px;
            max-height: none;
            margin: 10px 0 18px;
          }

          .header h1 {
            font-size: 22px;
          }

          .input-group {
            grid-template-columns: 1fr;
          }

          input, textarea, select, .btn-submit {
            font-size: 16px;
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







// Document download endpoint for quotation PDFs
app.get('/document/quotation/:phoneNumber/:orderNo', async (req, res) => {
  try {
    const { phoneNumber, orderNo } = req.params;
    const doc = await quotationAmount.findOne({
      where: { phoneNumber, orderNo }
    });
    if (!doc || !doc.pdfData) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.setHeader('Content-Type', doc.pdfMimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.pdfOriginalName}"`);
    res.send(doc.pdfData);
  } catch (error) {
    console.error('Error downloading quotation document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Payment screenshot upload endpoint
app.post('/payment/upload', paymentUpload.single('screenshot'), async (req, res) => {
  try {
    const { phoneNumber, orderNo, amount, quotationId } = req.body;

    if (!phoneNumber || !orderNo || !req.file) {
      return res.status(400).json({ error: 'Missing required fields or screenshot' });
    }

    let user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      user = await User.create({ name: 'N/A', phoneNumber, address: 'N/A' });
    }

    const proof = await paymentProof.create({
      phoneNumber,
      orderNo,
      amount: amount || 0,
      screenshotData: req.file.buffer,
      screenshotMimeType: req.file.mimetype,
      screenshotOriginalName: req.file.originalname,
      status: 'pending',
      userId: user.id,
      quotationId: quotationId || null
    });

    // Notify owner with buttons to confirm/reject payment
    await sendButton(
      process.env.OWNER_PHONE_NUMBER,
      `📸 **New Payment Screenshot Received**\n\n*Phone:* +${phoneNumber}\n*Order:* ${orderNo}\n*Amount:* ₹${amount}\n\n✅ Screenshot saved to database.\n\nPlease verify:`,
      [
        { id: `confirm_payment_${proof.id}`, title: '✅ Confirm Payment' },
        { id: `reject_payment_${proof.id}`, title: '❌ Reject Payment' }
      ]
    );

    // Send screenshot image to owner
    const screenshotUrl = `${process.env.BASE_URL}/payment/screenshot/${proof.id}`;
    await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: process.env.OWNER_PHONE_NUMBER,
        type: 'image',
        image: {
          link: screenshotUrl,
          caption: `Payment Screenshot - Order: ${orderNo}, Amount: ₹${amount}`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Send success message to user
    await normalText(
      phoneNumber,
      `✅ **Payment Screenshot Successfully Submitted!**\n\nThank you for uploading your payment proof.\n\n📝 *Details:*\n- Order: ${orderNo}\n- Amount: ₹${amount}\n\n🔄 Our team will verify and confirm it on WhatsApp shortly.\n\nThank you for your patience! 😊`
    );

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Payment Submitted</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 15px 40px rgba(0,0,0,0.2);
      max-width: 500px;
      width: 100%;
    }
    h2 {
      color: #28a745;
      font-size: 28px;
      margin: 0 0 15px 0;
    }
    .check-mark {
      font-size: 60px;
      margin-bottom: 15px;
    }
    p {
      margin: 10px 0;
      color: #555;
      font-size: 16px;
      line-height: 1.6;
    }
    .details {
      background: #f8f9ff;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: left;
      border-left: 4px solid #667eea;
    }
    .details p {
      margin: 8px 0;
      font-size: 14px;
    }
    .divider {
      height: 1px;
      background: #ddd;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="check-mark">✅</div>
    <h2>Payment Screenshot Submitted!</h2>
    <p>Thank you for uploading your payment proof.</p>
    
    <div class="details">
      <p><strong>Order Number:</strong> ${orderNo}</p>
      <p><strong>Amount:</strong> ₹${amount}</p>
      <p><strong>Status:</strong> Pending Verification</p>
    </div>
    
    <div class="divider"></div>
    <p>Our team will verify and confirm your payment on WhatsApp shortly.</p>
    <p style="color: #667eea; font-weight: 600;">You will receive a confirmation message soon! 🚀</p>
  </div>
</body>
</html>
`);
  } catch (error) {
    console.error('Error uploading payment screenshot:', error);
    res.status(500).json({ error: 'Failed to upload payment screenshot' });
  }
});

// Get payment screenshot for verification
app.get('/payment/screenshot/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const proof = await paymentProof.findByPk(paymentId);
    if (!proof || !proof.screenshotData) {
      return res.status(404).json({ error: 'Payment screenshot not found' });
    }
    res.setHeader('Content-Type', proof.screenshotMimeType || 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${proof.screenshotOriginalName}"`);
    res.send(proof.screenshotData);
  } catch (error) {
    console.error('Error retrieving payment screenshot:', error);
    res.status(500).json({ error: 'Failed to retrieve screenshot' });
  }
});

// Confirm payment endpoint
app.post('/payment/confirm/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const proof = await paymentProof.findByPk(paymentId);
    if (!proof) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    proof.status = 'confirmed';
    proof.ownerReviewedAt = new Date();
    await proof.save();

    // Notify user about confirmation
    await normalText(
      proof.phoneNumber,
      `✅ **Payment Confirmed!**\n\nYour payment of ₹${proof.amount} for order ${proof.orderNo} has been verified and confirmed.\n\nThank you for your business! 🙏`
    );

    res.json({ success: true, message: 'Payment confirmed', paymentId });
  } catch (error) {
    console.error('❌ Error confirming payment:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to confirm payment',
      details: error.message
    });
  }
});

// Reject payment endpoint
app.post('/payment/reject/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const proof = await paymentProof.findByPk(paymentId);
    if (!proof) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    proof.status = 'rejected';
    proof.ownerReviewedAt = new Date();
    await proof.save();

    // Notify user about rejection
    await normalText(
      proof.phoneNumber,
      `❌ **Payment Not Verified**\n\nYour payment screenshot for order ${proof.orderNo} could not be verified.\n\n*Reason:* ${reason || 'Insufficient details'}\n\nPlease resubmit with a clear screenshot showing:\n✓ Transaction ID\n✓ Amount\n✓ Date`
    );

    res.json({ success: true, message: 'Payment rejected', paymentId });
  } catch (error) {
    console.error('❌ Error rejecting payment:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to reject payment',
      details: error.message
    });
  }
});

app.get('/document/premise/:userId/:documentType', async (req, res) => {
  try {
    const { userId, documentType } = req.params;
    const premise = await premiseRegistration.findOne({ where: { userId } });

    if (!premise) {
      return res.status(404).json({ error: 'Premise registration not found' });
    }

    const docMap = {
      building: { data: premise.ApprovedbuildingplanDocument, mime: premise.ApprovedbuildingplanDocumentMimeType, name: 'building_plan.pdf' },
      drawings: { data: premise.DrawingsofPremise, mime: premise.DrawingsofPremiseMimeType, name: 'drawings.pdf' },
      safety: { data: premise.SafetyCertificate, mime: premise.SafetyCertificateMimeType, name: 'safety_cert.pdf' },
      signature: { data: premise.SignatureofOwner, mime: premise.SignatureofOwnerMimeType, name: 'signature.pdf' }
    };

    const doc = docMap[documentType];
    if (!doc || !doc.data) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.setHeader('Content-Type', doc.mime || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    res.send(doc.data);
  } catch (error) {
    console.error('Error retrieving premise document:', error);
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
});

app.get('/renewal', async (req,res)=>{
  try{
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      console.log("Fetching renewal data...");
      const data = await User.findAll({
        include: [{ model: RenewalTable }]
      });
      return res.json(data);
    }

    const candidates = buildPhoneCandidates(phoneNumber);
    const last10 = String(phoneNumber || '').replace(/\D/g, '').slice(-10);

    let user = await User.findOne({
      where: { phoneNumber: { [Op.in]: candidates } },
      include: [{ model: RenewalTable }]
    });

    if (!user && last10) {
      user = await User.findOne({
        where: { phoneNumber: { [Op.like]: `%${last10}` } },
        include: [{ model: RenewalTable }]
      });
    }

    const renewals = getRenewalRows(user);

    if (!user || renewals.length === 0) {
      return res.status(404).send(`<h2>No renewal record found for ${phoneNumber}</h2>`);
    }

    const parseJsonList = (value) => {
      if (!value) return [];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (error) {
        return [value];
      }
    };

    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Renewal Details</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .record-card { background: #f9f9f9; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 10px 0; }
        .field { background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #667eea; }
        .label { font-weight: bold; color: #333; margin-bottom: 5px; }
        .value { color: #666; }
        .copy-inline { margin-top: 6px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; color: #1e293b; font-size: 12px; font-weight: 700; padding: 6px 10px; cursor: pointer; }
        .user-info { background: #e9f3ff; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📋 Renewal Details</h1>
        <div class="user-info">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> <span class="copy-target">${user.name || 'N/A'}</span></p>
          <p><strong>Phone:</strong> <span class="copy-target">${user.phoneNumber || 'N/A'}</span></p>
          <p><strong>Address:</strong> <span class="copy-target">${user.address || 'N/A'}</span></p>
        </div>
    `;

    renewals.forEach((renewal, index) => {
      const capacityList = parseJsonList(renewal.capacity);
      const kvaList = parseJsonList(renewal.kva);

      htmlContent += `
        <div class="record-card">
          <h3>Renewal #${index + 1}</h3>
          <div class="field-row">
            <div class="field"><div class="label">Type</div><div class="value">${renewal.type || 'N/A'}</div></div>
            <div class="field"><div class="label">Quantity</div><div class="value">${renewal.quantity ?? 'N/A'}</div></div>
          </div>
          <div class="field-row">
            <div class="field"><div class="label">KVA</div><div class="value">${kvaList.join(', ') || 'N/A'}</div></div>
            <div class="field"><div class="label">Capacity</div><div class="value">${capacityList.join(', ') || 'N/A'}</div></div>
          </div>
        </div>
      `;
    });

    htmlContent += `
      </div>
      <script>
        (function () {
          function copyTextSafe(value) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              return navigator.clipboard.writeText(value);
            }

            return new Promise(function (resolve, reject) {
              try {
                const temp = document.createElement('textarea');
                temp.value = value;
                temp.style.position = 'fixed';
                temp.style.left = '-9999px';
                document.body.appendChild(temp);
                temp.focus();
                temp.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(temp);
                if (ok) resolve(); else reject(new Error('copy command failed'));
              } catch (err) {
                reject(err);
              }
            });
          }

          const nodes = document.querySelectorAll('.value, .copy-target');
          Array.prototype.forEach.call(nodes, function (element) {
            const valueText = (element.textContent || '').trim();
            if (!valueText || valueText === 'N/A') return;

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'copy-inline';
            copyBtn.textContent = 'Copy';

            copyBtn.addEventListener('click', function () {
              copyTextSafe(valueText)
                .then(function () {
                  const original = copyBtn.textContent;
                  copyBtn.textContent = 'Copied';
                  setTimeout(function () { copyBtn.textContent = original; }, 1200);
                })
                .catch(function (error) {
                  console.error('Copy failed:', error);
                });
            });

            element.insertAdjacentElement('afterend', copyBtn);
          });
        })();
      </script>
    </body>
    </html>
    `;

    res.send(htmlContent);
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

app.get('/paymentUploadForm', async (req, res) => {
  const { phoneNumber = '' } = req.query;

  if (!phoneNumber) {
    return res.status(400).send('Missing required query parameter: phoneNumber');
  }

  const normalizedPhoneNumber = String(phoneNumber).replace(/[^0-9]/g, '');
  if (!normalizedPhoneNumber) {
    return res.status(400).send('Invalid phone number in query parameter.');
  }

  try {
    // Fetch the latest pending/accepted quotation for this user
    const quotation = await quotationAmount.findOne({
      where: { phoneNumber: normalizedPhoneNumber },
      order: [['createdAt', 'DESC']]
    });

    const orderNo = quotation?.orderNo || '';
    const amount = quotation?.amount || '';

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Upload Payment Proof - Shree Laxmi Infratech</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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
          max-width: 500px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
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

        input[readonly] {
          background-color: #f5f5f5;
          cursor: not-allowed;
          color: #555;
        }

        input[type="file"] {
          padding: 8px;
          cursor: pointer;
        }

        .file-input-wrapper {
          position: relative;
          margin-bottom: 15px;
        }

        .file-label {
          display: inline-block;
          padding: 12px 20px;
          background: #667eea;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          text-align: center;
          width: 100%;
          transition: background 0.3s ease;
        }

        .file-label:hover {
          background: #5568d3;
        }

        input[type="file"] {
          display: none;
        }

        .file-name {
          color: #666;
          font-size: 13px;
          margin-top: 5px;
        }

        button {
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
          margin-top: 10px;
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        button:active {
          transform: translateY(0);
        }

        .error {
          color: #e74c3c;
          font-size: 13px;
          margin-top: 5px;
          display: none;
        }

        .info-text {
          color: #28a745;
          font-size: 13px;
          margin-top: 5px;
        }

        @media (max-width: 600px) {
          body {
            align-items: flex-start;
            padding: 12px;
          }

          .container {
            padding: 18px;
            border-radius: 10px;
            margin: 10px 0 18px;
          }

          .header h1 {
            font-size: 22px;
          }

          input, textarea, select, button, .file-label {
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 Payment Proof</h1>
          <p>Upload your payment screenshot to verify the transaction</p>
        </div>

        <form id="paymentForm" enctype="multipart/form-data">
          <div class="form-section">
            <h3>Payment Details</h3>

            <label for="phoneNumber">Phone Number</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value="${normalizedPhoneNumber}" readonly required />

            <label for="orderNo">Order Number</label>
            <input type="text" id="orderNo" name="orderNo" value="${orderNo}" readonly required />
            <div class="info-text">✓ Auto-filled from your quotation</div>

            <label for="amount">Amount (₹)</label>
            <input type="number" id="amount" name="amount" value="${amount}" readonly required />
            <div class="info-text">✓ Auto-filled from your quotation</div>
          </div>

          <div class="form-section">
            <h3>Screenshot</h3>

            <label>Payment Screenshot * (JPG/PNG)</label>
            <div class="file-input-wrapper">
              <label for="screenshot" class="file-label">📁 Choose Screenshot</label>
              <input type="file" id="screenshot" name="screenshot" accept="image/jpeg,image/png" required />
              <div class="file-name" id="fileName">No file chosen</div>
              <div class="error" id="fileError">Please select a valid image file (JPG/PNG only)</div>
            </div>
          </div>

          <button type="submit">✅ Upload Payment Proof</button>
          <div class="error" id="formError"></div>
        </form>
      </div>

      <script>
        document.getElementById('screenshot').addEventListener('change', function() {
          const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
          document.getElementById('fileName').textContent = fileName;
          document.getElementById('fileError').style.display = 'none';
        });

        document.getElementById('paymentForm').addEventListener('submit', async function(e) {
          e.preventDefault();

          const fileInput = document.getElementById('screenshot');
          if (!fileInput.files || fileInput.files.length === 0) {
            document.getElementById('fileError').style.display = 'block';
            return;
          }

          const file = fileInput.files[0];
          if (!['image/jpeg', 'image/png'].includes(file.type)) {
            document.getElementById('fileError').style.display = 'block';
            return;
          }

          const formData = new FormData(this);
          
          try {
            const response = await fetch('/payment/upload', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              const html = await response.text();
              document.write(html);
            } else {
              const error = await response.json();
              document.getElementById('formError').textContent = error.error || 'Upload failed. Please try again.';
              document.getElementById('formError').style.display = 'block';
            }
          } catch (err) {
            document.getElementById('formError').textContent = 'Network error. Please try again.';
            document.getElementById('formError').style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `);
  } catch (error) {
    console.error('Error loading payment upload form:', error);
    return res.status(500).send('Error loading form. Please try again.');
  }
});

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

    await quotationAmount.create({
      phoneNumber,
      name,
      type,
      amount,
      pdfData: req.file.buffer,
      pdfMimeType: req.file.mimetype,
      pdfOriginalName: req.file.originalname,
      status: 'pending',
      userId: user.id,
      orderNo
    });

    const documentUrl = `${process.env.BASE_URL}/document/quotation/${phoneNumber}/${orderNo}`;

    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product : 'whatsapp',
        to: phoneNumber,
        type: "document",
        document: {
          link: documentUrl,
          filename: req.file.originalname
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    setTimeout(() => {
      sendButton(phoneNumber, "Please review the quotation at your earliest convenience.\n\nReply by selecting one of the options below:", [
        { id: "accept_quotation", title: "✅ Accept Quotation" },
        { id: "quotation_reject", title: "❌ Reject Quotation" },
      ])
    }, 3000);

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
    console.error("❌ Error in fetching quotation details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(403).json({ 
      error: "Something went wrong",
      details: error.message
    });
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

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing required field: phoneNumber' });
    }

    let user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      user = await User.create({ name, phoneNumber, address });
    }

    let serialNoValue = [];
    try {
      serialNoValue = Array.isArray(serialNo) ? serialNo : JSON.parse(serialNo || '[]');
    } catch (error) {
      serialNoValue = [];
    }

    let weightArray = [];
    try {
      const parsedWeight = JSON.parse(weight || '{"weight":[]}');
      if (Array.isArray(parsedWeight)) {
        weightArray = parsedWeight.map(Number).filter(value => !Number.isNaN(value));
      } else if (Array.isArray(parsedWeight.weight)) {
        weightArray = parsedWeight.weight.map(Number).filter(value => !Number.isNaN(value));
      }
    } catch (error) {
      weightArray = [];
    }

    const selectedType = String(type || '').trim().toLowerCase();
    const personCapacityArray = (selectedType === 'lift' || selectedType === 'escalator')
      ? weightArray.map(value => value / 68)
      : null;

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
      type: selectedType || type,
      ocAvailable: ocAvailable === 'true' || ocAvailable === true,
      ocNumber: ocNumber || null,
      ocDate: ocDate || null,
      Make: Make || null,
      serialNo: JSON.stringify(serialNoValue),
      weight: JSON.stringify(weightArray),
      proposedDateofcommencement: proposedDateofcommencement || null,
      proposedDateofcompletion: proposedDateofcompletion || null,
      quantity: quantity ? Number(quantity) : null,
      personCapacity: personCapacityArray ? JSON.stringify(personCapacityArray) : null,
      userId: user.id
    });

    const viewUrl = `${APP_BASE_URL}/premiseRegistration/view/${phoneNumber}`;
    const quotationUrl = `${APP_BASE_URL}/quotationForm?phoneNumber=${phoneNumber}&name=${encodeURIComponent(name || user.name || '')}&type=${encodeURIComponent(selectedType || type || '')}`;

    await normalText(phoneNumber, `Thank you ${name || user.name || 'Customer'}! Your Premise Registration for *${selectedType || type || 'application'}* has been submitted.\n\nThe details are as follows:\n- Type: ${selectedType || type || 'N/A'}\n- Quantity: ${quantity || 'N/A'}\n- Address: ${address || 'N/A'}\n\nWe will contact you shortly. Our team will send you the quotation.\n\nView submitted details: ${viewUrl}`);

    await normalText(process.env.OWNER_PHONE_NUMBER, `✅ *New Premise Registration Application*\n\n👤 *Customer:* ${name || user.name || 'N/A'}\n📱 *Phone:* +${phoneNumber}\n🔧 *Type:* ${selectedType || type || 'N/A'}\n🏠 *Owner:* ${OwnerName || 'N/A'}\n📮 *House No:* ${House_no || 'N/A'}\n📍 *Colony:* ${ColonyName || 'N/A'}\n📌 *Locality:* ${Locality || 'N/A'}\n👨‍💼 *Agent:* ${AgentName || 'N/A'}\n📞 *Quantity:* ${quantity || 'N/A'}\n\n*View Full Details:*\n${viewUrl}\n\n*Upload Quotation:*\n${quotationUrl}\n\nPlease review and take necessary action.`);

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
  } catch (error) {
    console.error('❌ Error saving premise registration:', error);
    res.status(500).json({ error: 'Something went wrong while saving premise registration', details: error.message });
  }

  
})

// Fetch premise registration data for a specific phone number
app.get('/premiseRegistration/:phoneNumber', async(req,res)=>{
  const { phoneNumber } = req.params;
  try{
    console.log(`Fetching premise registration data for phone number: ${phoneNumber}...`);
    const user = await User.findOne({
      where: { phoneNumber },
      include: [premiseLightInclude]
    });
    if(!user){
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  }catch(error){
    console.error(`❌ Error fetching premise registration data for ${phoneNumber}:`, error);
    res.status(403).json({ 
      error: "Something went wrong",
      details: error.message 
    });
  }
})

// View premise registration data in HTML format
app.get('/premiseRegistration/view/:phoneNumber', async(req,res)=>{
  const { phoneNumber } = req.params;
  try{
    console.log(`Fetching premise registration view for phone number: ${phoneNumber}...`);
    const user = await User.findOne({
      where: { phoneNumber },
      include: [premiseLightInclude]
    });
    if(!user || !user.premiseRegistrations || user.premiseRegistrations.length === 0){
      return res.status(404).send(`<h2>No premise registration found for ${phoneNumber}</h2>`);
    }
    
    const premises = user.premiseRegistrations;
    const parseJsonList = (value) => {
      if (!value) {
        return [];
      }

      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (parsed && Array.isArray(parsed.weight)) {
          return parsed.weight;
        }
        return [value];
      } catch (error) {
        return [value];
      }
    };

    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Premise Registration Details</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f9;
          padding: 20px;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #667eea;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        .premise-card {
          background: #f9f9f9;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 10px 0;
        }
        .field {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border-left: 3px solid #667eea;
        }
        .label {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .value {
          color: #666;
        }
          .copy-inline {
            margin-top: 6px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #f8fafc;
            color: #1e293b;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 10px;
            cursor: pointer;
          }
        .user-info {
          background: #e9f3ff;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📋 Premise Registration Details</h1>
        
        <div class="user-info">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> <span class="copy-target">${user.name || 'N/A'}</span></p>
          <p><strong>Phone:</strong> <span class="copy-target">${user.phoneNumber || 'N/A'}</span></p>
          <p><strong>Address:</strong> <span class="copy-target">${user.address || 'N/A'}</span></p>
        </div>
    `;
    
    premises.forEach((premise, index) => {
      const serialList = parseJsonList(premise.serialNo);
      const weightList = parseJsonList(premise.weight);
      const capacityList = parseJsonList(premise.personCapacity);

      htmlContent += `
        <div class="premise-card">
          <h3>Premise Registration #${index + 1}</h3>
          <div class="field-row">
            <div class="field">
              <div class="label">Owner Name</div>
              <div class="value">${premise.OwnerName || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Type</div>
              <div class="value">${premise.type || 'N/A'}</div>
            </div>
          </div>
          
          <div class="field-row">
            <div class="field">
              <div class="label">House No.</div>
              <div class="value">${premise.House_no || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Colony Name</div>
              <div class="value">${premise.ColonyName || 'N/A'}</div>
            </div>
          </div>
          
          <div class="field-row">
            <div class="field">
              <div class="label">Locality</div>
              <div class="value">${premise.Locality || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Landmark</div>
              <div class="value">${premise.Landmark || 'N/A'}</div>
            </div>
          </div>
          
          <div class="field-row">
            <div class="field">
              <div class="label">Agent Name</div>
              <div class="value">${premise.AgentName || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Agent Mobile</div>
              <div class="value">${premise.MobileAgent || 'N/A'}</div>
            </div>
          </div>
          
          <div class="field-row">
            <div class="field">
              <div class="label">Quantity</div>
              <div class="value">${premise.quantity || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Registration Type</div>
              <div class="value">${premise.RegistrationNeworOld || 'N/A'}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <div class="label">Email Agent</div>
              <div class="value">${premise.EmailAgent || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Agent Mobile</div>
              <div class="value">${premise.MobileAgent || 'N/A'}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <div class="label">OC Available</div>
              <div class="value">${premise.ocAvailable ? 'Yes' : 'No'}</div>
            </div>
            <div class="field">
              <div class="label">OC Number</div>
              <div class="value">${premise.ocNumber || 'N/A'}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <div class="label">Serial Numbers</div>
              <div class="value">${serialList.join(', ') || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Weights</div>
              <div class="value">${weightList.join(', ') || 'N/A'}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <div class="label">Person Capacity</div>
              <div class="value">${capacityList.join(', ') || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Make</div>
              <div class="value">${premise.Make || 'N/A'}</div>
            </div>
          </div>
          
          <div class="field-row">
            <div class="field">
              <div class="label">Proposed Start Date</div>
              <div class="value">${premise.proposedDateofcommencement ? new Date(premise.proposedDateofcommencement).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Proposed End Date</div>
              <div class="value">${premise.proposedDateofcompletion ? new Date(premise.proposedDateofcompletion).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field full">
              <div class="label">Documents</div>
              <div class="value">
                <a href="/document/premise/${user.id}/building">Building Plan</a><br />
                <a href="/document/premise/${user.id}/drawings">Drawings</a><br />
                <a href="/document/premise/${user.id}/safety">Safety Certificate</a><br />
                <a href="/document/premise/${user.id}/signature">Owner Signature</a>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    htmlContent += `
      </div>
      <script>
        (function () {
          function copyTextSafe(value) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              return navigator.clipboard.writeText(value);
            }

            return new Promise(function (resolve, reject) {
              try {
                const temp = document.createElement('textarea');
                temp.value = value;
                temp.style.position = 'fixed';
                temp.style.left = '-9999px';
                document.body.appendChild(temp);
                temp.focus();
                temp.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(temp);
                if (ok) resolve(); else reject(new Error('copy command failed'));
              } catch (err) {
                reject(err);
              }
            });
          }

          const nodes = document.querySelectorAll('.value, .copy-target');
          Array.prototype.forEach.call(nodes, function (element) {
            if (element.querySelector('a')) {
              return;
            }

            const valueText = (element.textContent || '').trim();
            if (!valueText || valueText === 'N/A') {
              return;
            }

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'copy-inline';
            copyBtn.textContent = 'Copy';

            copyBtn.addEventListener('click', function () {
              copyTextSafe(valueText)
                .then(function () {
                  const original = copyBtn.textContent;
                  copyBtn.textContent = 'Copied';
                  setTimeout(function () { copyBtn.textContent = original; }, 1200);
                })
                .catch(function (error) {
                  console.error('Copy failed:', error);
                });
            });

            element.insertAdjacentElement('afterend', copyBtn);
          });
        })();
      </script>
    </body>
    </html>
    `;
    
    res.send(htmlContent);
  }catch(error){
    console.error(`❌ Error fetching premise registration view for ${phoneNumber}:`, error);
    res.status(403).send(`<h2>Error: ${error.message}</h2>`);
  }
})

// Send premise registration data to owner via WhatsApp
app.get('/admin/sendPremiseToOwner/:phoneNumber', async(req,res)=>{
  const { phoneNumber } = req.params;
  try{
    console.log(`Sending premise registration data for ${phoneNumber} to owner...`);
    
    const user = await User.findOne({
      where: { phoneNumber },
      include: [premiseLightInclude]
    });
    
    if(!user || !user.premiseRegistrations || user.premiseRegistrations.length === 0){
      return res.status(404).json({ error: "No premise registration found" });
    }
    
    const premise = user.premiseRegistrations[0];
    const viewUrl = `${process.env.BASE_URL}/premiseRegistration/view/${phoneNumber}`;
    
    const message = `
✅ *New Premise Registration*

👤 *Customer:* ${user.name}
📱 *Phone:* +${phoneNumber}
🔧 *Type:* ${premise.type}
📍 *Location:* ${premise.Locality}, ${premise.ColonyName}
🏠 *Owner:* ${premise.OwnerName}
👨‍💼 *Agent:* ${premise.AgentName}
📞 *Quantity:* ${premise.quantity}

*View Full Details:*
${viewUrl}

Please review and take necessary action.
    `;
    
    await normalText(process.env.OWNER_PHONE_NUMBER, message);
    
    res.json({ 
      success: true, 
      message: "Premise registration data sent to owner",
      detailsUrl: viewUrl 
    });
  }catch(error){
    console.error(`❌ Error sending premise data to owner:`, error);
    res.status(403).json({ 
      error: "Something went wrong",
      details: error.message 
    });
  }
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
      .card { border-radius: 10px; }
      .header h2 { font-size: 21px; }
      input, select, textarea, .btn { font-size: 16px; }
      .btn { min-height: 44px; }
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
          <h3 class="section-title">Page 1: Company and Agent Details</h3>
          <div class="grid">
            <div class="field"><label>Company Name</label><input type="text" name="name" required /></div>
            <div class="field"><label>Phone Number</label><input type="text" value="${phoneNumber}" disabled /></div>
            <div class="field full"><label>Address</label><input type="text" name="address" required /></div>
            <div class="field"><label>Pincode</label><input type="text" name="pincode" pattern="[0-9]{6}" maxlength="6" required /></div>
            <div class="field"><label>Agent Name</label><input type="text" name="AgentName" required /></div>
            <div class="field"><label>Agent Email</label><input type="email" name="EmailAgent" required /></div>
            <div class="field"><label>Agent Mobile</label><input type="tel" name="MobileAgent" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" minlength="10" required /></div>
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
                <option value="yes">Yes</option>
                <option value="existing">Existing</option>
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
              <select name="ocAvailable" id="ocAvailableSelect" required>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div class="field" id="ocNumberField"><label>OC Number</label><input type="text" name="ocNumber" id="ocNumberInput" /></div>
            <div class="field" id="ocDateField"><label>OC Date</label><input type="date" name="ocDate" id="ocDateInput" /></div>
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
            <div class="field full"><label>Approved Building Plan</label><input type="file" name="ApprovedbuildingplanDocument" accept=".pdf,.jpg,.jpeg,.png" required /></div>
            <div class="field full"><label>Drawings of Premise</label><input type="file" name="DrawingsofPremise" accept=".pdf,.jpg,.jpeg,.png" required /></div>
            <div class="field full"><label>Safety Certificate</label><input type="file" name="SafetyCertificate" accept=".pdf,.jpg,.jpeg,.png" required /></div>
            <div class="field full"><label>Owner Signature</label><input type="file" name="SignatureofOwner" accept=".pdf,.jpg,.jpeg,.png" required /></div>
          </div>
        </section>
      </div>

      <div class="nav">
        <button type="button" id="prevBtn" class="btn btn-prev hidden">Back</button>
        <button type="button" id="nextBtn" class="btn btn-next">Next</button>
        <button type="submit" id="submitBtn" class="btn btn-submit hidden">Submit Application</button>
      </div>
      <div id="formError" style="display:none; margin: 0 24px 18px; color:#b91c1c; font-weight:700; font-size:13px;"></div>
    </form>
  </div>

  <script>
    const slides = document.getElementById('slides');
    const progressBar = document.getElementById('progressBar');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const typeSelect = document.getElementById('typeSelect');
    const registrationSelect = document.querySelector('select[name="RegistrationNeworOld"]');
    const ocAvailableSelect = document.getElementById('ocAvailableSelect');
    const ocNumberField = document.getElementById('ocNumberField');
    const ocDateField = document.getElementById('ocDateField');
    const ocNumberInput = document.getElementById('ocNumberInput');
    const ocDateInput = document.getElementById('ocDateInput');
    const commencementInput = document.querySelector('input[name="proposedDateofcommencement"]');
    const completionInput = document.querySelector('input[name="proposedDateofcompletion"]');
    const formError = document.getElementById('formError');
    const form = document.getElementById('premiseForm');

    let step = 0;

    typeSelect.value = "${type}";

    function showError(message) {
      formError.textContent = message;
      formError.style.display = 'block';
    }

    function clearError() {
      formError.textContent = '';
      formError.style.display = 'none';
    }

    function clearInputError(input) {
      if (!input) return;
      input.style.borderColor = '#cfd6df';
      input.style.boxShadow = 'none';
    }

    function markInputError(input) {
      if (!input) return;
      input.style.borderColor = '#dc2626';
      input.style.boxShadow = '0 0 0 2px rgba(220,38,38,0.18)';
    }

    function getTodayIso() {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().split('T')[0];
    }

    function validateDateRules() {
      const isNewRegistration = registrationSelect.value === 'yes' || registrationSelect.value === 'new';
      if (!isNewRegistration) {
        return true;
      }

      const today = getTodayIso();
      const invalidDate = [commencementInput, completionInput].find(function (input) {
        return input && input.value && input.value < today;
      });

      if (invalidDate) {
        markInputError(invalidDate);
        showError('According to the new lift act proposed by government, "Commentment and completion date can not be of past event if do so then select *existing* , it could cost you *15000*, challan fee from government as late fee.');
        return false;
      }

      return true;
    }

    function validateStep(stepIndex) {
      clearError();

      const currentSlide = document.querySelectorAll('.slide')[stepIndex];
      if (!currentSlide) {
        return true;
      }

      const requiredInputs = currentSlide.querySelectorAll('input[required], select[required], textarea[required]');
      let isValid = true;

      requiredInputs.forEach(function (input) {
        const isOcHidden = (input === ocNumberInput || input === ocDateInput) && ocAvailableSelect.value === 'false';
        if (isOcHidden) {
          clearInputError(input);
          return;
        }

        if (input.type === 'file') {
          if (!input.files || input.files.length === 0) {
            markInputError(input);
            isValid = false;
          }
          return;
        }

        if (!input.value || !String(input.value).trim()) {
          markInputError(input);
          isValid = false;
          return;
        }

        if (input.name === 'pincode' && !/^[0-9]{6}$/.test(String(input.value).trim())) {
          markInputError(input);
          isValid = false;
        }

        if (input.name === 'MobileAgent' && !/^[0-9]{10}$/.test(String(input.value).trim())) {
          markInputError(input);
          isValid = false;
        }
      });

      if (!isValid) {
        showError('Please fill all required fields correctly.');
        return false;
      }

      return validateDateRules();
    }

    function toggleOcFields() {
      const hideOc = ocAvailableSelect.value === 'false';

      ocNumberField.style.display = hideOc ? 'none' : '';
      ocDateField.style.display = hideOc ? 'none' : '';

      if (hideOc) {
        ocNumberInput.value = '';
        ocDateInput.value = '';
      }
    }

    function applyDateRules() {
      const isNewRegistration = registrationSelect.value === 'yes' || registrationSelect.value === 'new';
      const today = getTodayIso();

      [commencementInput, completionInput].forEach(function (input) {
        if (!input) return;
        input.min = isNewRegistration ? today : '';
      });
    }

    function updateStep() {
      slides.style.transform = 'translateX(-' + (step * 33.3333) + '%)';
      progressBar.style.width = ((step + 1) / 3) * 100 + '%';
      prevBtn.classList.toggle('hidden', step === 0);
      nextBtn.classList.toggle('hidden', step === 2);
      submitBtn.classList.toggle('hidden', step !== 2);
    }

    nextBtn.addEventListener('click', function () {
      if (!validateStep(step)) {
        return;
      }

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

    form.addEventListener('submit', function (event) {
      if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
        event.preventDefault();
        return;
      }

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

    [
      ...document.querySelectorAll('input, select, textarea')
    ].forEach(function (input) {
      input.addEventListener('input', function () {
        clearInputError(input);
        clearError();
      });

      input.addEventListener('change', function () {
        clearInputError(input);
        clearError();
      });
    });

    registrationSelect.addEventListener('change', function () {
      applyDateRules();
      validateDateRules();
    });

    [commencementInput, completionInput].forEach(function (input) {
      input.addEventListener('change', validateDateRules);
    });

    ocAvailableSelect.addEventListener('change', toggleOcFields);

    toggleOcFields();
    applyDateRules();

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
      pincode,
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

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Missing required field: phoneNumber' });
    }

    if (!MobileAgent || !/^\d{10}$/.test(String(MobileAgent).trim())) {
      return res.status(400).json({ error: 'Agent Mobile must be exactly 10 digits.' });
    }

    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ error: 'Pincode is required and must be 6 digits.' });
    }

    if (!MobileAgent || !/^\d{10}$/.test(String(MobileAgent).trim())) {
      return res.status(400).json({ error: 'Agent Mobile must be exactly 10 digits.' });
    }

    const mergedAddress = `${address || ''}${address ? ', ' : ''}${pincode}`;

    const selectedType = String(Array.isArray(type) ? type[0] : type || '').trim().toLowerCase();

    let user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      user = await User.create({ name, phoneNumber, address: mergedAddress });
    } else if ((!user.address || user.address === address) && mergedAddress) {
      await user.update({ address: mergedAddress });
    }

    let serialNoValue = [];
    try {
      serialNoValue = Array.isArray(serialNo) ? serialNo : JSON.parse(serialNo || '[]');
    } catch (error) {
      serialNoValue = [];
    }

    let weightArray = [];
    try {
      const parsedWeight = JSON.parse(weight || '{"weight":[]}');
      if (Array.isArray(parsedWeight)) {
        weightArray = parsedWeight.map(Number).filter(value => !Number.isNaN(value));
      } else if (Array.isArray(parsedWeight.weight)) {
        weightArray = parsedWeight.weight.map(Number).filter(value => !Number.isNaN(value));
      }
    } catch (error) {
      weightArray = [];
    }

    const personCapacityArray = (selectedType === 'lift' || selectedType === 'escalator')
      ? weightArray.map(value => value / 68)
      : null;

    const getUploadedDocument = (field) => {
      const file = req.files?.[field]?.[0];
      if (!file) return { data: null, mimeType: null };
      return { data: file.buffer, mimeType: file.mimetype };
    };

    const buildingPlan = getUploadedDocument('ApprovedbuildingplanDocument');
    const drawings = getUploadedDocument('DrawingsofPremise');
    const safetyDoc = getUploadedDocument('SafetyCertificate');
    const signature = getUploadedDocument('SignatureofOwner');

    const ownerNameValue = (OwnerName && String(OwnerName).trim()) || (name && String(name).trim()) || 'N/A';

    const isNewRegistration = String(RegistrationNeworOld || '').toLowerCase() === 'yes' || String(RegistrationNeworOld || '').toLowerCase() === 'new';
    const todayIso = new Date().toISOString().slice(0, 10);
    if (isNewRegistration) {
      if (proposedDateofcommencement && proposedDateofcommencement < todayIso) {
        return res.status(400).json({ error: 'According to the new lift act proposed by government, "Commentment and completion date can not be of past event if do so then select *existing* , it could cost you *15000*, challan fee from government as late fee.' });
      }
      if (proposedDateofcompletion && proposedDateofcompletion < todayIso) {
        return res.status(400).json({ error: 'According to the new lift act proposed by government, "Commentment and completion date can not be of past event if do so then select *existing* , it could cost you *15000*, challan fee from government as late fee.' });
      }
    }

    await premiseRegistration.create({
      OwnerName: ownerNameValue,
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
      type: selectedType || type,
      ocAvailable: ocAvailable === 'true' || ocAvailable === true,
      ocNumber: (ocAvailable === 'true' || ocAvailable === true) ? (ocNumber || null) : null,
      ocDate: (ocAvailable === 'true' || ocAvailable === true) ? (ocDate || null) : null,
      Make: Make || null,
      serialNo: JSON.stringify(serialNoValue),
      weight: JSON.stringify(weightArray),
      proposedDateofcommencement: proposedDateofcommencement || null,
      proposedDateofcompletion: proposedDateofcompletion || null,
      ApprovedbuildingplanDocument: buildingPlan.data,
      ApprovedbuildingplanDocumentMimeType: buildingPlan.mimeType,
      DrawingsofPremise: drawings.data,
      DrawingsofPremiseMimeType: drawings.mimeType,
      SafetyCertificate: safetyDoc.data,
      SafetyCertificateMimeType: safetyDoc.mimeType,
      SignatureofOwner: signature.data,
      SignatureofOwnerMimeType: signature.mimeType,
      quantity: quantity ? Number(quantity) : null,
      personCapacity: personCapacityArray ? JSON.stringify(personCapacityArray) : null,
      userId: user.id
    });

    const viewUrl = `${APP_BASE_URL}/premiseRegistration/view/${phoneNumber}`;
    const quotationUrl = `${APP_BASE_URL}/quotationForm?phoneNumber=${phoneNumber}&name=${encodeURIComponent(name || user.name || '')}&type=${encodeURIComponent(selectedType || type || '')}`;

    await normalText(phoneNumber, `Thank you ${name || user.name || 'Customer'}! Your Premise Registration for *${selectedType || type || 'application'}* has been submitted.\n\nThe details are as follows:\n- Type: ${selectedType || type || 'N/A'}\n- Quantity: ${quantity || 'N/A'}\n- Address: ${mergedAddress || 'N/A'}\n\nWe will contact you shortly. Our team will send you the quotation.\n\nView submitted details: ${viewUrl}`);

    await normalText(process.env.OWNER_PHONE_NUMBER, `✅ *New Premise Registration Application*\n\n👤 *Customer:* ${name || user.name || 'N/A'}\n📱 *Phone:* +${phoneNumber}\n🔧 *Type:* ${selectedType || type || 'N/A'}\n🏠 *Owner:* ${ownerNameValue}\n📮 *House No:* ${House_no || 'N/A'}\n📍 *Colony:* ${ColonyName || 'N/A'}\n📌 *Locality:* ${Locality || 'N/A'}\n📬 *Pincode:* ${pincode || 'N/A'}\n👨‍💼 *Agent:* ${AgentName || 'N/A'}\n📞 *Quantity:* ${quantity || 'N/A'}\n\n*View Full Details:*\n${viewUrl}\n\n*Upload Quotation:*\n${quotationUrl}\n\nPlease review and take necessary action.`);

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

  } catch (error) {
    console.error('❌ Error creating premise registration form data:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Something went wrong while submitting premise registration form.',
      details: error.message
    });
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

    if(type === 'Transformer-NOC-Registration' || type === 'DG-NOC-Registration'){
      kvaValue = kva;
    }
    if(type === 'Lift-NOC-Registration' || type === 'Escalator-NOC-Registration'){
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
normalText(phoneNumber, `Thank you ${name}! Your Premise Registration for *${type}* application has been submitted. \n\n The details are as follows: \n- Type: ${type} \n- Quantity: ${quantity} \n- Address: ${address}\n\n We will contact you shortly. \nOur team will send you the quotation. \n\n note: *If you want to apply for different services or renewal of NOC, reply with "another service".*`);
normalText(process.env.OWNER_PHONE_NUMBER, `New NOC Registration Application Received:\n\n*Name: ${name}*\n\n*Phone: +${phoneNumber}*\n\n*Address: ${address}*\n\n*Type: ${type}*\n\n*Quantity: ${quantity}*\n\n*KVA: ${kvaValue || 'N/A'}*\n\n*Capacity: ${capacityValue || 'N/A'}* \n\n*Please review the application and send the quotation on* ${APP_BASE_URL}/quotationForm?phoneNumber=${encodeURIComponent(phoneNumber)}&name=${encodeURIComponent(name || '')}&type=${encodeURIComponent(type || '')}`);
  }catch(error){
      console.error("❌ Error creating NOC registration:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
    res.status(403).json({ 
      error: "Something went wrong",
      details: error.message
    });
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
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

  <style>
    body {
      font-family: Arial;
      background: #f4f6f9;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }

    .container {
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      margin: 12px 0;
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

    @media (max-width: 600px) {
      body {
        padding: 10px;
      }

      .container {
        padding: 18px;
        border-radius: 10px;
      }

      h2 {
        font-size: 22px;
      }

      input, button {
        font-size: 16px;
      }
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

      if (type === 'Transformer-NOC-Registration' || type === 'DG-NOC-Registration') {
        dynamicFields.innerHTML += \`
          <label>KVA for Unit \${i}</label>
          <input type="number" name="kva[]" required />
        \`;
      } else if (type === 'Lift-NOC-Registration' || type === 'Escalator-NOC-Registration') {
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
    const candidates = buildPhoneCandidates(phoneNumber);
    const last10 = String(phoneNumber || '').replace(/\D/g, '').slice(-10);

    let user = await User.findOne({
      where: { phoneNumber: { [Op.in]: candidates } },
      include: [{ model: RenewalTable }]
    });

    if (!user && last10) {
      user = await User.findOne({
        where: { phoneNumber: { [Op.like]: `%${last10}` } },
        include: [{ model: RenewalTable }]
      });
    }

    if(!user){
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  }catch(error){
    console.error(`❌ Error fetching renewal data for ${phoneNumber}:`, {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(403).json({ 
      error: "Something went wrong",
      details: error.message 
    });
  }
})

app.get('/renewal/view/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    console.log(`Fetching renewal view for phone number: ${phoneNumber}...`);

    const candidates = buildPhoneCandidates(phoneNumber);
    const last10 = String(phoneNumber || '').replace(/\D/g, '').slice(-10);

    let user = await User.findOne({
      where: { phoneNumber: { [Op.in]: candidates } },
      include: [{ model: RenewalTable }]
    });

    if (!user && last10) {
      user = await User.findOne({
        where: { phoneNumber: { [Op.like]: `%${last10}` } },
        include: [{ model: RenewalTable }]
      });
    }

    const renewals = getRenewalRows(user);

    if (!user || renewals.length === 0) {
      return res.status(404).send(`<h2>No renewal record found for ${phoneNumber}</h2>`);
    }

    const parseJsonList = (value) => {
      if (!value) {
        return [];
      }

      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (error) {
        return [value];
      }
    };

    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Renewal Details</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f9;
          padding: 20px;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #667eea;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        .record-card {
          background: #f9f9f9;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 15px 0;
          border-radius: 4px;
        }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 10px 0;
        }
        .field {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border-left: 3px solid #667eea;
        }
        .label {
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        .value {
          color: #666;
        }
        .copy-inline {
          margin-top: 6px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: #f8fafc;
          color: #1e293b;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 10px;
          cursor: pointer;
        }
        .user-info {
          background: #e9f3ff;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📋 Renewal Details</h1>

        <div class="user-info">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> <span class="copy-target">${user.name || 'N/A'}</span></p>
          <p><strong>Phone:</strong> <span class="copy-target">${user.phoneNumber || 'N/A'}</span></p>
          <p><strong>Address:</strong> <span class="copy-target">${user.address || 'N/A'}</span></p>
        </div>
    `;

    renewals.forEach((renewal, index) => {
      const capacityList = parseJsonList(renewal.capacity);
      const kvaList = parseJsonList(renewal.kva);

      htmlContent += `
        <div class="record-card">
          <h3>Renewal #${index + 1}</h3>
          <div class="field-row">
            <div class="field">
              <div class="label">Type</div>
              <div class="value">${renewal.type || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Quantity</div>
              <div class="value">${renewal.quantity ?? 'N/A'}</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <div class="label">KVA</div>
              <div class="value">${kvaList.join(', ') || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Capacity</div>
              <div class="value">${capacityList.join(', ') || 'N/A'}</div>
            </div>
          </div>
        </div>
      `;
    });

    htmlContent += `
      </div>
      <script>
        (function () {
          function copyTextSafe(value) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              return navigator.clipboard.writeText(value);
            }

            return new Promise(function (resolve, reject) {
              try {
                const temp = document.createElement('textarea');
                temp.value = value;
                temp.style.position = 'fixed';
                temp.style.left = '-9999px';
                document.body.appendChild(temp);
                temp.focus();
                temp.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(temp);
                if (ok) resolve(); else reject(new Error('copy command failed'));
              } catch (err) {
                reject(err);
              }
            });
          }

          const nodes = document.querySelectorAll('.value, .copy-target');
          Array.prototype.forEach.call(nodes, function (element) {
            if (element.querySelector('a')) {
              return;
            }

            const valueText = (element.textContent || '').trim();
            if (!valueText || valueText === 'N/A') {
              return;
            }

            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'copy-inline';
            copyBtn.textContent = 'Copy';

            copyBtn.addEventListener('click', function () {
              copyTextSafe(valueText)
                .then(function () {
                  const original = copyBtn.textContent;
                  copyBtn.textContent = 'Copied';
                  setTimeout(function () { copyBtn.textContent = original; }, 1200);
                })
                .catch(function (error) {
                  console.error('Copy failed:', error);
                });
            });

            element.insertAdjacentElement('afterend', copyBtn);
          });
        })();
      </script>
    </body>
    </html>
    `;

    res.send(htmlContent);
  } catch (error) {
    console.error(`❌ Error fetching renewal view for ${phoneNumber}:`, error);
    res.status(403).send(`<h2>Error: ${error.message}</h2>`);
  }
});

app.post('/renewal', async (req,res)=>{
  try{
    const {name, phoneNumber, address, type, capacity, quantity, kva} = req.body;
    const selectedType = String(type || '').trim();

    // Validate all required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: "Invalid input",
        details: "Name is required"
      });
    }

    if (!phoneNumber || !phoneNumber.toString().trim()) {
      return res.status(400).json({ 
        error: "Invalid input",
        details: "Phone number is required"
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ 
        error: "Invalid input",
        details: "Address is required"
      });
    }

    if (!selectedType) {
      return res.status(400).json({ 
        error: "Invalid input",
        details: "Type is required"
      });
    }

    // Validate required fields
    if (!quantity || quantity === '' || isNaN(quantity)) {
      return res.status(400).json({ 
        error: "Invalid input",
        details: "Quantity must be a valid number"
      });
    }

    const quantityValue = parseInt(quantity, 10);
    if (quantityValue <= 0) {
      return res.status(400).json({ 
        error: "Invalid input",
        details: "Quantity must be greater than 0"
      });
    }
   
    let kvaValue = null;
    let capacityValue = null;
    if(selectedType === 'Transformer-Renewal' || selectedType === 'DG-Renewal'){
      kvaValue = Array.isArray(kva) ? kva : (kva ? [kva] : []);
    }
    if(selectedType === 'Lift-Renewal' || selectedType === 'Escalator-Renewal'){
      capacityValue = Array.isArray(capacity) ? capacity : (capacity ? [capacity] : []);
    }

    console.log("Received renewal data:", req.body);

    let user = await User.findOne({where: { phoneNumber }});
    if(!user){
      user = await User.create({ name, phoneNumber, address });
    }



    const renewalTypeDetails = await RenewalTable.create({
      type: selectedType,
      capacity: capacityValue && capacityValue.length > 0 ? JSON.stringify(capacityValue) : null,
      quantity: quantityValue,
      kva: kvaValue && kvaValue.length > 0 ? JSON.stringify(kvaValue) : null,
      userId: user.id
    })

    const renewalDetailsUrl = `${APP_BASE_URL}/renewal?phoneNumber=${encodeURIComponent(phoneNumber)}`;
    const quotationUrl = `${APP_BASE_URL}/quotationForm?phoneNumber=${phoneNumber}&name=${encodeURIComponent(name)}&type=${encodeURIComponent(selectedType)}`;

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
  <p>Your ${selectedType} application has been submitted.</p>
      <p>We will contact you shortly.</p>
    </div>
  </body>
  </html>
`);

    await normalText(phoneNumber, `Thank you ${name}! Your Renewal for *${selectedType}* application has been submitted.\n\nThe details are as follows:\n- Type: ${selectedType}\n- Quantity: ${quantityValue}\n- Address: ${address}\n\nWe will contact you shortly. Our team will send you the quotation.`);

    await normalText(process.env.OWNER_PHONE_NUMBER, `✅ *New Renewal Application Received*\n\n👤 *Customer:* ${name}\n📱 *Phone:* +${phoneNumber}\n🏠 *Address:* ${address}\n🔧 *Type:* ${selectedType}\n📦 *Quantity:* ${quantityValue}\n${kvaValue && kvaValue.length > 0 ? `\n⚡ *KVA:* ${kvaValue.join(', ')}` : ''}${capacityValue && capacityValue.length > 0 ? `\n👤 *Capacity:* ${capacityValue.join(', ')}` : ''}\n\n*View Full Details:*\n${renewalDetailsUrl}\n\n*Upload Quotation:*\n${quotationUrl}\n\nPlease review and take necessary action.`);

  }catch(error){
    console.error("❌ Error creating renewal data:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(403).json({ 
      error: "Something went wrong",
      details: error.message
    });
   
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
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

  <style>
    body {
      font-family: Arial;
      background: #f4f6f9;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }

    .container {
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      margin: 12px 0;
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

    @media (max-width: 600px) {
      body {
        padding: 10px;
      }

      .container {
        padding: 18px;
        border-radius: 10px;
      }

      h2 {
        font-size: 22px;
      }

      input, button {
        font-size: 16px;
      }
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

      if (type === 'Transformer-Renewal' || type === 'DG-Renewal') {
        dynamicFields.innerHTML += \`
          <label>KVA for Unit \${i}</label>
          <input type="number" name="kva[]" required />
        \`;
      } else if (type === 'Lift-Renewal' || type === 'Escalator-Renewal') {
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

// 📋 META COMPLIANCE: Terms of Service (for Meta app validation)
app.get('/terms', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Shree Laxmi Infratech</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f4f6f9;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #667eea;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    h2 {
      color: #667eea;
      margin-top: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .effective-date {
      background: #e9f3ff;
      padding: 15px;
      border-left: 4px solid #667eea;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    strong {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Terms of Service</h1>
    <div class="effective-date">
      <strong>Effective Date:</strong> April 3, 2026
    </div>

    <div class="section">
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using this WhatsApp bot service provided by Shree Laxmi Infratech, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
    </div>

    <div class="section">
      <h2>2. Use License</h2>
      <p>Permission is granted to temporarily download one copy of the materials (information or software) on our WhatsApp bot for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
      <ul>
        <li>Modify or copy the materials</li>
        <li>Use the materials for any commercial purpose or for any public display</li>
        <li>Attempt to decompile or reverse engineer any software contained on the bot</li>
        <li>Transmit or distribute the materials to any third party or over any network</li>
        <li>Remove any copyright or other proprietary notations from the materials</li>
      </ul>
    </div>

    <div class="section">
      <h2>3. Disclaimer</h2>
      <p>The materials on our WhatsApp bot are provided on an 'as is' basis. Shree Laxmi Infratech makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
    </div>

    <div class="section">
      <h2>4. Limitations</h2>
      <p>In no event shall Shree Laxmi Infratech or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our bot, even if Shree Laxmi Infratech or an authorized representative has been notified orally or in writing of the possibility of such damage.</p>
    </div>

    <div class="section">
      <h2>5. Accuracy of Materials</h2>
      <p>The materials appearing on our WhatsApp bot could include technical, typographical, or photographic errors. Shree Laxmi Infratech does not warrant that any of the materials on our bot are accurate, complete, or current. Shree Laxmi Infratech may make changes to the materials contained on our bot at any time without notice.</p>
    </div>

    <div class="section">
      <h2>6. Links</h2>
      <p>Shree Laxmi Infratech has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Shree Laxmi Infratech of the site. Use of any such linked website is at the user's own risk.</p>
    </div>

    <div class="section">
      <h2>7. Modifications</h2>
      <p>Shree Laxmi Infratech may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>
    </div>

    <div class="section">
      <h2>8. Governing Law</h2>
      <p>These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
    </div>

    <div class="section">
      <h2>9. Contact Information</h2>
      <p>If you have any questions about these Terms of Service, please contact us at +${process.env.OWNER_PHONE_NUMBER} via WhatsApp or email.</p>
    </div>
  </div>
</body>
</html>
  `);
});

// 📋 META COMPLIANCE: Privacy Policy (for Meta app validation)
app.get('/privacy', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Shree Laxmi Infratech</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f4f6f9;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #667eea;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    h2 {
      color: #667eea;
      margin-top: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .effective-date {
      background: #e9f3ff;
      padding: 15px;
      border-left: 4px solid #667eea;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    strong {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy</h1>
    <div class="effective-date">
      <strong>Effective Date:</strong> April 3, 2026
    </div>

    <div class="section">
      <h2>1. Introduction</h2>
      <p>Shree Laxmi Infratech ("we", "us", "our", or "the Company") operates the WhatsApp Bot service. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.</p>
    </div>

    <div class="section">
      <h2>2. Information Collection and Use</h2>
      <p>We collect several different types of information for various purposes to provide and improve our service to you.</p>
      <h3>Types of Data Collected:</h3>
      <ul>
        <li><strong>Personal Data:</strong> Name, phone number, email address, address, and other contact information</li>
        <li><strong>Application Data:</strong> Information related to your applications (quotations, registrations, renewals)</li>
        <li><strong>Communication Data:</strong> Messages sent through WhatsApp bot interactions</li>
        <li><strong>Technical Data:</strong> Device information, IP address, usage patterns</li>
      </ul>
    </div>

    <div class="section">
      <h2>3. Use of Data</h2>
      <p>Shree Laxmi Infratech uses the collected data for various purposes:</p>
      <ul>
        <li>To provide and maintain our service</li>
        <li>To notify you about changes to our service</li>
        <li>To allow you to participate in interactive features of our service when you choose to do so</li>
        <li>To provide customer care and support</li>
        <li>To gather analysis or valuable information so that we can improve our service</li>
        <li>To monitor the usage of our service</li>
        <li>To detect, prevent and address technical issues</li>
      </ul>
    </div>

    <div class="section">
      <h2>4. Data Storage and Security</h2>
      <p>The security of your Personal Data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
      <p>Your data is stored in a PostgreSQL database hosted on secure cloud infrastructure. Access is restricted and monitored.</p>
    </div>

    <div class="section">
      <h2>5. Data Retention</h2>
      <p>We retain your Personal Data only for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy, or as required by law. You can request deletion of your data at any time by contacting us.</p>
    </div>

    <div class="section">
      <h2>6. Third-Party Services</h2>
      <p>Our service uses WhatsApp for communications. Please review WhatsApp's Privacy Policy for their practices regarding personal data.</p>
      <p>We do not share your personal data with third parties except:</p>
      <ul>
        <li>As necessary to provide our services</li>
        <li>With your explicit consent</li>
        <li>As required by law</li>
      </ul>
    </div>

    <div class="section">
      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Withdraw consent at any time</li>
        <li>Opt-out of communications</li>
      </ul>
    </div>

    <div class="section">
      <h2>8. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy or our privacy practices, please contact us:</p>
      <ul>
        <li><strong>WhatsApp:</strong> +${process.env.OWNER_PHONE_NUMBER}</li>
        <li><strong>Company Name:</strong> Shree Laxmi Infratech</li>
      </ul>
    </div>

    <div class="section">
      <h2>9. Changes to This Privacy Policy</h2>
      <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this Privacy Policy.</p>
    </div>
  </div>
</body>
</html>
  `);
});

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


// ✅ Send QR Code via WhatsApp Media Upload (no server storage)
const sendQRCodeToWhatsApp = async (phoneNumber, qrBase64, amount, type) => {
  try {
    // Step 1: Convert Base64 to Buffer
    const base64Data = qrBase64.replace('data:image/png;base64,', '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Step 2: Create FormData manually for axios multipart upload
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    const formData = [];
    
    formData.push(`--${boundary}`);
    formData.push('Content-Disposition: form-data; name="messaging_product"');
    formData.push('');
    formData.push('whatsapp');
    
    formData.push(`--${boundary}`);
    formData.push('Content-Disposition: form-data; name="file"; filename="qrcode.png"');
    formData.push('Content-Type: image/png');
    formData.push('');
    
    const bodyWithBoundary = Buffer.concat([
      Buffer.from(formData.join('\r\n') + '\r\n'),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    // Step 3: Upload to WhatsApp Media API
    console.log("📤 Uploading QR code to WhatsApp Media API...");
    const mediaResponse = await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/media`,
      bodyWithBoundary,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
      }
    );

    const mediaId = mediaResponse.data.id;
    console.log("✅ Media uploaded, ID:", mediaId);

    // Step 4: Send image using media ID
    await axios.post(
      `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'image',
        image: {
          id: mediaId,
          caption: `Scan this QR code to pay ₹${amount} for your ${type} application.`
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("✅ QR Code image sent successfully to", phoneNumber);
    return true;
  } catch (error) {
    console.error("❌ Error sending QR code:", error.response?.data || error.message);
    throw error;
  }
};

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
  return axios.post(
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

const APP_BASE_URL = process.env.BASE_URL || 'https://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com';

const premiseLightInclude = {
  model: premiseRegistration,
  attributes: {
    exclude: [
      'ApprovedbuildingplanDocument',
      'ApprovedbuildingplanDocumentMimeType',
      'DrawingsofPremise',
      'DrawingsofPremiseMimeType',
      'SafetyCertificate',
      'SafetyCertificateMimeType',
      'SignatureofOwner',
      'SignatureofOwnerMimeType'
    ]
  }
};

const buildPhoneCandidates = (rawPhone) => {
  const raw = String(rawPhone || '').trim();
  const digits = raw.replace(/\D/g, '');
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;

  return Array.from(new Set([
    raw,
    digits,
    `+${digits}`,
    last10,
    `91${last10}`,
    `+91${last10}`
  ].filter(Boolean)));
};

const getRenewalRows = (user) => {
  if (!user) {
    return [];
  }

  const plainUser = typeof user.toJSON === 'function' ? user.toJSON() : user;
  const rows = plainUser.RenewalTables || plainUser.renewalTables || user.RenewalTables || user.renewalTables || [];
  return Array.isArray(rows) ? rows : [];
};

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
      if (msg === 'ownerLine'){
        await normalText(from, "Owner window opened");
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
                    {id : "upload_payment", title: 'Upload Payment Proof'},

                ]
                
            )
            
        }
           if(buttonReply.id === 'accept_quotation'){
          try {
            normalText(from, "Thank you for accepting the quotation! Your application has been alloted to our executive, Mr Vikal Mavi. He will contact you shortly to assist you further. If you have any questions in the meantime, feel free to ask at +91 9911940454. We look forward to serving you! 😊")
            normalText(process.env.OWNER_PHONE_NUMBER, `Quotation Accepted:\n\n*Phone: ${from}*\n\nThe customer has accepted the quotation. Please assign an executive to contact the customer and proceed with the service.\n\nCheck the details of the application here: https://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/renewal/${from}`)

            const quotation = await quotationAmount.findOne({
              where: { phoneNumber: from },
              order: [['createdAt', 'DESC']]
            })
            
            if (!quotation) {
              console.error("❌ Quotation not found for:", from);
              normalText(from, "❌ Error: Could not find your quotation. Please try again or contact us.");
              return;
            }

            await quotation.update({ status: 'accepted' });

            // Generate QR code (returns Base64 data URL)
            let qrDataUrl;
            try {
              qrDataUrl = await QRcode(quotation.amount, quotation.orderNo);
              console.log("✅ QR Code generated successfully for order:", quotation.orderNo);
            } catch (qrError) {
              console.error("❌ QR Code generation failed:", qrError);
              normalText(from, "⚠️ QR code generation failed. Please contact us for payment details.");
              return;
            }

            // Send QR code via WhatsApp Media API
            try {
              await sendQRCodeToWhatsApp(from, qrDataUrl, quotation.amount, quotation.type);
              console.log("✅ QR Code image sent successfully");
            } catch (imageError) {
              console.error("❌ Failed to send QR Code image:", imageError.response?.data || imageError.message);
              normalText(from, "⚠️ Could not send QR code image. Please contact us at +918006243900 for payment details.");
            }

            const paymentUploadLink = `${process.env.BASE_URL}/paymentUploadForm?phoneNumber=${from}`;
            normalText(from, `✅ Once paid, please upload your payment screenshot here:\n\n${paymentUploadLink}\n\nThis helps us verify and confirm your payment quickly! 🚀`);

          } catch (error) {
            console.error("❌ Error in quotation acceptance:", error);
            normalText(from, "❌ An error occurred while processing your quotation acceptance. Please try again.");
          }

        }
        if(buttonReply.id === 'quotation_reject'){
          normalText(from, "Thank you for rejecting the quotation! Your application has been alloted to our executive, Mr Vikal Mavi. He will contact you shortly to assist you further. If you have any questions in the meantime, feel free to ask at +91 9911940454. We look forward to serving you! 😊")
          normalText(process.env.OWNER_PHONE_NUMBER, `Quotation Rejected:\n\n*Phone: +${from}*\n\nThe customer has rejected the quotation. Please assign an executive to contact the customer and proceed with the service.`)
        }

        // Handle payment confirmation button
        if(buttonReply.id && buttonReply.id.startsWith('confirm_payment_')) {
          const paymentId = buttonReply.id.replace('confirm_payment_', '');
          const payment = await paymentProof.findByPk(paymentId);
          
          if (payment) {
            await payment.update({ status: 'confirmed', ownerReviewedAt: new Date() });
            
            // Notify owner that they confirmed the payment
            await normalText(
              process.env.OWNER_PHONE_NUMBER,
              `✅ **Payment Confirmed**\n\n*Customer:* +${payment.phoneNumber}\n*Order:* ${payment.orderNo}\n*Amount:* ₹${payment.amount}\n\nConfirmation message sent to customer.`
            );
            
            // Send success message to customer
            await normalText(
              payment.phoneNumber,
              `🎉 **Your Payment Has Been Confirmed!**\n\n✅ *Order:* ${payment.orderNo}\n✅ *Amount:* ₹${payment.amount}\n\nThank you for your payment. Our team will proceed with your service. If you have any questions, please contact us. 😊`
            );
          }
        }

        // Handle payment rejection button
        if(buttonReply.id && buttonReply.id.startsWith('reject_payment_')) {
          const paymentId = buttonReply.id.replace('reject_payment_', '');
          const payment = await paymentProof.findByPk(paymentId);
          
          if (payment) {
            await payment.update({ status: 'rejected', ownerReviewedAt: new Date() });
            
            // Notify owner that they rejected the payment
            await normalText(
              process.env.OWNER_PHONE_NUMBER,
              `❌ **Payment Rejected**\n\n*Customer:* +${payment.phoneNumber}\n*Order:* ${payment.orderNo}\n*Amount:* ₹${payment.amount}\n\nRejection message sent to customer asking for clearer screenshot.`
            );
            
            // Send rejection message to customer
            await normalText(
              payment.phoneNumber,
              `⚠️ **Payment Screenshot Not Clear**\n\nUnfortunately, your payment screenshot could not be verified.\n\n*Order:* ${payment.orderNo}\n*Amount:* ₹${payment.amount}\n\n📸 Please upload a clearer screenshot showing:\n- Transaction ID/Reference\n- Amount transferred\n- Date and time\n\nReply with "Upload Payment Proof" from the menu to submit again. 🙏`
            );
          }
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
            `To apply for Transformer NOC Renewal, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/form?type=Transformer-Renewal&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of transformers\n- KVA rating for each transformer\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if (listReply.id === 'DG_renewal'){
          normalText(
            from,
            `To apply for DG NOC Renewal, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/form?type=DG-Renewal&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of DG sets\n- KVA rating for each DG set\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if (listReply.id === 'lift_renewal'){
          normalText(
            from,
            `To apply for Lift NOC Renewal, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/form?type=Lift-Renewal&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of lifts\n- KVA rating for each lift\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
        if (listReply.id === 'escalator_renewal'){
          normalText(
            from,
            `To apply for Escalator NOC Renewal, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/form?type=Escalator-Renewal&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of escalators\n- KVA rating for each escalator\n\nOur team will review your application and get back to you shortly. Thank you!`
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
            `To apply for Transformer NOC Registration, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/NoCRegistrationForm?type=Transformer-NOC-Registration&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of transformers\n- KVA rating for each transformer\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
          if(listReply.id === 'DG_registration'){
          normalText(
            from,
            `To apply for DG NOC Registration, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/NoCRegistrationForm?type=DG-NOC-Registration&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of DG sets\n- KVA rating for each DG set\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
         if(listReply.id === 'lift_registration'){
          normalText(
            from,
            `To apply for Lift NOC Registration, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/NoCRegistrationForm?type=Lift-NOC-Registration&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of lifts\n- KVA rating for each lift\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
         if(listReply.id === 'escalator_registration'){
          normalText(
            from,
            `To apply for Escalator NOC Registration, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/NoCRegistrationForm?type=Escalator-NOC-Registration&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Quantity of escalators\n- KVA rating for each escalator\n\nOur team will review your application and get back to you shortly. Thank you!`
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
            `To apply for Lift Premise Registration, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/premiseRegistrationForm?type=lift&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Owner Name\n- House No.\n- Colony Name\n- Landmark\n- Locality\n- Email of Agent (if any)\n- Mobile of Agent (if any)\n- Agent Name (if any)\n- Registration Type (New or Old)\n- Whether Private or Public\n- Whether Commercial or Residential\n- OC Available (Yes or No)\n- OC Number (if OC Available)\n- OC Date (if OC Available)\n- Make of Lift\n- Serial Number of Lift(s)\n- Weight of Lift(s)\n- Proposed Date of Commencement\n- Proposed Date of Completion\n- Quantity of Lifts\n\nOur team will review your application and get back to you shortly. Thank you!`
          )
        }
         if(listReply.id === 'escalator_PremiseRegistration'){
          normalText(
            from,
            `To apply for Escalator Premise Registration, please fill out the form below:\n\nhttps://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/premiseRegistrationForm?type=escalator&phoneNumber=${from}\n\n*Please ensure you have the following details ready:*\n- Owner Name\n- House No.\n- Colony Name\n- Landmark\n- Locality\n- Email of Agent (if any)\n- Mobile of Agent (if any)\n- Agent Name (if any)\n- Registration Type (New or Old)\n- Whether Private or Public\n- Whether Commercial or Residential\n- OC Available (Yes or No)\n- OC Number (if OC Available)\n- OC Date (if OC Available)\n- Make of Escalator\n- Serial Number of Escalator(s)\n- Weight of Escalator(s)\n- Proposed Date of Commencement\n- Proposed Date of Completion\n- Quantity of Escalators\n\nOur team will review your application and get back to you shortly. Thank you!`
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
        if(listReply.id === 'upload_payment'){
            normalText(
              from,
              `To upload your payment screenshot, please fill out the form below:\n\n${process.env.BASE_URL}/paymentUploadForm?phoneNumber=${from}\n\n*Please have the following details ready:*\n- Order Number\n- Amount Paid\n- Clear payment screenshot (JPG or PNG)\n\nOur team will verify your payment and confirm within 24 hours. Thank you! ✅`
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


