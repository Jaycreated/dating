# Cloudinary Setup Guide

## 1. Create a Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account
3. Verify your email

## 2. Get Your Credentials

1. Log in to your Cloudinary dashboard
2. You'll see your **Cloud Name** on the dashboard
3. Copy your **Cloud Name**

## 3. Create an Upload Preset

1. Go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Set:
   - **Preset name**: `dating_app_uploads` (or any name)
   - **Signing Mode**: **Unsigned** (important!)
   - **Folder**: `dating-app/profiles`
5. Click **Save**
6. Copy the **Preset name**

## 4. Update Frontend Environment Variables

Edit `frontend/.env.development`:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=dating_app_uploads
```

Replace:
- `your_cloud_name_here` with your actual Cloud Name
- `dating_app_uploads` with your preset name

## 5. Restart the Dev Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

## 6. Test Photo Upload

1. Register a new account
2. Complete Step 1 (Basic Info)
3. Complete Step 2 (Interests)
4. Upload 2 photos in Step 3
5. Photos will be uploaded to Cloudinary!

## Features

✅ **Direct upload** from browser to Cloudinary
✅ **No backend storage** needed
✅ **Automatic optimization** by Cloudinary
✅ **CDN delivery** for fast loading
✅ **5MB file size limit**
✅ **Supports**: JPG, PNG, WebP

## Cloudinary Free Tier

- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- Perfect for development and small apps!

## Troubleshooting

**Upload fails?**
- Check your Cloud Name is correct
- Make sure Upload Preset is **Unsigned**
- Verify the preset name matches

**Images not showing?**
- Check browser console for errors
- Verify the secure_url is returned
- Check Cloudinary dashboard for uploaded images
