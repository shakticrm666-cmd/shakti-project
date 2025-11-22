# Subdomain System Setup Guide

This document explains the subdomain verification system and how to configure it when purchasing your custom domain.

## Current Configuration

The application is currently configured with a base domain of `yourapp.com` for demonstration purposes. When you purchase your custom domain, follow the steps below to update the configuration.

## Features Implemented

### 1. Real-Time Subdomain Validation
- ✅ Format validation (3-63 characters, alphanumeric and hyphens only)
- ✅ Uniqueness checking against existing tenants
- ✅ Reserved subdomain blocking (admin, api, www, etc.)
- ✅ Visual feedback (available/taken/invalid status)
- ✅ Alternative suggestions when subdomain is taken

### 2. Multi-Environment Support
- ✅ Development environment (WebContainer, localhost)
- ✅ Production environment (custom domain)
- ✅ Automatic subdomain detection and extraction
- ✅ Environment-aware URL generation

### 3. Database-Level Validation
- ✅ Case-insensitive unique constraints
- ✅ Format validation triggers
- ✅ Length validation (3-63 characters)
- ✅ Reserved name blocking at database level
- ✅ Automatic subdomain normalization (lowercase)

### 4. User Experience Features
- ✅ Subdomain preview in tenant creation form
- ✅ Copy-to-clipboard functionality for URLs
- ✅ Tenant-specific login pages
- ✅ Company information display on login
- ✅ Subdomain display in Company Admin settings

## Updating to Your Custom Domain

### Step 1: Update Environment Variables

Edit the `.env` file and update the following variables:

\`\`\`env
VITE_APP_BASE_DOMAIN=yourdomain.com
VITE_APP_ENVIRONMENT=production
\`\`\`

**Example:**
If you purchase `loanrecovery.com`, set:
\`\`\`env
VITE_APP_BASE_DOMAIN=loanrecovery.com
VITE_APP_ENVIRONMENT=production
\`\`\`

### Step 2: DNS Configuration

Configure your DNS provider to support wildcard subdomains:

1. **Add A Record for Main Domain:**
   - Type: `A`
   - Name: `@`
   - Value: Your server IP address
   - TTL: 3600 (or default)

2. **Add Wildcard A Record for Subdomains:**
   - Type: `A`
   - Name: `*`
   - Value: Your server IP address
   - TTL: 3600 (or default)

**Example DNS Configuration:**
\`\`\`
@ A 123.45.67.89
* A 123.45.67.89
www CNAME yourdomain.com
\`\`\`

### Step 3: SSL Certificate Setup

For HTTPS support on all subdomains, you need a wildcard SSL certificate:

1. **Option A: Let's Encrypt (Free)**
   \`\`\`bash
   certbot certonly --dns-<provider> -d yourdomain.com -d *.yourdomain.com
   \`\`\`

2. **Option B: Commercial SSL Provider**
   Purchase a wildcard SSL certificate for `*.yourdomain.com`

### Step 4: Web Server Configuration

#### For Nginx:

\`\`\`nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name *.yourdomain.com yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

#### For Apache:

\`\`\`apache
<VirtualHost *:80 *:443>
    ServerName yourdomain.com
    ServerAlias *.yourdomain.com

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
\`\`\`

### Step 5: Rebuild and Deploy

After updating the environment variables:

\`\`\`bash
# Rebuild the application
npm run build

# Deploy to your production server
# (Your deployment process here)
\`\`\`

## Subdomain URL Structure

After configuration, your application will have the following URL structure:

- **Super Admin Access:** `https://yourdomain.com/superadmin`
- **Company Login:** `https://companyname.yourdomain.com/login`
- **Team Access:** `https://companyname.yourdomain.com/teamincharge`
- **Telecaller Access:** `https://companyname.yourdomain.com/telecaller`

## Testing Subdomain Configuration

### Local Development Testing

For local testing with subdomains:

1. Add entries to your `/etc/hosts` file:
   \`\`\`
   127.0.0.1 testcompany.localhost
   127.0.0.1 company1.localhost
   \`\`\`

2. Access via:
   - `http://testcompany.localhost:3000/login`
   - `http://company1.localhost:3000/login`

### Production Testing

1. Create a test tenant with subdomain `demo`
2. Access `https://demo.yourdomain.com/login`
3. Verify:
   - Company name displays on login page
   - Authentication works correctly
   - Subdomain URLs are generated correctly

## Reserved Subdomains

The following subdomains are blocked and cannot be used:

- www, admin, superadmin, api, app
- mail, smtp, ftp, webmail, cpanel, whm
- blog, forum, shop, store, dashboard, portal
- support, help, docs, status
- dev, staging, test, demo, sandbox, localhost
- ns1, ns2, dns, cdn
- assets, static, media, files, images

## Validation Rules

Subdomains must meet the following criteria:

- **Length:** 3 to 63 characters
- **Characters:** Lowercase letters (a-z), numbers (0-9), hyphens (-)
- **Start/End:** Must start and end with alphanumeric character (no hyphens)
- **Format:** No consecutive hyphens, no special characters
- **Uniqueness:** Must be unique across all tenants (case-insensitive)

## Troubleshooting

### Issue: Subdomain not resolving

**Solution:**
1. Check DNS propagation: `nslookup subdomain.yourdomain.com`
2. Verify wildcard DNS record is configured correctly
3. Wait 24-48 hours for full DNS propagation

### Issue: SSL certificate errors on subdomains

**Solution:**
1. Ensure you have a wildcard SSL certificate (`*.yourdomain.com`)
2. Verify certificate is properly installed on your web server
3. Check certificate includes both `yourdomain.com` and `*.yourdomain.com`

### Issue: Subdomain showing as "taken" when it's not

**Solution:**
1. Check database for case-insensitive duplicates
2. Run migration: `20251017114500_enforce_subdomain_constraints.sql`
3. Restart application to clear any caches

### Issue: Login redirecting incorrectly

**Solution:**
1. Verify `VITE_APP_BASE_DOMAIN` is set correctly in `.env`
2. Rebuild the application after changing environment variables
3. Clear browser cache and cookies
4. Check that tenant status is `active` in database

## Security Considerations

1. **HTTPS Only:** Always use HTTPS in production for all subdomains
2. **Tenant Isolation:** Each subdomain isolates tenant data at the application level
3. **Database Security:** Subdomain validation is enforced at the database level
4. **Input Sanitization:** All subdomain inputs are sanitized and validated
5. **Reserved Names:** Critical system subdomains are blocked automatically

## Support

For additional assistance with subdomain configuration:
1. Check the code in `src/config/domain.ts`
2. Review validation logic in `src/utils/subdomainValidation.ts`
3. Examine database constraints in migration files
4. Contact your system administrator for DNS and SSL support

## Maintenance

### Adding New Reserved Subdomains

1. Update `src/config/domain.ts` - Add to `RESERVED_SUBDOMAINS` array
2. Update database function in migration file if needed
3. Rebuild and deploy the application

### Changing Base Domain

1. Update `.env` file with new `VITE_APP_BASE_DOMAIN`
2. Update DNS records with new domain
3. Obtain new SSL certificate for new domain
4. Rebuild and redeploy application
5. Update all documentation and user communications

---

**Last Updated:** October 17, 2025
**Version:** 1.0
