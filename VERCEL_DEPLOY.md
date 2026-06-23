# LitWorks Media - Vercel Deployment Guide

Since you decided to deploy both the **Main Website** and the **Admin Portal** on Vercel using the Vercel URLs, this guide walks you through the step-by-step process of importing the repositories and configuring the environment variables.

---

## 💻 Part 1: Deploying the Main Website (`litworks`)

1. **Push your code to GitHub**:
   - Ensure all files in `C:\Users\madan\.gemini\antigravity\scratch\litworks` are pushed to a repository on your GitHub account.

2. **Import into Vercel Dashboard**:
   - Go to [Vercel](https://vercel.com) and click **Add New** > **Project**.
   - Import your main website repository.

3. **Configure Environment Variables**:
   Under **Environment Variables**, add the following keys from your `.env.local`:
   ```bash
    MONGODB_URI=your_mongodb_connection_string
    MONGODB_DB=litworks
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your_smtp_email
    SMTP_PASS=your_smtp_app_password
    CASHFREE_APP_ID=your_cashfree_app_id
    CASHFREE_SECRET_KEY=your_cashfree_secret_key
    CASHFREE_ENV=production
   ```

4. **Deploy**:
   - Click **Deploy**. Vercel will build and assign you a public URL (e.g. `https://litworks.vercel.app` or `https://litworks.media`).

---

## 🛠️ Part 2: Deploying the Admin Portal (`litworks-admin`)

1. **Push your code to GitHub**:
   - Create a second repository on your GitHub and push the contents of `C:\Users\madan\.gemini\antigravity\scratch\litworks-admin`.

2. **Import into Vercel Dashboard**:
   - Go to [Vercel](https://vercel.com), click **Add New** > **Project**, and select your admin portal repository.

3. **Configure Environment Variables**:
   Add the following keys from your admin `.env.local`:
   ```bash
    MONGODB_URI=your_mongodb_connection_string
    MONGODB_DB=litworks
    JWT_SECRET=your_jwt_secret_key
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your_smtp_email
    SMTP_PASS=your_smtp_app_password
    
    # Optional additions
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Deploy**:
   - Click **Deploy**. Vercel will compile the Next.js bundle and provide your admin URL (e.g. `https://litworks-admin.vercel.app`).

---

## 🔑 Part 3: Logging into the Admin Portal

Once deployed, visit your Vercel Admin URL (e.g., `https://litworks-admin.vercel.app/login`):

- **Login Email**: `roshan@litworks.media`
- **Login Password**: `adminpassword123`

You can change pricing packages, FAQ sections, and hero copy inside the **CMS Live Content** tab in the admin panel, and those changes will instantly reflect live on your main website!
