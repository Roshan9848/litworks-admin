const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = "mongodb+srv://sunnyrockzzmadani_db_user:IkCTSFp9xj91X9Oi@cluster0.yafwv9z.mongodb.net/?appName=Cluster0";
const MONGODB_DB = "litworks";

async function check() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log("Connected successfully!");

  const users = await mongoose.connection.collection("users").find({}).toArray();
  console.log("Found users in database:", users.map(u => ({ name: u.name, email: u.email, role: u.role, status: u.status })));

  if (users.length === 0) {
    console.log("No users found! Re-seeding Founder user...");
    const email = "roshan@litworks.media";
    const password = "adminpassword123";
    const passwordHash = await bcrypt.hash(password, 10);
    await mongoose.connection.collection("users").insertOne({
      name: "Roshan",
      email,
      passwordHash,
      role: "FOUNDER",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("Successfully seeded Founder user.");
  } else {
    // Check if password matches
    const founder = users.find(u => u.email === "roshan@litworks.media");
    if (founder) {
      const match = await bcrypt.compare("adminpassword123", founder.passwordHash);
      console.log("Does password 'adminpassword123' match founder password hash?", match);
    }
  }

  await mongoose.disconnect();
}

check().catch(err => {
  console.error("Check failed:", err);
});
