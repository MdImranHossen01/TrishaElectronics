const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local file to get MONGODB_URI
const envPath = path.join(__dirname, '../.env.local');
let mongodbUri = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.*)$/m);
  if (match && match[1]) {
    mongodbUri = match[1].trim().replace(/['"]/g, '');
  }
}

if (!mongodbUri) {
  mongodbUri = 'mongodb+srv://Trishna Electronics:xI2QuBaFZsYQ5vRD@cluster0.e5n1hnl.mongodb.net/Trishna Electronics';
}

console.log('Connecting to MongoDB...');

const FAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);

const faqs = [
  {
    question: 'What type of products does Trishna Electronics offer?',
    answer: 'Trishna Electronics specializes in high-quality smart home security and display solutions. We offer premium IP cameras, professional CC camera setups (dome and bullet), smart LED TVs, and home cinema projectors.',
    order: 1,
    isActive: true,
  },
  {
    question: 'Do your security cameras and projectors come with a warranty?',
    answer: 'Yes! All our electronic products—including IP cameras, LED TVs, and smart projectors—come with a 1-year to 3-year official manufacturer warranty. Detailed warranty information is listed on each product\'s page.',
    order: 2,
    isActive: true,
  },
  {
    question: 'What are the shipping charges and delivery times?',
    answer: 'Delivery within Dhaka takes 24 to 48 hours with a shipping fee of 60 BDT. For locations outside Dhaka, shipping is 120 BDT and delivery takes 2 to 4 business days.',
    order: 3,
    isActive: true,
  },
  {
    question: 'Do you provide installation services for CC camera security packages?',
    answer: 'Yes, we offer professional installation support for dome and bullet CC camera systems in Dhaka and select major cities. Please contact our support team at +8801819273596 for custom site inspection and pricing.',
    order: 4,
    isActive: true,
  },
  {
    question: 'Can I track my order status in real time?',
    answer: 'Absolutely! Once your order is processed, you will receive a tracking ID. You can enter this ID on our Track Order page to check its live location and shipping status.',
    order: 5,
    isActive: true,
  }
];

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB successfully.');

    // Clear existing FAQs
    const deleteResult = await FAQ.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing FAQs.`);

    // Insert new FAQs
    const insertResult = await FAQ.insertMany(faqs);
    console.log(`Seeded ${insertResult.length} FAQs successfully:`);
    insertResult.forEach((f, i) => {
      console.log(`[FAQ ${i + 1}] Question: "${f.question}"`);
    });

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seed();
