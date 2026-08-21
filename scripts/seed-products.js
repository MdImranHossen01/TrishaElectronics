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

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
});
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  purchasePrice: { type: Number },
  discountRate: { type: Number },
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, required: true, default: 0 },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  tags: [{ type: String }],
  images: [{ type: String }],
  attributes: [
    {
      key: { type: String },
      value: { type: String },
    },
  ],
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const baseProducts = [
  // ==================== Category 1: IP Camera ====================
  {
    name: 'Xiaomi Smart Camera C400',
    slug: 'xiaomi-smart-camera-c400',
    description: 'Experience 2.5K ultra-clear images and 4MP camera with the Xiaomi Smart Camera C400. Features 360-degree pan-tilt-zoom, AI human detection, and dual-band Wi-Fi support.',
    price: 4500,
    purchasePrice: 3500,
    stock: 50,
    sku: 'IPC-XM-C400',
    categorySlug: 'ip-camera',
    images: ['/assets/images/products/xiaomi-c400.webp'],
    tags: ['xiaomi', 'ip camera', 'security', 'c400'],
    attributes: [{ key: 'Resolution', value: '2.5K (2560x1440)' }, { key: 'Connectivity', value: 'Wi-Fi 2.4GHz/5GHz' }],
  },
  {
    name: 'TP-Link Tapo C210',
    slug: 'tp-link-tapo-c210',
    description: 'Tapo C210 Pan/Tilt Home Security Wi-Fi Camera. Records every image in crystal-clear 3MP resolution. Provides a visual distance of up to 30 ft at night.',
    price: 3800,
    purchasePrice: 2800,
    stock: 60,
    sku: 'IPC-TP-C210',
    categorySlug: 'ip-camera',
    images: ['/assets/images/products/tapo-c210.webp'],
    tags: ['tp-link', 'tapo', 'ip camera', 'security'],
    attributes: [{ key: 'Resolution', value: '3MP' }, { key: 'Storage', value: 'MicroSD up to 256GB' }],
  },
  {
    name: 'Imou Ranger 2',
    slug: 'imou-ranger-2',
    description: 'Ranger 2 indoor smart security camera. Features 1080P Full HD video, 360-degree coverage, smart tracking, human detection, and abnormal sound alarm.',
    price: 3500,
    purchasePrice: 2500,
    stock: 45,
    sku: 'IPC-IM-RNG2',
    categorySlug: 'ip-camera',
    images: ['/assets/images/products/imou-ranger2.webp'],
    tags: ['imou', 'ranger 2', 'ip camera', 'security'],
    attributes: [{ key: 'Field of View', value: '360 degree' }, { key: 'Audio', value: 'Two-way talk' }],
  },
  {
    name: 'Eufy Security Solo OutdoorCam C22',
    slug: 'eufy-security-solo-outdoorcam-c22',
    description: 'Eufy OutdoorCam C22 spotlight security camera. Features 2K resolution, color night vision, no monthly fees, and IP67 weatherproof rating for reliable outdoor use.',
    price: 5500,
    purchasePrice: 4200,
    stock: 30,
    sku: 'IPC-EF-C22',
    categorySlug: 'ip-camera',
    images: ['/assets/images/products/eufy-c22.webp'],
    tags: ['eufy', 'outdoor camera', 'ip camera', 'security'],
    attributes: [{ key: 'Weatherproof', value: 'IP67' }, { key: 'Resolution', value: '2K' }],
  },
  {
    name: 'Srihome SH025 Auto Tracking Camera',
    slug: 'srihome-sh025-auto-tracking-camera',
    description: 'Srihome SH025 1080P Full HD pan/tilt IP camera. Features AI auto tracking, motion detection, micro-SD slot, and infrared night vision.',
    price: 2800,
    purchasePrice: 1900,
    stock: 40,
    sku: 'IPC-SH-SH025',
    categorySlug: 'ip-camera',
    images: ['/assets/images/products/srihome-sh025.webp'],
    tags: ['srihome', 'ip camera', 'auto tracking', 'security'],
    attributes: [{ key: 'Night Vision', value: 'Infrared LED' }, { key: 'Resolution', value: '1080P' }],
  },

  // ==================== Category 2: LED TV ====================
  {
    name: 'Sony BRAVIA KD-55X80L 55 Inch TV',
    slug: 'sony-bravia-kd-55x80l-55-inch-tv',
    description: 'Sony BRAVIA KD-55X80L 55-inch 4K Ultra HD Smart LED TV. Powered by the 4K HDR Processor X1, delivering pictures full of rich colors and detailed contrast.',
    price: 85000,
    purchasePrice: 72000,
    stock: 15,
    sku: 'TV-SO-55X80',
    categorySlug: 'led-tv',
    images: ['/assets/images/products/sony-bravia-55x80l.webp'],
    tags: ['sony', 'bravia', '4k tv', 'smart tv'],
    attributes: [{ key: 'Processor', value: '4K HDR Processor X1' }, { key: 'OS', value: 'Google TV' }],
  },
  {
    name: 'Samsung DU7700 43 Inch 4K Smart TV',
    slug: 'samsung-du7700-43-inch-4k-smart-tv',
    description: 'Samsung DU7700 43-inch Crystal UHD 4K Smart TV. Experience vivid colors, PurColor, and seamless gaming features with the powerful Crystal Processor 4K.',
    price: 48000,
    purchasePrice: 38000,
    stock: 20,
    sku: 'TV-SS-43DU',
    categorySlug: 'led-tv',
    images: ['/assets/images/products/samsung-43du7700.webp'],
    tags: ['samsung', '43 inch', '4k tv', 'smart tv'],
    attributes: [{ key: 'Display Technology', value: 'Crystal UHD' }, { key: 'HDMI Ports', value: '3' }],
  },
  {
    name: 'Xiaomi TV A Pro 55 Inch Smart TV',
    slug: 'xiaomi-tv-a-pro-55-inch-smart-tv',
    description: 'Xiaomi TV A Pro 55-inch 4K UHD smart TV. Premium frameless design, Dolby Vision, Google TV built-in, and immersive DTS-X audio output.',
    price: 52000,
    purchasePrice: 44000,
    stock: 18,
    sku: 'TV-XM-AP55',
    categorySlug: 'led-tv',
    images: ['/assets/images/products/xiaomi-apro-55.webp'],
    tags: ['xiaomi', '55 inch', '4k tv', 'google tv'],
    attributes: [{ key: 'Sound Output', value: '24W Speaker' }, { key: 'Bezel', value: 'Frameless' }],
  },
  {
    name: 'LG UR7500 50 Inch 4K Smart TV',
    slug: 'lg-ur7500-50-inch-4k-smart-tv',
    description: 'LG UR7500 50-inch Smart LED TV. Vibrant 4K HDR quality with the alpha 5 Gen 6 AI Processor, webOS 23 dashboard, and voice control integrations.',
    price: 62000,
    purchasePrice: 50000,
    stock: 12,
    sku: 'TV-LG-50UR',
    categorySlug: 'led-tv',
    images: ['/assets/images/products/lg-50ur7500.webp'],
    tags: ['lg', '50 inch', '4k tv', 'smart tv'],
    attributes: [{ key: 'Processor', value: 'a5 Gen6 AI Processor' }, { key: 'HDR', value: 'HDR10 Pro' }],
  },
  {
    name: 'Singer 32 Inch Frameless LED TV',
    slug: 'singer-32-inch-frameless-led-tv',
    description: 'Singer 32-inch HD Ready frameless TV. Features high-quality sound output, energy-saving mode, elegant slim legs, and crystal-clear picture resolution.',
    price: 18500,
    purchasePrice: 14000,
    stock: 25,
    sku: 'TV-SG-32FL',
    categorySlug: 'led-tv',
    images: ['/assets/images/products/singer-32-led.webp'],
    tags: ['singer', '32 inch', 'led tv', 'frameless'],
    attributes: [{ key: 'Resolution', value: 'HD Ready (1366x768)' }, { key: 'Warranty', value: '2 Years' }],
  },

  // ==================== Category 3: Projector ====================
  {
    name: 'Wanbo T2 Max New Smart Projector',
    slug: 'wanbo-t2-max-new-smart-projector',
    description: 'The Wanbo T2 Max New portable LCD projector. Supports Full HD 1080P resolution, smart Android operating system, autofocus, and 450 ANSI Lumens brightness.',
    price: 18500,
    purchasePrice: 14500,
    stock: 25,
    sku: 'PRJ-WB-T2M',
    categorySlug: 'projector',
    images: ['/assets/images/products/wanbo-t2-max.webp'],
    tags: ['wanbo', 'projector', 'portable', 'smart tv'],
    attributes: [{ key: 'Brightness', value: '450 ANSI Lumens' }, { key: 'OS', value: 'Android' }],
  },
  {
    name: 'Epson EB-E01 XGA Projector',
    slug: 'epson-eb-e01-xga-projector',
    description: 'Epson EB-E01 XGA 3LCD Business Projector. Ideal for meeting rooms, classrooms, and offices, offering 3300 Lumens brightness and superb color reproduction.',
    price: 42000,
    purchasePrice: 34000,
    stock: 15,
    sku: 'PRJ-EP-E01',
    categorySlug: 'projector',
    images: ['/assets/images/products/epson-eb-e01.webp'],
    tags: ['epson', 'projector', 'office', '3lcd'],
    attributes: [{ key: 'Brightness', value: '3,300 Lumens' }, { key: 'Contrast Ratio', value: '15,000:1' }],
  },
  {
    name: 'XGIMI MoGo 2 Pro Portable Projector',
    slug: 'xgimi-mogo-2-pro-portable-projector',
    description: 'XGIMI MoGo 2 Pro 1080P DLP portable projector. Immersive smart auto correction, built-in dual speakers, and Android TV 11 ecosystem for gaming and movies.',
    price: 58000,
    purchasePrice: 48000,
    stock: 10,
    sku: 'PRJ-XG-MG2',
    categorySlug: 'projector',
    images: ['/assets/images/products/xgimi-mogo2-pro.webp'],
    tags: ['xgimi', 'portable projector', 'android tv', 'premium'],
    attributes: [{ key: 'Resolution', value: '1080p Full HD' }, { key: 'Speakers', value: '2 x 8W' }],
  },
  {
    name: 'ViewSonic M1 Mini Plus Pocket Projector',
    slug: 'viewsonic-m1-mini-plus-pocket-projector',
    description: 'ViewSonic M1 Mini Plus ultra-portable pocket LED projector. Smart Wi-Fi connectivity, built-in JBL speakers, and an adjustable stand for ceiling projections.',
    price: 24000,
    purchasePrice: 18000,
    stock: 12,
    sku: 'PRJ-VS-M1M',
    categorySlug: 'projector',
    images: ['/assets/images/products/viewsonic-m1-mini.webp'],
    tags: ['viewsonic', 'pocket projector', 'led', 'jbl'],
    attributes: [{ key: 'Audio', value: 'JBL Speaker' }, { key: 'Weight', value: '280g' }],
  },
  {
    name: 'BenQ TH585P Full HD Gaming Projector',
    slug: 'benq-th585p-full-hd-gaming-projector',
    description: 'BenQ TH585P 3500 ANSI Lumens Full HD DLP gaming projector. Perfect for home entertainment with low input lag, game mode, and built-in speaker.',
    price: 68000,
    purchasePrice: 54000,
    stock: 8,
    sku: 'PRJ-BQ-585',
    categorySlug: 'projector',
    images: ['/assets/images/products/benq-th585p.webp'],
    tags: ['benq', 'gaming projector', '3500 lumens', 'home cinema'],
    attributes: [{ key: 'Input Lag', value: '16ms' }, { key: 'Lamp Life', value: 'Up to 15,000 Hours' }],
  },

  // ==================== Category 4: CC Camera ====================
  {
    name: 'Hikvision DS-2CE76D0T-ITPF Dome Camera',
    slug: 'hikvision-ds-2ce76d0t-itpf-dome-camera',
    description: 'Hikvision DS-2CE76D0T-ITPF 2MP indoor analog dome CC camera. Features Smart IR up to 20m, 4-in-1 video output switchable, and sharp day/night monitoring.',
    price: 1800,
    purchasePrice: 1200,
    stock: 100,
    sku: 'CCC-HK-DOME',
    categorySlug: 'cc-camera',
    images: ['/assets/images/products/hikvision-dome-2ce76d0t.webp'],
    tags: ['hikvision', 'dome camera', 'analog cc', 'security'],
    attributes: [{ key: 'Resolution', value: '2MP' }, { key: 'IR Range', value: '20m' }],
  },
  {
    name: 'Dahua DH-HAC-HFW1200RP Bullet Camera',
    slug: 'dahua-dh-hac-hfw1200rp-bullet-camera',
    description: 'Dahua DH-HAC-HFW1200RP 2MP HDCVI waterproof bullet camera. Max 30fps at 1080P, high-performance infrared night vision up to 20m, and robust plastic housing.',
    price: 1950,
    purchasePrice: 1350,
    stock: 80,
    sku: 'CCC-DH-BULL',
    categorySlug: 'cc-camera',
    images: ['/assets/images/products/dahua-bullet-hfw1200rp.webp'],
    tags: ['dahua', 'bullet camera', 'waterproof', 'analog cc'],
    attributes: [{ key: 'Protection', value: 'IP67 Waterproof' }, { key: 'Lens', value: '3.6mm Fixed' }],
  },
  {
    name: 'Jovision JVS-N933-SDL Dome IP Camera',
    slug: 'jovision-jvs-n933-sdl-dome-ip-camera',
    description: 'Jovision JVS-N933-SDL 3MP full-color smart network dome IP camera. Smart dual-light night vision, built-in mic, PoE support, and humanoid detection.',
    price: 3200,
    purchasePrice: 2200,
    stock: 50,
    sku: 'CCC-JV-N933',
    categorySlug: 'cc-camera',
    images: ['/assets/images/products/jovision-dome-n933.webp'],
    tags: ['jovision', 'ip camera', 'dome', 'poe camera'],
    attributes: [{ key: 'Resolution', value: '3MP' }, { key: 'Power', value: 'PoE / 12V DC' }],
  },
  {
    name: 'Hikvision DS-2CD2143G2-I Dome IP Camera',
    slug: 'hikvision-ds-2cd2143g2-i-dome-ip-camera',
    description: 'Hikvision DS-2CD2143G2-I 4MP EasyIP network dome camera. Outdoor vandal-proof IK10, weatherproof IP67, Smart IR up to 30m, and deep learning behavior analytics.',
    price: 6500,
    purchasePrice: 4800,
    stock: 40,
    sku: 'CCC-HK-IPD',
    categorySlug: 'cc-camera',
    images: ['/assets/images/products/hikvision-ip-dome-2cd2143.webp'],
    tags: ['hikvision', '4mp ip camera', 'poe', 'vandal-proof'],
    attributes: [{ key: 'Vandal Protection', value: 'IK10' }, { key: 'Resolution', value: '4MP' }],
  },
  {
    name: 'Uniview UAC-T112-F28 Bullet Camera',
    slug: 'uniview-uac-t112-f28-bullet-camera',
    description: 'Uniview UAC-T112-F28 2MP analog bullet camera. Compact design, supports TVI/AHD/CVI/CVBS, high-performance infrared night vision, and lightweight build.',
    price: 1750,
    purchasePrice: 1150,
    stock: 90,
    sku: 'CCC-UV-BULL',
    categorySlug: 'cc-camera',
    images: ['/assets/images/products/uniview-bullet-t112.webp'],
    tags: ['uniview', 'bullet camera', 'analog cc', 'security'],
    attributes: [{ key: 'Lens', value: '2.8mm' }, { key: 'Resolution', value: '2MP' }],
  }
];

// Revalidation logic or loop
// (We keep the rest of the file untouched)

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB successfully.');

    // Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing products.`);

    // Fetch all categories to map slug to ID
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.slug] = c._id;
    });

    // Prepare products with correct ObjectIds and Section Flags
    const finalProducts = baseProducts.map((p, idx) => {
      const categoryId = categoryMap[p.categorySlug];
      if (!categoryId) {
        throw new Error(`Category with slug "${p.categorySlug}" not found in DB! Seed categories first.`);
      }

      const productCopy = { ...p };
      productCopy.categories = [categoryId];
      delete productCopy.categorySlug;

      // Assign exactly 10 products with isFeatured = true (index 0 to 9)
      if (idx >= 0 && idx < 10) {
        productCopy.isFeatured = true;
      }

      // Assign exactly 10 products with isNewArrival = true (index 7 to 16)
      if (idx >= 7 && idx < 17) {
        productCopy.isNewArrival = true;
      }

      // Assign exactly 10 products with isFlashSale = true (index 14 to 23)
      if (idx >= 10 && idx < 20) {
        productCopy.isFlashSale = true;
      }

      // Assign exactly 10 products as discounted (index 0 to 9)
      if (idx >= 0 && idx < 10) {
        // Calculate a realistic sale price (e.g. around 8-15% discount)
        const discountRate = 10; // 10% discount
        productCopy.discountRate = discountRate;
        productCopy.salePrice = Math.round(productCopy.price * (1 - discountRate / 100));
      }

      return productCopy;
    });

    // Insert new products
    const insertResult = await Product.insertMany(finalProducts);
    console.log(`Seeded ${insertResult.length} products successfully!`);

    // Verify constraints
    let featuredCount = 0;
    let newArrivalCount = 0;
    let flashSaleCount = 0;
    let discountedCount = 0;

    insertResult.forEach(prod => {
      if (prod.isFeatured) featuredCount++;
      if (prod.isNewArrival) newArrivalCount++;
      if (prod.isFlashSale) flashSaleCount++;
      if (prod.salePrice && prod.discountRate) discountedCount++;
    });

    console.log(`Seeding Verification:`);
    console.log(`- Featured Products: ${featuredCount} (Expected: 10)`);
    console.log(`- New Arrivals: ${newArrivalCount} (Expected: 10)`);
    console.log(`- Flash Sales: ${flashSaleCount} (Expected: 10)`);
    console.log(`- Discounted Products: ${discountedCount} (Expected: 10)`);

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seed();
