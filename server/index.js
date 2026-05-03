const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
var cors = require("cors");

const app = express();
const port = process.env.PORT || 5001;
const { GoogleGenerativeAI } = require("@google/generative-ai");

const Stripe = require("stripe");
// Initialise Stripe only if the key is present. Avoids a crash during
// initial deploys when env vars haven't been set yet. Routes that need
// Stripe will fail with a clear error at request time instead.
const stripe = process.env.STRIPE_SECRET_KEY
  ? Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// CORS configuration.
//   - In development: allow any origin so localhost:3000 (or any port) works.
//   - In production:  only allow the deployed frontend URL plus localhost
//                     (so you can still test against the prod backend from dev).
//
// CLIENT_URL is the deployed frontend's URL, e.g. https://the-rack.vercel.app
// Multiple origins can be comma-separated:
//   CLIENT_URL=https://the-rack.vercel.app,https://www.therack.com
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // In dev (no CLIENT_URL set), allow everything
    if (allowedOrigins.length === 0) return callback(null, true);
    // Allow localhost on any port for local dev work against prod backend
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow whitelisted production origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-replace-me-in-production";
const JWT_EXPIRY = "30d";

// MongoDB connection string.
//   - In production: set MONGODB_URI on Render to your full Atlas connection
//     string (the one that starts with mongodb+srv://).
//   - In development: keep using DB_USER and DB_PASS as before. The fallback
//     below builds the URI exactly the way the old code did.
const uri =
  process.env.MONGODB_URI ||
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sdgvpqs.mongodb.net/smartShop?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

function resolveOwner(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
      if (decoded?.email) return { ownerId: decoded.email, isUser: true };
    } catch (e) {
      return null;
    }
  }
  const guestId = req.query.guestId || req.body?.guestId;
  if (guestId && typeof guestId === "string" && guestId.startsWith("guest_")) {
    return { ownerId: guestId, isUser: false };
  }
  return null;
}

function requireUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function computeCartTotals(productsCollection, cartItems, shippingMethod) {
  const lineItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    if (!ObjectId.isValid(item.productId)) {
      throw new Error("Invalid product ID in cart");
    }
    const product = await productsCollection.findOne({
      _id: new ObjectId(item.productId),
    });
    if (!product) throw new Error(`Product ${item.productId} not found`);

    const qty = item.quantity || 1;
    if (product.stock < qty) {
      throw new Error(`${product.name} is out of stock`);
    }

    const lineSubtotal = product.price * qty;
    subtotal += lineSubtotal;

    lineItems.push({
      productId: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
    });
  }

  let shippingCost = 0;
  if (shippingMethod === "express") {
    shippingCost = 20;
  } else {
    shippingCost = subtotal >= 100 ? 0 : 8;
  }

  return { lineItems, subtotal, shippingCost, total: subtotal + shippingCost };
}

async function run() {
  try {
    await client.connect();

    const database = client.db("smartShop");
    const productsCollection = database.collection("products");
    const cartCollection = database.collection("cart");
    const usersCollection = database.collection("users");
    const ordersCollection = database.collection("orders");

    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await ordersCollection.createIndex({ userId: 1, createdAt: -1 });

    console.log("Connected successfully to smartShop database");

    // ---------------- PRODUCTS API ---------------- //

    app.get("/products", async (req, res) => {
      try {
        const { category, gender, limit } = req.query;
        const query = {};
        if (category) {
          query.category = { $regex: `^${category}$`, $options: "i" };
        }
        if (gender) {
          // Filter by exact gender, but always include unisex unless someone
          // explicitly asks for "unisex" only. So /products?gender=women
          // returns women's + unisex.
          if (gender === "unisex") {
            query.gender = "unisex";
          } else {
            query.gender = { $in: [gender, "unisex"] };
          }
        }
        let cursor = productsCollection.find(query);
        if (limit) {
          const n = parseInt(limit, 10);
          if (!isNaN(n) && n > 0) cursor = cursor.limit(n);
        }
        const products = await cursor.toArray();
        res.send(products);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch products" });
      }
    });

    app.get("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid product ID" });
        }
        const product = await productsCollection.findOne({ _id: new ObjectId(id) });
        if (product) res.json(product);
        else res.status(404).send({ message: "Product not found" });
      } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.get("/categories", async (req, res) => {
      try {
        const result = await productsCollection
          .aggregate([
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
                coverImage: { $first: "$image" },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();
        res.send(result.map((c) => ({ name: c._id, count: c.count, coverImage: c.coverImage })));
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch categories" });
      }
    });

    app.post("/products", async (req, res) => {
      const result = await productsCollection.insertOne(req.body);
      res.json(result);
    });

    // ---------------- USER AUTH API ---------------- //

    app.post("/users/register", async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !email.includes("@")) {
          return res.status(400).json({ error: "A valid email is required" });
        }
        if (!password || password.length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await usersCollection.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(409).json({ error: "An account with this email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await usersCollection.insertOne({
          email: normalizedEmail,
          passwordHash,
          createdAt: new Date(),
        });

        const token = jwt.sign(
          { email: normalizedEmail, userId: result.insertedId.toString() },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );

        res.json({ user: { email: normalizedEmail }, token });
      } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: "Registration failed" });
      }
    });

    app.post("/users/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: "Email and password are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await usersCollection.findOne({ email: normalizedEmail });
        if (!user) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
          { email: user.email, userId: user._id.toString() },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );

        res.json({ user: { email: user.email }, token });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
      }
    });

    app.get("/users/me", requireUser, async (req, res) => {
      res.json({ user: { email: req.user.email } });
    });

    // ---------------- CART API ---------------- //

    app.post("/cart", async (req, res) => {
      const owner = resolveOwner(req);
      if (!owner) return res.status(400).json({ error: "Missing identity (token or guestId)" });

      const { productId } = req.body;
      if (!productId) return res.status(400).json({ error: "productId is required" });

      try {
        const existing = await cartCollection.findOne({
          ownerId: owner.ownerId,
          productId,
        });

        if (existing) {
          const result = await cartCollection.updateOne(
            { _id: existing._id },
            { $inc: { quantity: 1 } }
          );
          return res.json(result);
        }

        const cartItem = {
          ownerId: owner.ownerId,
          productId,
          quantity: 1,
          addedAt: new Date(),
        };
        const result = await cartCollection.insertOne(cartItem);
        res.json(result);
      } catch (err) {
        console.error("Add to cart error:", err);
        res.status(500).send(err);
      }
    });

    app.get("/cart", async (req, res) => {
      const owner = resolveOwner(req);
      if (!owner) return res.json([]);

      try {
        const cartItems = await cartCollection.find({ ownerId: owner.ownerId }).toArray();
        const detailedCart = await Promise.all(
          cartItems.map(async (item) => {
            let productDetails = null;
            try {
              if (ObjectId.isValid(item.productId)) {
                productDetails = await productsCollection.findOne({
                  _id: new ObjectId(item.productId),
                });
              }
            } catch (_) {}
            return { ...item, productDetails };
          })
        );
        res.send(detailedCart);
      } catch (err) {
        console.error("Get cart error:", err);
        res.status(500).send(err);
      }
    });

    app.patch("/cart/:id", async (req, res) => {
      const owner = resolveOwner(req);
      if (!owner) return res.status(401).json({ error: "Identity required" });

      const id = req.params.id;
      const { quantity } = req.body;

      try {
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const item = await cartCollection.findOne({ _id: new ObjectId(id) });
        if (!item) return res.status(404).json({ error: "Item not found" });
        if (item.ownerId !== owner.ownerId) {
          return res.status(403).json({ error: "Not your cart item" });
        }
        const result = await cartCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { quantity: parseInt(quantity, 10) } }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Server error during update" });
      }
    });

    app.delete("/cart/:id", async (req, res) => {
      const owner = resolveOwner(req);
      if (!owner) return res.status(401).json({ error: "Identity required" });

      const id = req.params.id;
      try {
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid ID format" });
        }
        const item = await cartCollection.findOne({ _id: new ObjectId(id) });
        if (!item) return res.status(404).json({ error: "Item not found" });
        if (item.ownerId !== owner.ownerId) {
          return res.status(403).json({ error: "Not your cart item" });
        }
        const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Delete error" });
      }
    });

    app.post("/cart/merge", requireUser, async (req, res) => {
      try {
        const userEmail = req.user.email;
        const { guestId } = req.body;
        if (!guestId || !guestId.startsWith("guest_")) {
          return res.status(400).json({ error: "Valid guestId required" });
        }

        const guestItems = await cartCollection.find({ ownerId: guestId }).toArray();
        let merged = 0;

        for (const item of guestItems) {
          const existing = await cartCollection.findOne({
            ownerId: userEmail,
            productId: item.productId,
          });
          if (existing) {
            await cartCollection.updateOne(
              { _id: existing._id },
              { $inc: { quantity: item.quantity || 1 } }
            );
            await cartCollection.deleteOne({ _id: item._id });
          } else {
            await cartCollection.updateOne(
              { _id: item._id },
              { $set: { ownerId: userEmail } }
            );
          }
          merged++;
        }

        res.json({ merged });
      } catch (err) {
        console.error("Merge error:", err);
        res.status(500).json({ error: "Merge failed" });
      }
    });

    // ---------------- CHECKOUT + ORDERS API ---------------- //

    app.post("/checkout/create-payment-intent", requireUser, async (req, res) => {
      if (!stripe) {
        return res.status(503).json({
          error: "Payment processing is not configured. Set STRIPE_SECRET_KEY.",
        });
      }
      try {
        const { shippingMethod } = req.body;
        const userEmail = req.user.email;

        const cartItems = await cartCollection.find({ ownerId: userEmail }).toArray();
        if (cartItems.length === 0) {
          return res.status(400).json({ error: "Your cart is empty" });
        }

        const totals = await computeCartTotals(productsCollection, cartItems, shippingMethod);
        const amountInCents = Math.round(totals.total * 100);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          automatic_payment_methods: { enabled: true },
          metadata: {
            userEmail,
            shippingMethod: shippingMethod || "standard",
          },
        });

        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          subtotal: totals.subtotal,
          shippingCost: totals.shippingCost,
          total: totals.total,
          lineItems: totals.lineItems,
        });
      } catch (err) {
        console.error("create-payment-intent error:", err);
        res.status(400).json({ error: err.message || "Could not create payment intent" });
      }
    });

    app.post("/orders", requireUser, async (req, res) => {
      if (!stripe) {
        return res.status(503).json({
          error: "Payment processing is not configured. Set STRIPE_SECRET_KEY.",
        });
      }
      const { paymentIntentId, shippingAddress, shippingMethod } = req.body;
      const userEmail = req.user.email;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "paymentIntentId is required" });
      }
      if (!shippingAddress?.fullName || !shippingAddress?.line1) {
        return res.status(400).json({ error: "Shipping address is incomplete" });
      }

      let session;
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
          return res.status(400).json({ error: "Payment was not completed" });
        }
        if (paymentIntent.metadata?.userEmail !== userEmail) {
          return res.status(403).json({ error: "Payment does not belong to this user" });
        }

        const cartItems = await cartCollection.find({ ownerId: userEmail }).toArray();
        if (cartItems.length === 0) {
          return res.status(400).json({ error: "Cart is empty" });
        }

        const totals = await computeCartTotals(productsCollection, cartItems, shippingMethod);
        const expectedAmount = Math.round(totals.total * 100);
        if (expectedAmount !== paymentIntent.amount) {
          await stripe.refunds.create({ payment_intent: paymentIntentId });
          return res.status(409).json({
            error: "Cart changed during payment. You have been refunded.",
          });
        }

        session = client.startSession();
        let orderId;

        await session.withTransaction(async () => {
          for (const item of totals.lineItems) {
            const updated = await productsCollection.findOneAndUpdate(
              {
                _id: new ObjectId(item.productId),
                stock: { $gte: item.quantity },
              },
              { $inc: { stock: -item.quantity } },
              { returnDocument: "after", session }
            );
            const result = updated?.value !== undefined ? updated.value : updated;
            if (!result) {
              throw new Error(`${item.name} is no longer in stock`);
            }
          }

          const orderDoc = {
            userId: userEmail,
            email: userEmail,
            items: totals.lineItems,
            subtotal: totals.subtotal,
            shippingCost: totals.shippingCost,
            total: totals.total,
            shippingMethod: shippingMethod || "standard",
            shippingAddress,
            status: "paid",
            paymentIntentId,
            createdAt: new Date(),
          };
          const inserted = await ordersCollection.insertOne(orderDoc, { session });
          orderId = inserted.insertedId.toString();

          await cartCollection.deleteMany({ ownerId: userEmail }, { session });
        });

        res.json({ orderId, status: "paid" });
      } catch (err) {
        console.error("Order placement error:", err);
        try {
          await stripe.refunds.create({ payment_intent: paymentIntentId });
        } catch (refundErr) {
          console.error("Refund failed:", refundErr);
        }
        res.status(409).json({ error: err.message || "Order could not be placed" });
      } finally {
        if (session) await session.endSession();
      }
    });

    app.get("/orders", requireUser, async (req, res) => {
      try {
        const orders = await ordersCollection
          .find({ userId: req.user.email })
          .sort({ createdAt: -1 })
          .toArray();
        res.json(orders);
      } catch (err) {
        console.error("Orders list error:", err);
        res.status(500).json({ error: "Could not fetch orders" });
      }
    });

    app.get("/orders/:id", requireUser, async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid order ID" });
        }
        const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.userId !== req.user.email) {
          return res.status(403).json({ error: "Not your order" });
        }
        res.json(order);
      } catch (err) {
        console.error("Order fetch error:", err);
        res.status(500).json({ error: "Could not fetch order" });
      }
    });

    // ---------------- IBA AI INTEGRATION ---------------- //

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    app.post("/chat", async (req, res) => {
      // The frontend now sends an array of recent turns so Iba can hold a
      // multi-turn conversation. Each entry is { role: 'user' | 'bot', text }.
      // For backwards compatibility, a single 'message' string still works.
      const { history, message } = req.body;

      try {
        const products = await productsCollection.find({}).toArray();

        // Slim catalog including the new gender field.
        const slimCatalog = products.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          category: p.category,
          gender: p.gender,
          color: p.color,
          price: p.price,
          description: p.description,
          stock: p.stock,
        }));

        const categories = [...new Set(products.map((p) => p.category))];

        const systemPrompt = `
You are Iba, the friendly shopping stylist for The Rack, an online clothing
store. Your job is to help shoppers find pieces they'll love through warm,
natural conversation. If a user asks your name, you are Iba.

CATALOG (JSON array, the "id" field is the product ID you must use in tags):
${JSON.stringify(slimCatalog)}

AVAILABLE CATEGORIES: ${categories.join(", ")}

================================================================
CORE RULES
================================================================

1. BE FLEXIBLE WITH SEARCH TERMS. Always interpret the user's intent
   generously. Common synonyms map to our categories:
     - "shoes", "footwear", "sneakers", "kicks", "trainers", "boots",
       "heels", "loafers", "sandals", "slippers" -> category "Shoes"
     - "tee", "t-shirt", "shirt", "top", "tank", "polo", "hoody",
       "hoodie", "henley" -> category "T-Shirts"
     - "jacket", "coat", "blazer", "vest", "windbreaker", "parka",
       "outerwear" -> category "Outerwear"
     - "trousers", "pants", "jeans", "shorts", "leggings", "joggers",
       "slacks", "chinos", "sweatpants" -> category "Pants"
     - "dress", "gown", "frock", "sundress" -> category "Dresses"
   Also match by color and description.

2. NEVER respond with "no results". Always broaden the search to the
   closest matching category.

3. SHOW AT MOST 4 PRODUCTS PER REPLY. Use a SHOW_CATEGORY token (described
   below) for the rest.

4. STAY GROUNDED. Only recommend products that exist in the catalog. Use
   the exact "id" string. Never invent IDs or product names.

================================================================
GENDER HANDLING (IMPORTANT - read carefully)
================================================================

Each product has a "gender" field: "men", "women", or "unisex".
Unisex items are appropriate for everyone.

WHEN to ask about gender preference:
  - The request is genuinely ambiguous and the answer would meaningfully
    change recommendations. For example:
      - "Help me find an outfit"
      - "Something for a wedding"
      - "I need new clothes"
      - "What should I wear to dinner?"
  - You have NO prior context in this conversation about who they're
    shopping for.

WHEN NOT to ask:
  - The user already mentioned women's-specific items (dresses, heels,
    leggings) - they want women's, don't ask.
  - The user already mentioned items typically read as men's (suit
    trousers, dress slacks, men's overcoat) - assume men's.
  - The category they asked for is Dresses - dresses are women's by
    nature, asking is patronizing.
  - The request is for unisex categories (Shoes, T-Shirts, Pants,
    Outerwear) AND the user gave no other style signals - just show
    unisex picks. Don't gate every conversation behind a gender prompt.
  - The user already answered the gender question earlier in this
    conversation - REMEMBER it. Don't ask twice.
  - The user uses gendered pronouns ("a gift for him", "for her") -
    you already have your answer.

HOW to ask, when you do:
  Keep it natural and short. Examples of good phrasing:
    - "Are you shopping for women's, men's, or no preference?"
    - "Just so I can pick the right pieces - women's or men's?"
  Do NOT make it feel like a form. One sentence, then wait for the answer.

HOW to use the gender once you know it:
  - "women" -> filter to products where gender is "women" OR "unisex".
  - "men" -> filter to products where gender is "men" OR "unisex".
  - "unisex" / "no preference" / "any" -> show whatever fits the request,
    no gender filter needed.
  - Always remember the user's stated preference for the rest of the
    conversation. Apply it to every subsequent recommendation without
    re-asking.

================================================================
OUTPUT TOKEN FORMAT (READ THIS CAREFULLY - VERY IMPORTANT)
================================================================

When you want to show a product, link to a category, or add an item to
the cart, you MUST embed special tokens in your reply text using EXACTLY
this format. The tokens use SQUARE BRACKETS [ ], not angle brackets < >.

The three valid tokens are:

  [SHOW_PRODUCT: ID_HERE]
  [SHOW_CATEGORY: NAME_HERE]
  [ADD_TO_CART: ID_HERE]

CONCRETE EXAMPLES of correct usage (these are real-looking IDs):

  Correct:  Here's a piece you'll love: [SHOW_PRODUCT: 670abc123def456789012345]
  Correct:  I'd suggest pairing [SHOW_PRODUCT: 670abc123def456789012345] with [SHOW_PRODUCT: 670abc123def456789012346] for a clean look.
  Correct:  Want more options? [SHOW_CATEGORY: T-Shirts]
  Correct:  Adding the trench coat to your bag now. [ADD_TO_CART: 670abc123def456789012347]

FORBIDDEN FORMATS - DO NOT USE ANY OF THESE:

  Wrong:  <product id="670abc...">Linen Polo</product>
  Wrong:  <SHOW_PRODUCT: 670abc...>
  Wrong:  <SHOW_CATEGORY: T-Shirts>
  Wrong:  {SHOW_PRODUCT: 670abc...}
  Wrong:  **[SHOW_PRODUCT: 670abc...]**  (no markdown around tokens)
  Wrong:  [PRODUCT: 670abc...]  (must say SHOW_PRODUCT)

The format is literally: open square bracket, the keyword, colon, space,
the value, close square bracket. Nothing else. Do not wrap tokens in
HTML, XML, Markdown, parentheses, or quotes.

USE the actual product ID from the CATALOG above (long hex strings).
Never write "id_here" or placeholder text inside a token.

================================================================
TONE
================================================================

Conversational, warm, fashion-aware. Short sentences. No emoji.
Get to the recommendation quickly. Don't lecture.
        `.trim();

        // Build the conversation. If history is provided, replay it as
        // proper user/model turns so Iba has context. Otherwise fall back
        // to a single message turn for backwards compatibility.
        let result;
        if (Array.isArray(history) && history.length > 0) {
          // Gemini's chat API expects { role: 'user' | 'model', parts: [...] }.
          // We map our 'bot' role to 'model'. We also skip the very first
          // system "greeting" message because it's a UI artifact, not part
          // of the real conversation.
          const geminiHistory = history
            .filter((m) => m.type !== 'greeting')
            .map((m) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.text }],
            }));

          // Gemini requires the history to start with a user message. If our
          // first turn happens to be a bot message, drop entries until we
          // hit a user one.
          while (geminiHistory.length > 0 && geminiHistory[0].role !== 'user') {
            geminiHistory.shift();
          }

          // The last entry is the current user message we're responding to.
          // Pop it off; pass it to sendMessage(), and use the rest as history.
          const lastTurn = geminiHistory.pop();

          if (!lastTurn || lastTurn.role !== 'user') {
            // Defensive fallback if history was malformed
            result = await model.generateContent([systemPrompt, message || '']);
          } else {
            const chat = model.startChat({
              history: geminiHistory,
              systemInstruction: { parts: [{ text: systemPrompt }] },
            });
            result = await chat.sendMessage(lastTurn.parts[0].text);
          }
        } else {
          // Backwards-compatible single-message path
          result = await model.generateContent([systemPrompt, message || '']);
        }

        const response = await result.response;
        res.send({ reply: response.text() });
      } catch (error) {
        console.error("AI error:", error);
        res.status(500).send({ error: "AI error" });
      }
    });

    app.get("/models", async (req, res) => {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
      } catch (err) {
        res.status(500).send(err.message);
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The Rack AI Server is running");
});

app.listen(port, () => {
  console.log(`The Rack AI Server listening on port ${port}`);
});