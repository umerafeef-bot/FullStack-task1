const { db, hashPassword } = require('./database');

function seedDatabase() {
  console.log('Seeding Task 1 E-commerce database...');

  // 1. Seed demo users
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCheck.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, avatar)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'Demo Customer',
      'demo@codealpha.com',
      hashPassword('password123'),
      'customer',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    );

    insertUser.run(
      'Store Admin',
      'admin@codealpha.com',
      hashPassword('admin123'),
      'admin',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    );
    console.log('✔ Users seeded (demo@codealpha.com / password123)');
  }

  // 2. Seed products
  const productCheck = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCheck.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (name, category, price, original_price, rating, reviews_count, stock, description, features, image_url, badge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const products = [
      {
        name: 'Aura Studio Wireless ANC Headphones',
        category: 'Audio',
        price: 249.99,
        original_price: 299.99,
        rating: 4.9,
        reviews_count: 142,
        stock: 18,
        description: 'Immerse yourself in acoustic perfection with active noise cancellation, 40-hour battery life, and spatial surround audio with ultra-soft memory foam earcups.',
        features: JSON.stringify(['Active Noise Canceling', '40-Hour Battery Life', 'Bluetooth 5.3 Multipoint', 'Custom 40mm Drivers', 'USB-C Fast Charging']),
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        badge: 'Best Seller'
      },
      {
        name: 'Apex Pro Mechanical Keyboard',
        category: 'Accessories',
        price: 139.50,
        original_price: 169.00,
        rating: 4.8,
        reviews_count: 98,
        stock: 25,
        description: 'Custom hot-swappable linear mechanical switches, aircraft-grade anodized aluminum frame, dynamic per-key RGB backlighting, and sound-dampening foam.',
        features: JSON.stringify(['Hot-swappable Switches', 'RGB Backlight 16.8M Colors', 'PBT Double-Shot Keycaps', 'Gasket Mount Design', 'Detachable Coiled Cable']),
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        badge: 'Staff Pick'
      },
      {
        name: 'Nova Ultra Slim Smartwatch Series 6',
        category: 'Wearables',
        price: 189.00,
        original_price: 229.00,
        rating: 4.7,
        reviews_count: 76,
        stock: 12,
        description: 'Crystal-clear always-on AMOLED display, heart rate monitor, SpO2 sensor, sleep tracking, GPS navigation, and 7-day extended battery life.',
        features: JSON.stringify(['1.43" AMOLED Display', 'Comprehensive Health Suite', '5ATM Water Resistant', 'Built-in GPS & Compass', 'Wireless Magnetic Charging']),
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        badge: 'Trending'
      },
      {
        name: 'Lumix Pro 4K Web Camera & Mic',
        category: 'Tech',
        price: 89.99,
        original_price: 119.99,
        rating: 4.6,
        reviews_count: 53,
        stock: 20,
        description: 'Stream and conference in ultra-crisp 4K HDR at 60fps. Includes dual noise-canceling beamforming microphones and an automatic privacy shutter.',
        features: JSON.stringify(['4K 60FPS Ultra HD', 'AI Auto-Framing & Focus', 'Dual Stereo Mic Array', 'Physical Privacy Shutter', 'Universal Monitor Mount']),
        image_url: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=800&auto=format&fit=crop&q=80',
        badge: 'Popular'
      },
      {
        name: 'Vanguard Ergonomic Gaming & Work Chair',
        category: 'Furniture',
        price: 329.00,
        original_price: 399.00,
        rating: 4.9,
        reviews_count: 64,
        stock: 8,
        description: 'Designed for elite focus and ergonomic comfort during long work and gaming sessions. Features 4D armrests, breathable mesh, and adaptive lumbar support.',
        features: JSON.stringify(['Adaptive Lumbar Support', '4D Adjustable Armrests', 'Breathable Hybrid Mesh', 'Class 4 Gas Lift Cylinder', '135° Recline Mechanism']),
        image_url: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=800&auto=format&fit=crop&q=80',
        badge: 'Featured'
      },
      {
        name: 'OmniDesk Walnut Solid Wood Monitor Stand',
        category: 'Accessories',
        price: 74.99,
        original_price: 89.99,
        rating: 4.8,
        reviews_count: 41,
        stock: 15,
        description: 'Elevate your workspace aesthetics and posture. Hand-crafted from sustainable black walnut wood with built-in desk organizer shelf and cable channel.',
        features: JSON.stringify(['100% Solid Natural Walnut', 'Holds up to 70 lbs', 'Cable Management Slot', 'Cork Protective Feet', 'Integrated Pen Tray']),
        image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
        badge: null
      },
      {
        name: 'Horizon Minimalist Canvas Messenger Bag',
        category: 'Apparel',
        price: 68.00,
        original_price: 85.00,
        rating: 4.5,
        reviews_count: 38,
        stock: 22,
        description: 'Weatherproof waxed canvas messenger bag with padded 16-inch laptop compartment, brass hardware, and quick-access magnetic closures.',
        features: JSON.stringify(['Water-Resistant Waxed Canvas', 'Padded 16" Laptop Sleeve', 'Genuine Leather Accents', 'Magnetic Buckle Fasteners', 'Comfort Padded Strap']),
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        badge: null
      },
      {
        name: 'EchoPulse High-Fidelity Bluetooth Speaker',
        category: 'Audio',
        price: 119.00,
        original_price: 149.00,
        rating: 4.7,
        reviews_count: 82,
        stock: 14,
        description: 'Room-filling 360-degree sound with deep bass radiators, IPX7 waterproof rating for outdoor adventures, and up to 24 hours of non-stop playback.',
        features: JSON.stringify(['360° Stereo Sound', 'IPX7 Waterproof', '24-Hour Playback', 'TWS Stereo Pairing Mode', 'Built-in Powerbank Port']),
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
        badge: 'Hot Deal'
      }
    ];

    for (const p of products) {
      insertProduct.run(
        p.name,
        p.category,
        p.price,
        p.original_price,
        p.rating,
        p.reviews_count,
        p.stock,
        p.description,
        p.features,
        p.image_url,
        p.badge
      );
    }
    console.log(`✔ ${products.length} Products seeded`);
  }

  // 3. Seed sample reviews
  const reviewCheck = db.prepare('SELECT COUNT(*) as count FROM reviews').get();
  if (reviewCheck.count === 0) {
    const insertReview = db.prepare(`
      INSERT INTO reviews (product_id, user_name, rating, comment)
      VALUES (?, ?, ?, ?)
    `);

    insertReview.run(1, 'Alex Rivera', 5, 'Best noise cancelling headphones I have ever owned. Sound quality is breathtaking!');
    insertReview.run(1, 'Sarah Chen', 5, 'Super comfortable for 8+ hour work sessions. Highly recommend.');
    insertReview.run(2, 'Marcus Thorne', 4, 'Keys feel incredibly tactile and the RGB software is super easy to tweak.');
    insertReview.run(3, 'Emily Watson', 5, 'Sleek look, tracks all my workouts and sleep accurately. Great battery life too!');
    console.log('✔ Sample product reviews seeded');
  }

  console.log('Task 1 database successfully prepared!');
}

seedDatabase();

module.exports = seedDatabase;
