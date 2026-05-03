const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sdgvpqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri);

const products = [
  // --- T-Shirts & Tops (1-10) ---
  { name: "White Organic Cotton Tee", price: 20, category: "T-Shirts", gender: "unisex", color: "White", description: "Breathable, high-quality organic cotton essential.", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518", stock: 50 },
  { name: "Graphic Vintage Tee", price: 25, category: "T-Shirts", gender: "unisex", color: "Gray", description: "Soft cotton tee featuring a 90s-inspired graphic print.", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c", stock: 30 },
  { name: "Black V-Neck Shirt", price: 22, category: "T-Shirts", gender: "unisex", color: "Black", description: "Classic slim-fit v-neck for a clean look.", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a", stock: 40 },
  { name: "Striped Breton Top", price: 28, category: "T-Shirts", gender: "unisex", color: "Navy/White", description: "Iconic nautical stripes in heavy-weight cotton.", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b", stock: 25 },
  { name: "Mustard Yellow Pocket Tee", price: 18, category: "T-Shirts", gender: "unisex", color: "Yellow", description: "Casual tee with a functional chest pocket.", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27", stock: 15 },
  { name: "Oversized Charcoal Hoody", price: 45, category: "T-Shirts", gender: "unisex", color: "Charcoal", description: "Heavy fleece hoody for maximum comfort.", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7", stock: 20 },
  { name: "Linen Blend Polo", price: 35, category: "T-Shirts", gender: "unisex", color: "Beige", description: "Breathable linen-cotton blend for warm weather.", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820", stock: 12 },
  { name: "Active Performance Tee", price: 30, category: "T-Shirts", gender: "unisex", color: "Blue", description: "Moisture-wicking fabric for gym and sports.", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820", stock: 35 },
  { name: "Long Sleeve Henley", price: 32, category: "T-Shirts", gender: "unisex", color: "Green", description: "Classic button-neck long sleeve shirt.", image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990", stock: 18 },
  { name: "Floral Print Tank Top", price: 15, category: "T-Shirts", gender: "unisex", color: "Multi", description: "Lightweight tank for peak summer heat.", image: "https://images.unsplash.com/photo-1503342392335-982f7bb802e4", stock: 22 },

  // --- Outerwear (11-20) ---
  { name: "Classic Blue Denim Jacket", price: 55, category: "Outerwear", gender: "unisex", color: "Blue", description: "Timeless denim with durable stitching.", image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9", stock: 15 },
  { name: "Urban Windbreaker", price: 40, category: "Outerwear", gender: "unisex", color: "Black", description: "Water-resistant jacket for windy days.", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea", stock: 8 },
  { name: "Leather Biker Jacket", price: 150, category: "Outerwear", gender: "unisex", color: "Black", description: "Genuine leather with asymmetric zip.", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5", stock: 4 },
  { name: "Puffer Winter Coat", price: 85, category: "Outerwear", gender: "unisex", color: "Red", description: "Insulated down jacket for sub-zero temps.", image: "https://images.unsplash.com/photo-1544923246-77307dd654ca", stock: 6 },
  { name: "Khaki Trench Coat", price: 110, category: "Outerwear", gender: "unisex", color: "Tan", description: "Classic waterproof double-breasted coat.", image: "https://images.unsplash.com/photo-1580657018950-c7f7d6a6d990", stock: 10 },
  { name: "Wool Blend Overcoat", price: 130, category: "Outerwear", gender: "men", color: "Gray", description: "Tailored fit wool coat for formal winter wear.", image: "https://images.unsplash.com/photo-1539533377285-a9255677ff4b", stock: 7 },
  { name: "Suede Bomber Jacket", price: 95, category: "Outerwear", gender: "unisex", color: "Brown", description: "Soft suede with ribbed cuffs and hem.", image: "https://images.unsplash.com/photo-1495001258031-d1b407bc1776", stock: 9 },
  { name: "Yellow Rain Slicker", price: 35, category: "Outerwear", gender: "unisex", color: "Yellow", description: "Bright waterproof jacket with hood.", image: "https://images.unsplash.com/photo-1620406042724-474a26532b24", stock: 11 },
  { name: "Quilted Vest", price: 50, category: "Outerwear", gender: "unisex", color: "Navy", description: "Lightweight layering piece for autumn.", image: "https://images.unsplash.com/photo-1604644401890-0bd678c83788", stock: 13 },
  { name: "Sherpa Lined Flannel", price: 48, category: "Outerwear", gender: "unisex", color: "Plaid", description: "Warm plaid shirt-jacket for camping.", image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9", stock: 16 },

  // --- Pants & Bottoms (21-30) ---
  { name: "Black Slim-Fit Chinos", price: 35, category: "Pants", gender: "unisex", color: "Black", description: "Versatile chinos for any occasion.", image: "https://images.unsplash.com/photo-1473966968600-fa804b86d30b", stock: 20 },
  { name: "Relaxed Fit Cargo Pants", price: 48, category: "Pants", gender: "unisex", color: "Olive", description: "Durable pants with multiple pockets.", image: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7", stock: 14 },
  { name: "Light Wash Distressed Jeans", price: 65, category: "Pants", gender: "unisex", color: "Light Blue", description: "Trendy ripped denim for casual weekends.", image: "https://images.unsplash.com/photo-1542272604-787c3835535d", stock: 12 },
  { name: "Navy Dress Slacks", price: 70, category: "Pants", gender: "men", color: "Navy", description: "Polished formal trousers with a sharp crease.", image: "https://images.unsplash.com/photo-1594932224828-b4b05a832fe3", stock: 10 },
  { name: "Grey Jogger Sweatpants", price: 30, category: "Pants", gender: "unisex", color: "Grey", description: "Comfy loungewear with tapered ankles.", image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea", stock: 25 },
  { name: "Khaki Bermuda Shorts", price: 25, category: "Pants", gender: "unisex", color: "Khaki", description: "Classic shorts for summer travel.", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b", stock: 19 },
  { name: "Corduroy Trousers", price: 55, category: "Pants", gender: "unisex", color: "Brown", description: "Textured vintage-style pants for fall.", image: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599", stock: 8 },
  { name: "Performance Leggings", price: 40, category: "Pants", gender: "women", color: "Purple", description: "High-stretch fabric for yoga and running.", image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8", stock: 30 },
  { name: "Raw Edge Denim Shorts", price: 32, category: "Pants", gender: "unisex", color: "Blue", description: "Casual cut-off style for hot weather.", image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c", stock: 15 },
  { name: "White Linen Trousers", price: 60, category: "Pants", gender: "unisex", color: "White", description: "Ultra-breathable pants for a coastal look.", image: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599", stock: 6 },

  // --- Dresses (31-40) ---
  { name: "Summer Floral Dress", price: 45, category: "Dresses", gender: "women", color: "White/Floral", description: "Perfect for beach parties.", image: "https://images.unsplash.com/photo-1572804013307-59c8ff94932a", stock: 10 },
  { name: "Evening Silk Gown", price: 120, category: "Dresses", gender: "women", color: "Burgundy", description: "Elegant silk for formal events.", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8", stock: 5 },
  { name: "Denim Pinafore", price: 50, category: "Dresses", gender: "women", color: "Blue", description: "Casual layerable dress for daily wear.", image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f", stock: 12 },
  { name: "Little Black Dress", price: 65, category: "Dresses", gender: "women", color: "Black", description: "Essential cocktail dress for any wardrobe.", image: "https://images.unsplash.com/photo-1564585192933-152f63b711db", stock: 15 },
  { name: "Maxi Sundress", price: 55, category: "Dresses", gender: "women", color: "Cyan", description: "Floor-length flowing dress for vacations.", image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c", stock: 9 },
  { name: "Boho Lace Midi", price: 75, category: "Dresses", gender: "women", color: "Cream", description: "Bohemian lace detailing with a midi cut.", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446", stock: 7 },
  { name: "Bodycon Mini Dress", price: 40, category: "Dresses", gender: "women", color: "Green", description: "Tight-fit stretch dress for night out.", image: "https://images.unsplash.com/photo-1539008835154-730219d92335", stock: 11 },
  { name: "Polka Dot Wrap Dress", price: 48, category: "Dresses", gender: "women", color: "Navy", description: "Classic wrap silhouette with playful dots.", image: "https://images.unsplash.com/photo-1518885391774-740849883b3e", stock: 14 },
  { name: "Knitted Sweater Dress", price: 58, category: "Dresses", gender: "women", color: "Beige", description: "Cozy knitwear for cold weather style.", image: "https://images.unsplash.com/photo-1550630993-c3749a463283", stock: 10 },
  { name: "Velvet Party Dress", price: 90, category: "Dresses", gender: "women", color: "Emerald", description: "Rich velvet fabric for holiday parties.", image: "https://images.unsplash.com/photo-1562157705-52bf3382c76a", stock: 8 },

  // --- Shoes (41-50) ---
  { name: "Red Canvas Sneakers", price: 60, category: "Shoes", gender: "unisex", color: "Red", description: "Vibrant sneakers with cushioned soles.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", stock: 12 },
  { name: "Minimalist Leather Loafers", price: 85, category: "Shoes", gender: "unisex", color: "Brown", description: "Bridging the gap between casual and formal.", image: "https://images.unsplash.com/photo-1531310197839-ccf54634509e", stock: 7 },
  { name: "White Leather Trainers", price: 95, category: "Shoes", gender: "unisex", color: "White", description: "Clean, high-end sneakers for everyday wear.", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772", stock: 10 },
  { name: "Combat Boots", price: 110, category: "Shoes", gender: "unisex", color: "Black", description: "Heavy-duty boots with lug soles.", image: "https://images.unsplash.com/photo-1520639889413-5d5587e9dd58", stock: 6 },
  { name: "Runners with Air Cushion", price: 75, category: "Shoes", gender: "unisex", color: "Grey/Lime", description: "Technical running shoes for endurance.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", stock: 14 },
  { name: "Suede Chelsea Boots", price: 125, category: "Shoes", gender: "unisex", color: "Tan", description: "Sleek pull-on boots with elastic side panels.", image: "https://images.unsplash.com/photo-1614107151491-6876e07a414b", stock: 5 },
  { name: "Espadrille Sandals", price: 35, category: "Shoes", gender: "unisex", color: "Cream", description: "Woven sole sandals for a tropical vibe.", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2", stock: 20 },
  { name: "High-Top Basketball Shoes", price: 130, category: "Shoes", gender: "unisex", color: "Red/Black", description: "Professional-grade ankle support on court.", image: "https://images.unsplash.com/photo-1512374382149-233c42b6a83b", stock: 8 },
  { name: "Pointed Toe Heels", price: 80, category: "Shoes", gender: "women", color: "Nude", description: "Classic office and evening stilettos.", image: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95", stock: 12 },
  { name: "Fleece-Lined House Slippers", price: 25, category: "Shoes", gender: "unisex", color: "Navy", description: "Ultra-soft indoor slippers for winter.", image: "https://images.unsplash.com/photo-1559146194-e8f0012f2c83", stock: 25 }
];

async function seedDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");

    const db = client.db("smartShop");
    const collection = db.collection("products");

    // Clear existing data to avoid duplicates during testing
    await collection.deleteMany({});
    console.log("Cleared existing products.");

    // Insert the new dataset
    const result = await collection.insertMany(products);
    console.log(`${result.insertedCount} products successfully added!`);

    // Quick gender breakdown for sanity
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