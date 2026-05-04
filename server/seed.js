const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri =
  process.env.MONGODB_URI ||
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sdgvpqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri);

// Image URL helper. Always uses Unsplash's standard hotlink params so we
// get optimised, properly-sized images and Unsplash treats it as legit
// hotlinking rather than blocking it.
const img = (id) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const products = [
  // --- T-Shirts & Tops (1-10) ---
  { name: "White Organic Cotton Tee", price: 20, category: "T-Shirts", gender: "unisex", color: "White", description: "Breathable, high-quality organic cotton essential.", image: img("1521572163474-6864f9cf17ab"), stock: 50 },
  { name: "Graphic Vintage Tee", price: 25, category: "T-Shirts", gender: "unisex", color: "Gray", description: "Soft cotton tee featuring a 90s-inspired graphic print.", image: img("1622445275576-721325763afe"), stock: 30 },
  { name: "Black V-Neck Shirt", price: 22, category: "T-Shirts", gender: "unisex", color: "Black", description: "Classic slim-fit v-neck for a clean look.", image: img("1583743814966-8936f5b7be1a"), stock: 40 },
  { name: "Striped Breton Top", price: 28, category: "T-Shirts", gender: "unisex", color: "Navy/White", description: "Iconic nautical stripes in heavy-weight cotton.", image: img("1618354691373-d851c5c3a990"), stock: 25 },
  { name: "Mustard Yellow Pocket Tee", price: 18, category: "T-Shirts", gender: "unisex", color: "Yellow", description: "Casual tee with a functional chest pocket.", image: img("1576566588028-4147f3842f27"), stock: 15 },
  { name: "Oversized Charcoal Hoody", price: 45, category: "T-Shirts", gender: "unisex", color: "Charcoal", description: "Heavy fleece hoody for maximum comfort.", image: img("1556821840-3a63f95609a7"), stock: 20 },
  { name: "Linen Blend Polo", price: 35, category: "T-Shirts", gender: "unisex", color: "Beige", description: "Breathable linen-cotton blend for warm weather.", image: img("1586790170083-2f9ceadc732d"), stock: 12 },
  { name: "Active Performance Tee", price: 30, category: "T-Shirts", gender: "unisex", color: "Blue", description: "Moisture-wicking fabric for gym and sports.", image: img("1581655353564-df123a1eb820"), stock: 35 },
  { name: "Long Sleeve Henley", price: 32, category: "T-Shirts", gender: "unisex", color: "Green", description: "Classic button-neck long sleeve shirt.", image: img("1604176354204-9268737828e4"), stock: 18 },
  { name: "Floral Print Tank Top", price: 15, category: "T-Shirts", gender: "unisex", color: "Multi", description: "Lightweight tank for peak summer heat.", image: img("1503342217505-b0a15ec3261c"), stock: 22 },

  // --- Outerwear (11-20) ---
  { name: "Classic Blue Denim Jacket", price: 55, category: "Outerwear", gender: "unisex", color: "Blue", description: "Timeless denim with durable stitching.", image: img("1576871337622-98d48d1cf531"), stock: 15 },
  { name: "Urban Windbreaker", price: 40, category: "Outerwear", gender: "unisex", color: "Black", description: "Water-resistant jacket for windy days.", image: img("1591047139829-d91aecb6caea"), stock: 8 },
  { name: "Leather Biker Jacket", price: 150, category: "Outerwear", gender: "unisex", color: "Black", description: "Genuine leather with asymmetric zip.", image: img("1551028719-00167b16eac5"), stock: 4 },
  { name: "Puffer Winter Coat", price: 85, category: "Outerwear", gender: "unisex", color: "Red", description: "Insulated down jacket for sub-zero temps.", image: img("1539533018447-63fcce2678e3"), stock: 6 },
  { name: "Khaki Trench Coat", price: 110, category: "Outerwear", gender: "unisex", color: "Tan", description: "Classic waterproof double-breasted coat.", image: img("1548883354-94bcfe321cbb"), stock: 10 },
  { name: "Wool Blend Overcoat", price: 130, category: "Outerwear", gender: "men", color: "Gray", description: "Tailored fit wool coat for formal winter wear.", image: img("1539533113208-f6df8cc8b543"), stock: 7 },
  { name: "Suede Bomber Jacket", price: 95, category: "Outerwear", gender: "unisex", color: "Brown", description: "Soft suede with ribbed cuffs and hem.", image: img("1495001258031-d1b407bc1776"), stock: 9 },
  { name: "Yellow Rain Slicker", price: 35, category: "Outerwear", gender: "unisex", color: "Yellow", description: "Bright waterproof jacket with hood.", image: img("1620799140408-edc6dcb6d633"), stock: 11 },
  { name: "Quilted Vest", price: 50, category: "Outerwear", gender: "unisex", color: "Navy", description: "Lightweight layering piece for autumn.", image: img("1601333144130-8cbb312386b6"), stock: 13 },
  { name: "Sherpa Lined Flannel", price: 48, category: "Outerwear", gender: "unisex", color: "Plaid", description: "Warm plaid shirt-jacket for camping.", image: img("1520903920243-00d872a2d1c9"), stock: 16 },

  // --- Pants & Bottoms (21-30) ---
  { name: "Black Slim-Fit Chinos", price: 35, category: "Pants", gender: "unisex", color: "Black", description: "Versatile chinos for any occasion.", image: img("1593030761757-71fae45fa0e7"), stock: 20 },
  { name: "Relaxed Fit Cargo Pants", price: 48, category: "Pants", gender: "unisex", color: "Olive", description: "Durable pants with multiple pockets.", image: img("1517445312882-bc9910d016b7"), stock: 14 },
  { name: "Light Wash Distressed Jeans", price: 65, category: "Pants", gender: "unisex", color: "Light Blue", description: "Trendy ripped denim for casual weekends.", image: img("1542272604-787c3835535d"), stock: 12 },
  { name: "Navy Dress Slacks", price: 70, category: "Pants", gender: "men", color: "Navy", description: "Polished formal trousers with a sharp crease.", image: img("1594938298603-c8148c4dae35"), stock: 10 },
  { name: "Grey Jogger Sweatpants", price: 30, category: "Pants", gender: "unisex", color: "Grey", description: "Comfy loungewear with tapered ankles.", image: img("1552902865-b72c031ac5ea"), stock: 25 },
  { name: "Khaki Bermuda Shorts", price: 25, category: "Pants", gender: "unisex", color: "Khaki", description: "Classic shorts for summer travel.", image: img("1591195853828-11db59a44f6b"), stock: 19 },
  { name: "Corduroy Trousers", price: 55, category: "Pants", gender: "unisex", color: "Brown", description: "Textured vintage-style pants for fall.", image: img("1624378439575-d8705ad7ae80"), stock: 8 },
  { name: "Performance Leggings", price: 40, category: "Pants", gender: "women", color: "Purple", description: "High-stretch fabric for yoga and running.", image: img("1506629082955-511b1aa562c8"), stock: 30 },
  { name: "Raw Edge Denim Shorts", price: 32, category: "Pants", gender: "unisex", color: "Blue", description: "Casual cut-off style for hot weather.", image: img("1565084888279-aca607ecce0c"), stock: 15 },
  { name: "White Linen Trousers", price: 60, category: "Pants", gender: "unisex", color: "White", description: "Ultra-breathable pants for a coastal look.", image: img("1617137968427-85924c800a22"), stock: 6 },

  // --- Dresses (31-40) ---
  { name: "Summer Floral Dress", price: 45, category: "Dresses", gender: "women", color: "White/Floral", description: "Perfect for beach parties.", image: img("1572804013427-4d7ca7268217"), stock: 10 },
  { name: "Evening Silk Gown", price: 120, category: "Dresses", gender: "women", color: "Burgundy", description: "Elegant silk for formal events.", image: img("1566174053879-31528523f8ae"), stock: 5 },
  { name: "Denim Pinafore", price: 50, category: "Dresses", gender: "women", color: "Blue", description: "Casual layerable dress for daily wear.", image: img("1591369822096-ffd140ec948f"), stock: 12 },
  { name: "Little Black Dress", price: 65, category: "Dresses", gender: "women", color: "Black", description: "Essential cocktail dress for any wardrobe.", image: img("1564859228273-274232fdb516"), stock: 15 },
  { name: "Maxi Sundress", price: 55, category: "Dresses", gender: "women", color: "Cyan", description: "Floor-length flowing dress for vacations.", image: img("1496747611176-843222e1e57c"), stock: 9 },
  { name: "Boho Lace Midi", price: 75, category: "Dresses", gender: "women", color: "Cream", description: "Bohemian lace detailing with a midi cut.", image: img("1515372039744-b8f02a3ae446"), stock: 7 },
  { name: "Bodycon Mini Dress", price: 40, category: "Dresses", gender: "women", color: "Green", description: "Tight-fit stretch dress for night out.", image: img("1612336307429-8a898d10e223"), stock: 11 },
  { name: "Polka Dot Wrap Dress", price: 48, category: "Dresses", gender: "women", color: "Navy", description: "Classic wrap silhouette with playful dots.", image: img("1518895949257-7621c3c786d7"), stock: 14 },
  { name: "Knitted Sweater Dress", price: 58, category: "Dresses", gender: "women", color: "Beige", description: "Cozy knitwear for cold weather style.", image: img("1550639525-c97d455acf70"), stock: 10 },
  { name: "Velvet Party Dress", price: 90, category: "Dresses", gender: "women", color: "Emerald", description: "Rich velvet fabric for holiday parties.", image: img("1583846783214-7229a91b20ed"), stock: 8 },

  // --- Shoes (41-50) ---
  { name: "Red Canvas Sneakers", price: 60, category: "Shoes", gender: "unisex", color: "Red", description: "Vibrant sneakers with cushioned soles.", image: img("1542291026-7eec264c27ff"), stock: 12 },
  { name: "Minimalist Leather Loafers", price: 85, category: "Shoes", gender: "unisex", color: "Brown", description: "Bridging the gap between casual and formal.", image: img("1531310197839-ccf54634509e"), stock: 7 },
  { name: "White Leather Trainers", price: 95, category: "Shoes", gender: "unisex", color: "White", description: "Clean, high-end sneakers for everyday wear.", image: img("1549298916-b41d501d3772"), stock: 10 },
  { name: "Combat Boots", price: 110, category: "Shoes", gender: "unisex", color: "Black", description: "Heavy-duty boots with lug soles.", image: img("1608256246200-53e635b5b65f"), stock: 6 },
  { name: "Runners with Air Cushion", price: 75, category: "Shoes", gender: "unisex", color: "Grey/Lime", description: "Technical running shoes for endurance.", image: img("1595950653106-6c9ebd614d3a"), stock: 14 },
  { name: "Suede Chelsea Boots", price: 125, category: "Shoes", gender: "unisex", color: "Tan", description: "Sleek pull-on boots with elastic side panels.", image: img("1638247025967-b4e38f787b76"), stock: 5 },
  { name: "Espadrille Sandals", price: 35, category: "Shoes", gender: "unisex", color: "Cream", description: "Woven sole sandals for a tropical vibe.", image: img("1543163521-1bf539c55dd2"), stock: 20 },
  { name: "High-Top Basketball Shoes", price: 130, category: "Shoes", gender: "unisex", color: "Red/Black", description: "Professional-grade ankle support on court.", image: img("1552346154-21d32810aba3"), stock: 8 },
  { name: "Pointed Toe Heels", price: 80, category: "Shoes", gender: "women", color: "Nude", description: "Classic office and evening stilettos.", image: img("1535043934128-cf0b28d52f95"), stock: 12 },
  { name: "Fleece-Lined House Slippers", price: 25, category: "Shoes", gender: "unisex", color: "Navy", description: "Ultra-soft indoor slippers for winter.", image: img("1559563458-527698bf5295"), stock: 25 }
];

async function seedDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");

    const db = client.db("smartShop");
    const collection = db.collection("products");

    await collection.deleteMany({});
    console.log("Cleared existing products.");

    const result = await collection.insertMany(products);
    console.log(`${result.insertedCount} products successfully added!`);

    const counts = await collection
      .aggregate([{ $group: { _id: "$gender", count: { $sum: 1 } } }])
      .toArray();
    console.log("Gender breakdown:", counts);
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await client.close();
  }
}

seedDB();