# 🚀 One-Command Setup: Enhanced Admin Panel

Automated setup for Cloudflare Stream integration with your MediaCMS admin panel.

## ⚡ Quick Start

```bash
# One command to rule them all!
./setup-admin.sh
```

That's it! The script will:
- ✅ Install all required dependencies 
- ✅ Configure Cloudflare Stream credentials
- ✅ Update Django settings
- ✅ Run database migrations
- ✅ Test API integration
- ✅ Set up admin access
- ✅ Collect static files

## 📋 What You'll Need

Before running the setup, gather these Cloudflare credentials:

### 🔑 **Cloudflare Account ID**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. Find **Account ID** in the right sidebar
4. Copy the 32-character ID

### 🔑 **Cloudflare API Token**
1. Go to **My Profile** → **[API Tokens](https://dash.cloudflare.com/profile/api-tokens)**
2. Click **Create Token**
3. Use **Custom Token** with these permissions:
   - **Account**: `Cloudflare Stream:Edit`
   - **Zone**: `Zone:Read` (if using custom domains)
4. Include your account in **Account Resources**
5. Copy the token (starts with `CF-`)

### 🔑 **Customer Code** (Optional)
1. Go to [Stream Dashboard](https://dash.cloudflare.com/stream)
2. Click **Settings**
3. Find your customer subdomain/code
4. This enables iframe embedding

## 🛠️ Manual Setup Options

If you prefer manual control:

### Option A: Bash Script (Recommended)
```bash
bash ./scripts/setup-enhanced-admin.sh
```

### Option B: Python Script (Cross-platform)
```bash
python3 ./scripts/setup_enhanced_admin.py
```

## ✅ Verification

After setup completes, verify everything works:

### 1. Test Cloudflare Integration
```bash
cd apps/mediacms
python3 manage.py test_cloudflare --check-config
```

### 2. Start Development Server
```bash
python3 manage.py runserver
```

### 3. Access Enhanced Admin
- **Main Admin**: http://localhost:8000/admin/trailers/trailermeta/
- **Dashboard**: http://localhost:8000/admin/trailers/dashboard/
- **Bulk Upload**: http://localhost:8000/admin/trailers/bulk-upload/

## 🎯 What You Get

### ✨ **Direct Video Management**
- Drag-and-drop video upload to Cloudflare Stream
- Automatic UID and thumbnail generation
- Real-time processing status monitoring
- Professional admin interface

### 📊 **Advanced Tools**
- Admin dashboard with statistics
- Bulk CSV import with preview
- Batch operations for status updates
- Cloudflare settings management

### 🔧 **Enterprise Features**
- Comprehensive error handling
- Security best practices
- Performance optimization
- Detailed logging and monitoring

## 🔧 Troubleshooting

### Setup Issues
```bash
# Check Python version (needs 3.8+)
python3 --version

# Check virtual environment
echo $VIRTUAL_ENV

# Verify Django installation
python3 -c "import django; print(django.VERSION)"
```

### Configuration Issues
```bash
# Test with specific video UID
python3 manage.py test_cloudflare --video-uid YOUR_VIDEO_UID

# Check settings
python3 manage.py shell -c "from django.conf import settings; print(hasattr(settings, 'CLOUDFLARE_ACCOUNT_ID'))"

# View logs
tail -f trailers.log
```

### Permission Issues
```bash
# Make scripts executable
chmod +x ./setup-admin.sh
chmod +x ./scripts/*.sh
chmod +x ./scripts/*.py
```

## 📚 Documentation

- **Admin Guide**: `apps/mediacms/trailers/README_ADMIN_ENHANCED.md`
- **API Documentation**: `apps/mediacms/trailers/services.py`
- **Widget Documentation**: `apps/mediacms/trailers/widgets.py`

## 🆘 Need Help?

1. **Check the logs**: `tail -f trailers.log`
2. **Test configuration**: `python3 manage.py test_cloudflare --check-config`
3. **Verify credentials**: Log into Cloudflare dashboard
4. **Review settings**: Check `apps/mediacms/settings_trailer.py`

---

## 🎉 Success!

Once setup completes, you'll have a **professional video content management system** with:
- Direct Cloudflare Stream integration
- Enterprise-grade admin interface
- Automated video processing
- Real-time status monitoring
- Bulk management tools

**Before**: Manual upload → Copy UIDs → Paste into admin → Hope it works
**After**: Drag, drop, done! ✨