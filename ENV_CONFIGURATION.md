# DFS Manager Portal - Environment Configuration Guide

## Overview
This guide covers all available environment variables for the DFS Manager Portal, including database connection strings, feature flags, and external integrations.

## Environment Files

### 1. `.env.local` (Development)
Primary development configuration file. Place in project root directory.

### 2. `.env.production` (Production)
Production-optimized configuration with enhanced security and performance settings.

### 3. `.env.example` (Template)
Template file showing all available configuration options.

## Configuration Categories

### Core Database Configuration
```env
# Database uses Easysite Built-in Database
VITE_APP_NAME="DFS Manager Portal"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENVIRONMENT="development"
```

### Feature Flags
```env
# Core Features
VITE_ENABLE_FILE_UPLOAD=true
VITE_ENABLE_SMS_ALERTS=true
VITE_ENABLE_AUDIT_LOGGING=true
VITE_ENABLE_VISUAL_EDITING=true
VITE_ENABLE_BARCODE_SCANNING=true
VITE_ENABLE_PRINT_FEATURES=true
VITE_ENABLE_BATCH_OPERATIONS=true

# UI Features
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_TABLE_SORTING=true
VITE_ENABLE_EXPORT_FEATURES=true
VITE_ENABLE_KEYBOARD_SHORTCUTS=true
```

### Security Configuration
```env
# Authentication & Authorization
VITE_SESSION_TIMEOUT_MINUTES=480
VITE_ENABLE_MFA=false
VITE_PASSWORD_MIN_LENGTH=8
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOCKOUT_DURATION_MINUTES=15

# Production Security
VITE_ENABLE_HTTPS_ONLY=true
VITE_ENABLE_CSP=true
```

### Storage & File Management
```env
# File Management
VITE_MAX_FILE_SIZE_MB=25
VITE_ALLOWED_FILE_TYPES="image/*,application/pdf,text/*,application/vnd.ms-excel"

# Image Compression
VITE_IMAGE_COMPRESSION_QUALITY=0.8
VITE_AUTO_COMPRESS_IMAGES=true
```

### Performance Settings
```env
# API Configuration
VITE_API_TIMEOUT_MS=30000
VITE_MAX_RETRY_ATTEMPTS=3
VITE_ENABLE_API_CACHING=true
VITE_CACHE_DURATION_MINUTES=15
VITE_BATCH_SIZE_LIMIT=1000

# UI Performance
VITE_DEFAULT_PAGINATION_SIZE=20
VITE_ANIMATION_DURATION_MS=300
VITE_NOTIFICATION_TIMEOUT_MS=5000
```

### Business Logic Settings
```env
# Gas Station Configuration
VITE_DEFAULT_STATION="MOBIL"
VITE_CURRENCY_CODE="USD"
VITE_CURRENCY_SYMBOL="$"
VITE_TAX_RATE_PERCENTAGE=8.25

# Inventory Management
VITE_LOW_STOCK_THRESHOLD=10
VITE_CRITICAL_STOCK_THRESHOLD=5
VITE_LICENSE_EXPIRY_WARNING_DAYS=30
```

### SMS Integration (ClickSend)
```env
# ClickSend Configuration
VITE_CLICKSEND_USERNAME=your_clicksend_username
VITE_CLICKSEND_API_KEY=your_clicksend_api_key
VITE_SMS_RATE_LIMIT_PER_HOUR=100
```

### Email Configuration
```env
# Email Settings
VITE_EMAIL_FROM_ADDRESS="noreply@your-domain.com"
VITE_EMAIL_REPLY_TO_ADDRESS="support@your-domain.com"
VITE_ENABLE_EMAIL_NOTIFICATIONS=true
```

### Monitoring & Analytics
```env
# Error Reporting
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_USAGE_ANALYTICS=false
VITE_ENABLE_MEMORY_LEAK_DETECTION=true

# Logging
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL="info"
VITE_LOG_RETENTION_DAYS=30
```

### Development Tools
```env
# Development Features
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_REDUX_DEVTOOLS=true
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true
VITE_ENABLE_SOURCE_MAPS=true
```

## Environment-Specific Configurations

### Development Environment
- Enhanced logging and debugging
- Development tools enabled
- Relaxed security settings
- Local file storage options

### Production Environment
- Optimized performance settings
- Enhanced security configurations
- Minimal logging (errors only)
- CDN and caching enabled

## External Integration Setup

### ClickSend SMS Setup
1. Create a ClickSend account
2. Get Username and API Key
3. Configure environment variables
4. Test SMS functionality in dashboard

### Email Service Setup
1. Configure email settings
2. Set up SMTP or email service provider
3. Configure from/reply-to addresses
4. Test email notifications

## Security Best Practices

### Environment File Security
- Never commit `.env.local` or `.env.production` to version control
- Use different credentials for development and production
- Rotate API keys and passwords regularly
- Enable MFA for production environments

### Database Security
- Use Easysite built-in security features
- Monitor database connections
- Set up backup strategies

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check credentials
   - Verify user permissions
   - Ensure account is active

2. **File Upload Issues**
   - Check file size limits
   - Verify file type restrictions
   - Ensure proper permissions

3. **SMS Not Working**
   - Verify ClickSend credentials
   - Check phone number format
   - Review rate limits

4. **Performance Issues**
   - Enable API caching
   - Adjust timeout settings
   - Monitor connection pool

## Support

For additional configuration help:
1. Check the project documentation
2. Review environment variables
3. Contact support team

---

**Last Updated**: Auto-generated Configuration Package
**Version**: 1.0.0