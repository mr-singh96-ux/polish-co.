require("dotenv").config()

const http = require("http")
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const { initSocket } = require("./socket")

const cloudinary = require("cloudinary").v2
const { CloudinaryStorage } = require("multer-storage-cloudinary")

const paypal = require("@paypal/checkout-server-sdk")

const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
)

const client = new paypal.core.PayPalHttpClient(
  environment
)


const app = express()

/* ─── Middleware ─────────────────────────────────────────────────────────── */

app.use(cors())
app.use(express.json())

/* ─── MongoDB ────────────────────────────────────────────────────────────── */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err))

/* ─── Cloudinary ─────────────────────────────────────────────────────────── */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "slayywithnails",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [
      { width: 1200, height: 1200, crop: "limit" },
      { quality: "auto" }
    ]
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
})

/* ─── Schemas ────────────────────────────────────────────────────────────── */

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now }
})

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  description: { type: String, default: "" },
  category: { type: String, default: "ready" },
  images: { type: [String], default: [] },
  in_stock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  productId: String,
  productName: String,
  productImage: { type: String, default: "" },
  price: Number,
  quantity: Number,
  length: String,
  shape: String,
  handImage: String,
  customerName: String,
  customerEmail: String,
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Processing", "Confirmed", "In Progress", "Shipped", "Completed", "Cancelled"],
    default: "Processing"
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const customNailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  email: String,
  design: String,
  length: String,
  shape: String,
  notes: String,
  referenceImage: String,
  inspirationImage: String,
  status: {
    type: String,
    enum: ["Pending", "Reviewing", "In Progress", "Completed", "Rejected"],
    default: "Pending"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

/* ─── Models ─────────────────────────────────────────────────────────────── */

const User = mongoose.model("User", userSchema)
const Product = mongoose.model("Product", productSchema)
const Order = mongoose.model("Order", orderSchema)
const CustomNail = mongoose.model("CustomNail", customNailSchema)
const Review = mongoose.model("Review", reviewSchema)

/* ─── Middleware: Auth ───────────────────────────────────────────────────── */

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ message: "No token provided" })
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" })
    req.user = decoded
    next()
  })
}

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ message: "No token provided" })
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" })
    if (decoded.role !== "admin") return res.status(403).json({ message: "Admin access required" })
    req.user = decoded
    next()
  })
}

/* ─── Root ───────────────────────────────────────────────────────────────── */

app.get("/", (req, res) => res.send("SlayyWithNails API Running"))

/* ─── Auth: Register ─────────────────────────────────────────────────────── */

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: "Email already registered" })
    const hashed = await bcrypt.hash(password, 10)
    await new User({ name, email, password: hashed }).save()
    res.json({ message: "User registered successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Registration failed" })
  }
})

/* ─── Auth: Login ────────────────────────────────────────────────────────── */

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: "User not found" })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: "Invalid password" })
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Login failed" })
  }
})


/* ─── Products: Public ───────────────────────────────────────────────────── */

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" })
  }
})

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: "Product not found" })
    res.json(product)
  } catch (err) {
    res.status(500).json({ message: "Product not found" })
  }
})

/* ─── Reviews: Public + Authenticated ───────────────────────────────────── */

app.get("/products/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews" })
  }
})

app.post("/products/:id/reviews", verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body
    if (!rating || !comment?.trim()) {
      return res.status(400).json({ message: "Rating and comment are required" })
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" })
    }
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: "Product not found" })

    const existing = await Review.findOne({ productId: req.params.id, userId: req.user.id })
    if (existing) {
      return res.status(409).json({ message: "You have already reviewed this product" })
    }
    const userDoc = await User.findById(req.user.id)
    const review = new Review({
      productId: req.params.id,
      userId: req.user.id,
      userName: userDoc?.name || "User",
      rating: Number(rating),
      comment: comment.trim()
    })
    await review.save()
    res.json(review)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to create review" })
  }
})

app.patch("/reviews/:id", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: "Review not found" })
    if (String(review.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to edit this review" })
    }
    const { rating, comment } = req.body
    if (rating !== undefined) {
      if (Number(rating) < 1 || Number(rating) > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" })
      }
      review.rating = Number(rating)
    }
    if (comment !== undefined) {
      if (!comment.trim()) return res.status(400).json({ message: "Comment cannot be empty" })
      review.comment = comment.trim()
    }
    review.updatedAt = new Date()
    await review.save()
    res.json(review)
  } catch (err) {
    res.status(500).json({ message: "Failed to update review" })
  }
})

app.delete("/reviews/:id", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: "Review not found" })
    const isOwner = String(review.userId) === String(req.user.id)
    const isAdmin = req.user.role === "admin"
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this review" })
    }
    await Review.findByIdAndDelete(req.params.id)
    res.json({ message: "Review deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete review" })
  }
})

/* ─── Orders: User ───────────────────────────────────────────────────────── */

app.post("/orders", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const userDoc = await User.findById(req.user.id)

    let productImage = ""
    if (req.body.productId) {
      try {
        const product = await Product.findById(req.body.productId)
        productImage = product?.images?.[0] || ""
      } catch {}
    }

    const order = new Order({
      userId: req.user.id,
      productId: req.body.productId,
      productName: req.body.productName,
      productImage,
      price: Number(req.body.price),
      quantity: Number(req.body.quantity),
      length: req.body.length,
      shape: req.body.shape,
      handImage: req.file ? req.file.path : "",
      customerName: req.body.customerName || userDoc?.name || "",
      customerEmail: userDoc?.email || req.user.email,
      phone: req.body.phone || "",
      address: req.body.address || "",
      status: "Processing",
      paymentStatus: "Pending"
    })
    await order.save()
    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Order failed" })
  }
})

app.get("/orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" })
  }
})

/* ─── Custom Nails: User ─────────────────────────────────────────────────── */

app.post(
  "/custom-nails",
  verifyToken,
  upload.fields([
    { name: "handImage", maxCount: 1 },
    { name: "inspirationImage", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const handImage = req.files?.handImage?.[0]?.path
      const inspirationImage = req.files?.inspirationImage?.[0]?.path
      if (!handImage || !inspirationImage) {
        return res.status(400).json({ message: "Both images are required" })
      }
      const nail = new CustomNail({
        userId: req.user.id,
        name: req.body.name,
        email: req.body.email,
        design: req.body.design,
        length: req.body.length,
        shape: req.body.shape,
        notes: req.body.notes,
        referenceImage: handImage,
        inspirationImage
      })
      await nail.save()
      res.json({ success: true, nail })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: "Server error" })
    }
  }
)

app.get("/custom-nails", verifyToken, async (req, res) => {
  try {
    const nails = await CustomNail.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(nails)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" })
  }
})

/* ─── Admin: Stats ───────────────────────────────────────────────────────── */

app.get("/admin/stats", verifyAdmin, async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, totalCustomOrders] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      CustomNail.countDocuments()
    ])

    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$quantity"] } } } }
    ])

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("userId", "name email")

    const statusMap = {}
    ordersByStatus.forEach(s => { statusMap[s._id] = s.count })

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalCustomOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      ordersByStatus: statusMap,
      recentOrders
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch stats" })
  }
})

/* ─── Admin: Users ───────────────────────────────────────────────────────── */

app.get("/admin/users", verifyAdmin, async (req, res) => {
  try {
    const { search = "", role, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }
    if (role) query.role = role
    const [users, total] = await Promise.all([
      User.find(query, { password: 0 })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      User.countDocuments(query)
    ])
    res.json({ users, total })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" })
  }
})

app.post("/admin/users", verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" })
    }
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" })
    }
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ message: "This email is already registered" })
    const hashed = await bcrypt.hash(password, 10)
    const user = await new User({ name, email, password: hashed, role }).save()
    res.json({
      message: "User created successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to create user" })
  }
})

app.patch("/admin/users/:id/role", verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: "-password" }
    )
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: "Failed to update role" })
  }
})

app.delete("/admin/users/:id", verifyAdmin, async (req, res) => {
  try {
    if (req.params.id === String(req.user.id)) {
      return res.status(400).json({ message: "Cannot delete your own account" })
    }
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "User deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" })
  }
})

/* ─── Admin: Orders ──────────────────────────────────────────────────────── */

app.get("/admin/orders", verifyAdmin, async (req, res) => {
  try {
    const { search = "", status, page = 1, limit = 20 } = req.query
    const query = {}
    if (status) query.status = status
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } }
      ]
    }
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate("userId", "name email"),
      Order.countDocuments(query)
    ])
    res.json({ orders, total })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" })
  }
})

app.patch("/admin/orders/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const valid = ["Processing", "Confirmed", "In Progress", "Shipped", "Completed", "Cancelled"]
    if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status" })
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    )
    if (!order) return res.status(404).json({ message: "Order not found" })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Failed to update order status" })
  }
})

app.patch("/admin/orders/:id/payment", verifyAdmin, async (req, res) => {
  try {
    const { paymentStatus } = req.body
    const valid = ["Pending", "Paid", "Failed", "Refunded"]
    if (!valid.includes(paymentStatus)) return res.status(400).json({ message: "Invalid payment status" })
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, updatedAt: new Date() },
      { new: true }
    )
    if (!order) return res.status(404).json({ message: "Order not found" })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Failed to update payment status" })
  }
})

app.delete("/admin/orders/:id", verifyAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id)
    res.json({ message: "Order deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete order" })
  }
})

/* ─── Admin: Custom Orders ───────────────────────────────────────────────── */

app.get("/admin/custom-orders", verifyAdmin, async (req, res) => {
  try {
    const { search = "", status, page = 1, limit = 20 } = req.query
    const query = {}
    if (status) query.status = status
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { design: { $regex: search, $options: "i" } }
      ]
    }
    const [orders, total] = await Promise.all([
      CustomNail.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      CustomNail.countDocuments(query)
    ])
    res.json({ orders, total })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch custom orders" })
  }
})

app.patch("/admin/custom-orders/:id/status", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const valid = ["Pending", "Reviewing", "In Progress", "Completed", "Rejected"]
    if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status" })
    const order = await CustomNail.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    )
    if (!order) return res.status(404).json({ message: "Order not found" })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Failed to update custom order" })
  }
})

app.delete("/admin/custom-orders/:id", verifyAdmin, async (req, res) => {
  try {
    await CustomNail.findByIdAndDelete(req.params.id)
    res.json({ message: "Custom order deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete custom order" })
  }
})

/* ─── Admin: Products ────────────────────────────────────────────────────── */

app.get("/admin/products", verifyAdmin, async (req, res) => {
  try {
    const { search = "", category, page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.name = { $regex: search, $options: "i" }
    if (category) query.category = category
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Product.countDocuments(query)
    ])
    res.json({ products, total })
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" })
  }
})

app.post("/admin/products", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name,
      price: Number(req.body.price),
      discount: Math.min(100, Math.max(0, Number(req.body.discount) || 0)),
      description: req.body.description || "",
      category: req.body.category || "ready",
      images: req.file ? [req.file.path] : [],
      in_stock: req.body.in_stock !== "false"
    })
    await product.save()
    res.json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to create product" })
  }
})

app.patch("/admin/products/:id", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const setFields = {
      name: req.body.name,
      price: Number(req.body.price),
      discount: Math.min(100, Math.max(0, Number(req.body.discount) || 0)),
      description: req.body.description || "",
      category: req.body.category || "ready",
      in_stock: req.body.in_stock !== "false"
    }
    const updateOp = { $set: setFields }
    if (req.file) {
      updateOp.$push = { images: req.file.path }
    }
    const product = await Product.findByIdAndUpdate(req.params.id, updateOp, { new: true })
    if (!product) return res.status(404).json({ message: "Product not found" })
    res.json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to update product" })
  }
})

app.delete("/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: "Product deleted" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" })
  }
})
/* ─── PayPal ─────────────────────────────────────────────────────────────── */

app.post("/create-order", async (req, res) => {

  try {

    const request =
      new paypal.orders.OrdersCreateRequest()

    request.prefer("return=representation")

    request.requestBody({
      intent: "CAPTURE",

      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "10.00"
          }
        }
      ]
    })

    const order = await client.execute(request)

    res.json({
      id: order.result.id
    })

  } catch (error) {

    console.log(error)

    res.status(500).json({
      error: "Failed to create PayPal order"
    })
  }
})

app.post("/capture-order/:orderID", async (req, res) => {

  try {

    const request =
      new paypal.orders.OrdersCaptureRequest(
        req.params.orderID
      )

    request.requestBody({})

    const capture = await client.execute(request)

    res.json(capture.result)

  } catch (error) {

    console.log(error)

    res.status(500).json({
      error: "Failed to capture PayPal payment"
    })
  }
})

/* ─── Server ─────────────────────────────────────────────────────────────── */

const PORT = process.env.PORT || 5000
const httpServer = http.createServer(app)
initSocket(httpServer)
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
