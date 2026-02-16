# Seen - Movie Tracking App

Track movies you've watched, rate them, organize in collections, and share with friends!

## 🚀 Quick Deploy to Vercel (5 minutes)

### Method 1: GitHub + Vercel (Recommended)

**Step 1: Upload to GitHub**
1. Go to [github.com](https://github.com)
2. Click the **"+"** in top right → **"New repository"**
3. Name it: `seen-app`
4. Click **"Create repository"**
5. You'll see a page with commands - SKIP THOSE for now

**Step 2: Upload Files**
1. On the repository page, click **"uploading an existing file"** link
2. Drag ALL the files from this folder into the upload area
3. Click **"Commit changes"**

**Step 3: Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your `seen-app` repository
5. Click **"Deploy"**
6. Wait 2 minutes ⏱️
7. Done! You'll get a URL like `seen-app-xyz.vercel.app`

### Method 2: Vercel CLI (Alternative)

```bash
npm install -g vercel
cd seen-app
vercel
```

## 📁 Project Structure

```
seen-app/
├── index.html          # Entry point
├── package.json        # Dependencies
├── vite.config.js      # Build config
├── src/
│   ├── main.jsx        # React bootstrap
│   └── App.jsx         # Main app component
└── README.md           # This file
```

## 🎬 Features

- ✅ Movie check-ins with ratings
- ✅ Collections (create, edit, delete)
- ✅ Social feed with likes & comments
- ✅ Profile with stats
- ✅ Dark mode
- ✅ Persistent storage
- ✅ Search functionality
- ⏳ TMDB API (add after deployment)

## 🔑 Adding TMDB API (After Deploy)

Once deployed, you can add real movie data:

1. Get free API key from [themoviedb.org](https://www.themoviedb.org/settings/api)
2. Add to `src/App.jsx` (line 5-7)
3. Push changes to GitHub
4. Vercel auto-redeploys!

## 💡 Tips

- **Updates:** Push to GitHub → Vercel auto-deploys
- **Custom Domain:** Add in Vercel settings
- **Environment Variables:** Add API keys in Vercel dashboard
- **Data Persistence:** Currently browser storage (add database later)

## 🐛 Troubleshooting

**Build fails?**
- Check all files uploaded correctly
- Make sure `package.json` is in root

**Blank page?**
- Check browser console for errors
- Verify `index.html` and `src/` folder uploaded

**Need help?**
- Check Vercel build logs
- Look for error messages

## 📝 Next Steps

1. Deploy to Vercel ✅
2. Share URL with friends
3. Gather feedback
4. Add TMDB API integration
5. Add user authentication (Firebase/Supabase)
6. Build native mobile app (React Native)

---

Built with React + Vite + Vercel 🚀
