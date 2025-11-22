# Deployment Guide for Shakti CRM

Your application is built and ready to deploy! Choose one of the options below:

## Option 1: Netlify (Easiest - No CLI needed)

1. Build your app (already done):
   ```bash
   npm run build
   ```

2. Go to [Netlify Drop](https://app.netlify.com/drop)

3. Drag and drop the entire `dist` folder

4. Your site will be live instantly with a URL like: `https://random-name.netlify.app`

5. **Important**: Add environment variables in Netlify dashboard:
   - Go to Site settings > Environment variables
   - Add:
     - `VITE_SUPABASE_URL`: https://hlcxssgfizlbhbnwphsm.supabase.co
     - `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsY3hzc2dmaXpsYmhibndwaHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzI0NTIsImV4cCI6MjA3OTEwODQ1Mn0.TF6-A_tAl20i7SFFZQMTVZPsxpEEEFOF70bkEI0eJ3U

## Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Follow the prompts to link or create a new site.

## Option 3: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

The CLI will guide you through the deployment process.

## Option 4: GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to package.json scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```

3. Deploy:
   ```bash
   npm run build
   npm run deploy
   ```

## Option 5: Render

1. Go to [Render](https://render.com)
2. Create a new Static Site
3. Connect your GitHub repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables (same as Netlify)

## After Deployment

Once deployed, you'll get a live URL like:
- Netlify: `https://shakti-crm-xxxx.netlify.app`
- Vercel: `https://shakti-crm-xxxx.vercel.app`
- GitHub Pages: `https://yourusername.github.io/shakti`

Your Super Admin login page will be accessible at that URL!

## Current Build Status

✅ Build completed successfully
✅ All components working
✅ Database connected
✅ Ready for deployment

The `dist` folder contains your production-ready application.
