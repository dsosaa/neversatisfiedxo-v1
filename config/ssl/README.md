# SSL Certificate Setup

## For Development (HTTP only)
Use `nginx-dev.conf` which doesn't require SSL certificates.

## For Production (HTTPS with SSL)
You need to obtain SSL certificates for `videos.neversatisfiedxo.com`.

### Option 1: Using Let's Encrypt (Recommended)
```bash
# Install certbot on your server
sudo apt update && sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d videos.neversatisfiedxo.com -d www.videos.neversatisfiedxo.com

# Certificates will be automatically placed in the correct nginx configuration
```

### Option 2: Manual Certificate Installation
Place your SSL certificates in this directory:
- `videos.neversatisfiedxo.com.crt` - The certificate file
- `videos.neversatisfiedxo.com.key` - The private key file

### Option 3: Self-Signed Certificates (Testing Only)
```bash
# Generate self-signed certificate (for testing only)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout videos.neversatisfiedxo.com.key \
    -out videos.neversatisfiedxo.com.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=videos.neversatisfiedxo.com"
```

## Switching Between Development and Production

### Development Mode (HTTP)
Update docker-compose.yml to use the development nginx config:
```yaml
volumes:
  - ./config/nginx-dev.conf:/etc/nginx/nginx.conf:ro
```

### Production Mode (HTTPS)
Update docker-compose.yml to use the production nginx config:
```yaml
volumes:
  - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
  - ./config/ssl:/etc/nginx/ssl:ro
```

## DNS Configuration
Ensure your domain `videos.neversatisfiedxo.com` points to your server's IP address:
```
A    videos.neversatisfiedxo.com    -> YOUR_SERVER_IP
A    www.videos.neversatisfiedxo.com -> YOUR_SERVER_IP
```

## Testing SSL Configuration
```bash
# Test SSL configuration
openssl s_client -connect videos.neversatisfiedxo.com:443 -servername videos.neversatisfiedxo.com

# Check certificate expiration
openssl x509 -in videos.neversatisfiedxo.com.crt -text -noout | grep "Not After"
```