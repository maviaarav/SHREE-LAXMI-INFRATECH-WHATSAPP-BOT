const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
dotenv = require('dotenv');
dotenv.config();
const { sequelize } = require('./models/relationship');
const { User, RenewalTable } = require('./models/relationship');
const multer = require('multer');


const port = 3000;

const VERIFY_TOKEN = "my_verify_token";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

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

app.get('/quotationForm', (req,res)=>{
  const { phoneNumber } = req.query
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

        <form method="POST" action="/quotation-submit" enctype="multipart/form-data">
          
          <div class="form-section">
            <h3>Upload Documents</h3>
            <input type="hidden" name="phoneNumber" value="${phoneNumber}" />
           <h4 class="info-box">Please upload the necessary documents for your application. Accepted formats: PDF Only.</h4>
           <input type="file" name="pdf" accept="application/pdf" required />
          </div>
          <button type="submit" class="btn-submit">📤 Send Quotation </button>
        </form>
      </div>
    </body>
    </html>
    `)

})
app.post('/quotation-submit', upload.single('pdf'), async(req,res)=>{
  const { phoneNumber } = req.body
  try{
    const pdfUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`
    console.log(pdfUrl)

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
      res.send("✅ PDF sent successfully!");
    setTimeout(()=>{
      sendButton(phoneNumber, "Please review the quotation at your earliest convenience.\n\nReply by selecting one of the options below:", [
        {id: "accept_quotation", title: "✅ Accept Quotation"},
        {id: "quotation_reject", title: "❌ Reject Quotation"},
      ],3000)
    })
  }catch (error){
      console.error(error.response?.data || error);
    res.send("❌ Error sending PDF");
  }

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
normalText(918006243900, `New NOC Renewal Application Received:\n\n*Name: ${name}*\n\n*Phone: +${phoneNumber}*\n\n*Address: ${address}*\n\n*Type: ${type}*\n\n*Quantity: ${quantity} KG*\n\n*KVA: ${kvaValue || 'N/A'} KVA*\n\n*Capacity: ${capacityValue || 'N/A'}* \n\n*Please review the application and send the quotation on* http://localhost:3000/quotationForm?phoneNumber=${phoneNumber}.`);

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
          normalText(918006243900, `Quotation Accepted:\n\n*Phone: ${from}*\n\nThe customer has accepted the quotation. Please assign an executive to contact the customer and proceed with the service.`)
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
                    {id : 'both-registration-1-2', title: 'T/F & DG NOC'},
                    {id : 'lift_registration', title: 'Lift NOC Registration'},
                    {id : 'escalator_registration', title: 'ESC NOC Registration'},
                    {id : 'last-two-noc', title: 'Lift & Escalator NOC'},


                ]
            )
        }
        if(listReply.id === 'premise_registation'){
         
            listButton(
                from,
                `Please select the type of * premise registration * you want to apply for:`,
                [
                    {id : 'lift_registration', title: 'Lift NOC Registration'},
                    {id : 'escalator_registration', title: 'ESC NOC Registration'},
                    {id : 'both-registration-1-2', title: 'Lift & Esclator'},
                ]
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
    await sequelize.sync();
    console.log("Database synced successfully");
  } catch (error) {
    console.error("Database sync failed:", error.message);
  }
});


