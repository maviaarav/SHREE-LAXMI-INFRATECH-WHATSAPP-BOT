# Shree Laxmi Infratech WhatsApp Bot

A comprehensive WhatsApp bot solution built with Node.js, Express, and Sequelize that automates business workflows including NOC registration, premise registration, quotation management, and payment verification for Shree Laxmi Infratech.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Compliance URLs](#compliance-urls)
- [Database Models](#database-models)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## 🎯 Overview

This WhatsApp Bot is designed to streamline the business operations of Shree Laxmi Infratech by:
- Automating customer inquiries and registrations
- Managing NOC (No Objection Certificate) applications and renewals
- Processing premise registrations
- Handling quotation generation and acceptance/rejection
- Managing payment verification with UPI QR codes
- Maintaining customer and application records in a SQLite database

---

## ✨ Features

### 1. **NOC Registration & Renewal**
   - Automated NOC application submission
   - Support for new registrations and renewals
   - Quotation generation based on application type
   - Document upload and storage

### 2. **Premise Registration**
   - Multi-step property registration form
   - Owner and agent information collection
   - Document submission (building plans, safety certificates, signatures)
   - Automated notifications to owner

### 3. **Quotation Management**
   - Dynamic quotation form with PDF upload
   - Order number and amount tracking
   - Customer acceptance/rejection workflow
   - Executive assignment notifications

### 4. **Payment Verification**
   - UPI QR code generation for payments
   - Screenshot submission and verification
   - Owner payment confirmation/rejection
   - Automated customer notifications

### 5. **Customer Management**
   - User registration and profile management
   - Application history tracking
   - Payment proof storage
   - Document management
   - Chat-like typing indicator before bot responses

### 6. **Admin Features**
   - Owner notifications on all applications
   - Application review and action
   - Payment confirmation interface
   - Database management

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Git**
- **WhatsApp Business API Access**
  - WhatsApp Business Account
  - Phone Number ID
  - Access Token
- **ngrok** (for local testing with WhatsApp webhooks)

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/maviaarav/SHREE-LAXMI-INFRATECH-WHATSAPP-BOT.git
cd SHREE-LAXMI-INFRATECH-WHATSAPP-BOT
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create `.env` File

Create a `.env` file in the root directory:

```env
WHATSAPP_TOKEN=your_whatsapp_api_token_here
PHONE_NUMBER_ID=your_phone_number_id_here
BASE_URL=https://your-ngrok-url.ngrok-free.app
UPI_ID=your_upi_id@ybl
OWNER_PHONE_NUMBER=918006243900
```

### Step 4: Create Required Directories

```bash
mkdir -p uploads payments
```

### Step 5: Start the Server

```bash
node index.js
```

The server will run on `http://localhost:3000`

---

## ⚙️ Configuration

### WhatsApp API Setup

1. **Get Your WhatsApp Credentials:**
   - Go to [Meta Business Platform](https://business.facebook.com)
   - Create/configure your WhatsApp Business App
   - Generate an API token with `whatsapp_business_messaging` permission
   - Note your Phone Number ID

2. **Set Webhook URL:**
   - Use ngrok to create a public URL: `ngrok http 3000`
   - In your WhatsApp app settings, set webhook URL to: `https://your-ngrok-url/webhooks`
   - Verify Token: `my_verify_token`

3. **Configure `.env` Variables:**
   ```env
   WHATSAPP_TOKEN=EAAUkTHwFiJQBRD...  # Full API token
   PHONE_NUMBER_ID=1096312766897010     # Your Phone Number ID
   BASE_URL=https://abcd-1234-xyz.ngrok-free.app  # ngrok URL
   UPI_ID=8006243900@ybl                # Your UPI ID
   OWNER_PHONE_NUMBER=918006243900      # Owner's WhatsApp number
   ```

---

## 📁 Project Structure

```
SHREE-LAXMI-INFRATECH-WHATSAPP-BOT/
├── index.js                 # Main application file
├── package.json            # Project dependencies
├── .env                    # Environment variables (not in git)
├── .gitignore             # Git ignore file
├── README.md              # This file
│
├── database/
│   └── db.js              # Database connection setup
│
├── models/
│   ├── User.js            # User model
│   ├── nocRegistration.js # NOC registration model
│   ├── premiseRegistration.js # Premise registration model
│   ├── quotationAmount.js # Quotation model
│   ├── paymentProof.js    # Payment proof model
│   ├── renewalTable.js    # Renewal tracking model
│   └── relationship.js    # Model associations and exports
│
├── uploads/               # User-uploaded files (PDFs, documents)
├── payments/              # Generated UPI QR codes
│
└── [Other files and configurations]
```

---

## 🔌 API Endpoints

### Webhook Endpoints

#### POST `/webhooks`
Receives incoming WhatsApp messages
```bash
curl -X POST http://localhost:3000/webhooks \
  -H "Content-Type: application/json" \
  -d '{...}'
```

#### GET `/webhooks`
Webhook verification endpoint

---

### Compliance Endpoints

#### GET `/terms`
Terms of Service page (Meta app compliance)

#### GET `/privacy`
Privacy Policy page (Meta app compliance)

#### GET `/data-deletion`
Data Deletion Instructions page (Meta app compliance)

---

### Form Endpoints

#### GET `/quotationForm`
Quotation submission form
```
http://localhost:3000/quotationForm?phoneNumber=919876543210&name=John&type=NOC
```

#### GET `/nocRegistration`
NOC registration form

#### GET `/premiseRegistration`
Premise registration form

#### GET `/renewal`
Renewal application form

---

## 📋 Compliance URLs

Use these public URLs in Meta App Dashboard:

- Terms of Service: `https://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/terms`
- Privacy Policy: `https://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/privacy`
- Data Deletion Instructions: `https://shree-laxmi-infratech-whatsapp-bot-ixlw.onrender.com/data-deletion`

---

### Document Endpoints

#### GET `/document/quotation/:phoneNumber/:orderNo`
Download quotation PDF

#### GET `/payment/screenshot/:id`
View payment screenshot

---

### Form Submission Endpoints

#### POST `/quotationAmount`
Submit quotation form

#### POST `/nocRegistrationData`
Submit NOC registration

#### POST `/premiseRegistrationData`
Submit premise registration

#### POST `/paymentScreenshot`
Upload payment screenshot

---

## 🗄️ Database Models

### User Model
```javascript
- id (PK)
- phoneNumber (Unique)
- name
- email
- createdAt
- updatedAt
```

### NOC Registration Model
```javascript
- id (PK)
- phoneNumber (FK)
- name
- type
- quantity
- kvaValue
- capacityValue
- status
- timestamps
```

### Premise Registration Model
```javascript
- id (PK)
- phoneNumber (FK)
- name
- address
- OwnerName
- documents (multiple)
- timestamps
```

### Quotation Model
```javascript
- id (PK)
- phoneNumber (FK)
- orderNo
- amount
- pdfData
- status ('pending', 'accepted', 'rejected')
- timestamps
```

### Payment Proof Model
```javascript
- id (PK)
- phoneNumber (FK)
- orderNo
- amount
- screenshotData
- status ('pending', 'confirmed', 'rejected')
- timestamps
```

---

## 💬 Usage Guide

### For Customers

1. **Starting a Conversation:**
   - Message your WhatsApp bot
   - Choose from available options (NOC Registration, Premise Registration, etc.)

2. **NOC Registration:**
   - Fill out application form with property details
   - Receive quotation via WhatsApp
   - Accept or reject quotation
   - Executive will contact you

3. **Payment:**
   - Receive UPI QR code for payment
   - Complete payment
   - Upload payment screenshot
   - Owner verifies and confirms

4. **Tracking:**
   - Receive real-time updates on your application
   - View quotation history
   - Check payment status

### For Admin/Owner

1. **Receiving Notifications:**
   - Get instant notifications on new applications
   - Payment verification requests
   - Quotation acceptance/rejection alerts

2. **Managing Applications:**
   - Review customer submissions
   - Approve/reject quotations
   - Verify payments
   - Assign executives

3. **Responding to Customers:**
   - Send quotations via WhatsApp links
   - Confirm/reject payments
   - Send service confirmations

---

## 🛠️ Development

### Running in Development Mode

```bash
# Install nodemon for auto-reload
npm install --save-dev nodemon

# Add to package.json scripts
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js"
}

# Run development server
npm run dev
```

### Testing Webhooks Locally

```bash
# Start ngrok
ngrok http 3000

# Use ngrok URL in WhatsApp webhook settings
# Copy the forwarding URL (e.g., https://abcd-1234.ngrok-free.app)
```

### Database Debugging

```bash
# Access SQLite database
sqlite3 database.sqlite

# View tables
.tables

# Query users
SELECT * FROM Users;
```

---

## 🐛 Troubleshooting

### Issue: Messages Not Sending to Owner

**Solution:**
- Verify `OWNER_PHONE_NUMBER` in `.env` (should be in format: 918006243900)
- Check `WHATSAPP_TOKEN` is valid and not expired
- Ensure `PHONE_NUMBER_ID` is correct
- Check WhatsApp Business Account is approved

### Issue: Webhook Not Receiving Messages

**Solution:**
- Verify ngrok URL in `.env` matches the running ngrok session
- Check webhook URL in WhatsApp settings
- Ensure server is running: `node index.js`
- Verify `VERIFY_TOKEN` is set correctly

### Issue: QR Code Not Generating

**Solution:**
- Check `UPI_ID` in `.env` is correctly formatted (e.g., `8006243900@ybl`)
- Ensure `payments/` directory exists with write permissions
- Verify `amount` and `orderID` are passed correctly

### Issue: Database Errors

**Solution:**
- Delete `database.sqlite` to reset database
- Run: `node index.js` to recreate tables
- Check database folder permissions

### Issue: File Upload Failing

**Solution:**
- Verify `uploads/` and `payments/` directories exist
- Check directory permissions: `chmod 755 uploads payments`
- Ensure disk space is available

---

## 📊 Database Reset

To reset the database and start fresh:

```bash
rm database.sqlite
node index.js
```

This will recreate all tables with the defined schemas.

---

## 🔒 Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Rotate API tokens regularly** - Update `WHATSAPP_TOKEN` periodically
3. **Use HTTPS in production** - Don't use ngrok for production
4. **Validate all inputs** - Always sanitize customer data
5. **Limit file uploads** - Set maximum file size restrictions
6. **Database backups** - Regularly backup `database.sqlite`

---

## 📞 Support & Issues

### Reporting Bugs

- GitHub Issues: [Report Issue](https://github.com/maviaarav/SHREE-LAXMI-INFRATECH-WHATSAPP-BOT/issues)
- Include error messages, logs, and reproduction steps
- Attach relevant `.env` configuration (sanitized)

### For Shree Laxmi Infratech Support

- **Executive Contact:** Vikal Mavi - +91 9911940454
- **General Inquiries:** Contact via WhatsApp

---

## 📝 License

ISC License - See LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📚 Additional Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Express.js Documentation](https://expressjs.com/)
- [Sequelize ORM Documentation](https://sequelize.org/)
- [ngrok Documentation](https://ngrok.com/docs)

---

## 🔄 Version History

**v1.0.0** (Current)
- Initial release with NOC registration, Premise registration, Quotation management, and Payment verification

---

## ✅ Checklist Before Going Live

- [ ] `.env` file configured with valid credentials
- [ ] WhatsApp webhook URL verified and set
- [ ] OWNER_PHONE_NUMBER updated to actual owner number
- [ ] UPI_ID configured correctly
- [ ] Base URL set to production domain (not ngrok)
- [ ] Database backup strategy in place
- [ ] Error logging configured
- [ ] Rate limiting implemented
- [ ] Test all workflows end-to-end
- [ ] Customer documentation prepared

---

## 📧 Contact & Support

For questions or support:
- Create an issue on GitHub
- Contact: maviaarav@github.com

---

**Last Updated:** April 2, 2026

**Built with ❤️ for Shree Laxmi Infratech**
