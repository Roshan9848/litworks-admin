const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = "mongodb+srv://sunnyrockzzmadani_db_user:IkCTSFp9xj91X9Oi@cluster0.yafwv9z.mongodb.net/?appName=Cluster0";
const MONGODB_DB = "litworks";

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log("Connected successfully!");

  // 1. Seed Default Admin (Founder)
  const email = "roshan@litworks.media";
  const password = "adminpassword123";
  const passwordHash = await bcrypt.hash(password, 10);

  // Clear existing users to avoid duplicates on re-run
  await mongoose.connection.collection("users").deleteMany({
    email: { $in: ["rosan@litworks.media", "roshan@litworks.media"] }
  });
  await mongoose.connection.collection("users").insertOne({
    name: "Roshan",
    email,
    passwordHash,
    role: "FOUNDER",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`Seeded Founder user: ${email} / password: ${password}`);

  // 2. Seed Default Services
  const services = [
    { name: "Instant Reels", slug: "instant-reels", description: "Cinematic, high-energy reels shot and edited on the spot.", category: "Video Production", status: "active", createdAt: new Date(), updatedAt: new Date() },
    { name: "Social Media Handling", slug: "social-media", description: "End-to-end management of social media profiles to grow engagement.", category: "Marketing", status: "active", createdAt: new Date(), updatedAt: new Date() },
    { name: "Performance Marketing", slug: "performance-marketing", description: "Data-driven advertising campaigns focused on lead generation and ROI.", category: "Marketing", status: "active", createdAt: new Date(), updatedAt: new Date() },
    { name: "Editing Services", slug: "editing", description: "Professional color grading, sfx, and long/short-form editing.", category: "Video Editing", status: "active", createdAt: new Date(), updatedAt: new Date() },
    { name: "Design Services", slug: "design", description: "Stunning visual assets designed to capture attention.", category: "Design", status: "active", createdAt: new Date(), updatedAt: new Date() }
  ];
  await mongoose.connection.collection("services").deleteMany({});
  await mongoose.connection.collection("services").insertMany(services);
  console.log("Seeded basic Services!");

  // 3. Seed Default Packages
  const packages = [
    {
      title: "Hourly Plan",
      price: 1999,
      description: "Perfect for people who want a single, fast, high quality reel.",
      features: [
        "Upto 1 Hour Shoot time",
        "1 Edited Reel Delivered (upto 60 seconds)",
        "5 Complementary Pictures",
        "Trained and Certified Reel Maker",
        "Shot on Latest iPhones",
        "LITWORKS Branding Included"
      ],
      serviceType: "Instant Reel",
      isBestseller: false,
      category: "basic",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Half Day Plan",
      price: 4999,
      description: "Quick, high quality coverage for events & socials delivered fast.",
      features: [
        "Upto 3 hours Shoot time",
        "2 Edited Reels Delivered (each upto 60 seconds)",
        "Trained and Certified Reel Maker",
        "Raw footage access",
        "Shot on latest iPhones",
        "LITWORKS Branding Included"
      ],
      serviceType: "Instant Reel",
      isBestseller: true,
      category: "basic",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Add On's",
      price: 1250,
      description: "Want to Extend? Easy.",
      features: [
        "1 extra reel OR 1 hour extra shoot"
      ],
      serviceType: "Instant Reel",
      isBestseller: false,
      category: "basic",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Single Event",
      price: 12499,
      description: "Perfect for small functions & highlights.",
      features: [
        "1 event covered",
        "3 Edited Reels delivered (each upto 60 seconds)",
        "Up to 2 Reel-Makers onsite",
        "Shot on latest iPhones",
        "Complementary pictures",
        "Raw footage included",
        "LITWORKS Branding included",
        "Please provide an SD card to receive raw content"
      ],
      serviceType: "Wedding Instant Reel",
      isBestseller: false,
      category: "wedding",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Three Events",
      price: 34999,
      description: "Perfect for small functions & highlights.",
      features: [
        "3 events covered",
        "10 Edited Reels delivered (each upto 60 seconds)",
        "Up to 2 Reel-Makers onsite",
        "Shot on latest iPhones",
        "Complementary pictures",
        "Raw footage included",
        "LITWORKS Branding included",
        "Please provide an SD card to receive raw content"
      ],
      serviceType: "Wedding Instant Reel",
      isBestseller: false,
      category: "wedding",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Four Events",
      price: 44999,
      description: "Perfect for small functions & highlights.",
      features: [
        "4 events covered",
        "15 Edited Reels delivered (each upto 60 seconds)",
        "Up to 2 Reel-Makers onsite",
        "Shot on latest iPhones",
        "Complementary pictures",
        "Raw footage included",
        "LITWORKS Branding included",
        "Please provide an SD card to receive raw content"
      ],
      serviceType: "Wedding Instant Reel",
      isBestseller: true,
      category: "wedding",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Six Events",
      price: 69999,
      description: "Perfect for small functions & highlights.",
      features: [
        "6 events covered",
        "25 Edited Reels delivered (each upto 60 seconds)",
        "Up to 2 Reel-Makers onsite",
        "Dedicated Content Curator",
        "Shot on latest iPhones",
        "Complementary pictures",
        "Raw footage included",
        "LITWORKS Branding included",
        "Please provide an SD card to receive raw content"
      ],
      serviceType: "Wedding Instant Reel",
      isBestseller: false,
      category: "wedding",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  await mongoose.connection.collection("packages").deleteMany({});
  await mongoose.connection.collection("packages").insertMany(packages);
  console.log("Seeded default Packages!");

  // 4. Seed Website Content (CMS configurations)
  const websiteContent = [
    {
      sectionKey: "hero",
      content: {
        badgeText: "100+ Projects Completed • Creative Media Agency",
        heading: "Create Impact Instantly with LITWORKS",
        subheading: "We create cinematic Instant Reels, manage social media, run performance marketing campaigns, edit videos, design posters, and help businesses grow online.",
        primaryBtnText: "Book Instant Reel",
        secondaryBtnText: "Explore Services"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      sectionKey: "stats",
      content: {
        projectsCount: "100+",
        deliveryTime: "Mins",
        satisfactionRate: "99%"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      sectionKey: "faq",
      content: {
        heading: "Frequently Asked Questions",
        subheading: "Everything you need to know about our workflow and deliverables.",
        items: [
          { question: "How fast is delivery?", answer: "Our certified makers edit reels on-site or deliver completed edits in minutes." },
          { question: "Do you cover weddings outside Telangana?", answer: "Yes, we cover destination events across Andhra Pradesh and other states as requested." }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      sectionKey: "contact",
      content: {
        email: "litworks.media@gmail.com",
        phone: "+91 9110797354",
        whatsapp: "+91 9866571801",
        address: "Hyderabad, Telangana, India"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      sectionKey: "testimonials",
      content: {
        heading: "Loved by Brands & Individuals",
        subheading: "Testimonials",
        items: [
          {
            name: "Rahul Verma",
            role: "Groom",
            location: "Hyderabad",
            rating: 5,
            comment: "LITWORKS delivered our wedding reel within 2 hours of the event! The cinematic quality and quick sync-to-music was absolute magic."
          },
          {
            name: "Sowmya Rao",
            role: "Founder, Bloom Fashion",
            location: "Vijayawada",
            rating: 5,
            comment: "Their social media management has transformed our brand online. Elegant, premium posts and systematic posting has doubled our reach."
          },
          {
            name: "Karan Kalyan",
            role: "Auto Enthusiast",
            location: "Visakhapatnam",
            rating: 5,
            comment: "The reel they shot for my car delivery got over 150k views on Instagram. It looks like a high-budget commercial. Highly recommend!"
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      sectionKey: "videos",
      content: {
        heading: "Cinematic Reels in Action",
        subheading: "Portfolio Showcase",
        items: [
          {
            url: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-in-a-rainy-night-42260-large.mp4",
            title: "Neon Night Commercial"
          },
          {
            url: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
            title: "Nature Brand Reel"
          },
          {
            url: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-dj-hands-at-work-41710-large.mp4",
            title: "Cinematic DJ Promo"
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  await mongoose.connection.collection("websitecontents").deleteMany({});
  await mongoose.connection.collection("websitecontents").insertMany(websiteContent);
  console.log("Seeded Website Content CMS configuration!");

  console.log("Seeding complete! Closing connection.");
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
