# Access Denial Solutions for Auto Audit Pro

## Overview
This document outlines comprehensive solutions for handling "Access Denied" issues when auditing dealership websites.

## Current Issues

### 1. Anti-Bot Protection Systems
- **CloudFlare**: JavaScript challenges, CAPTCHA
- **Rate Limiting**: 429 errors from excessive requests
- **Bot Detection**: Behavioral analysis detecting automated access
- **IP Blocking**: Blacklisting of data center IPs

### 2. Detection Methods Used by Websites
- User-Agent analysis
- JavaScript fingerprinting
- WebDriver detection
- IP reputation checking
- Behavioral patterns (mouse movement, scrolling)
- TLS fingerprinting

## Implemented Solutions

### 1. Multi-Layer Request Strategy
```
1. Basic HTTP Request (axios with headers)
   ↓ (if blocked)
2. Selenium WebDriver (with stealth mode)
   ↓ (if blocked)
3. ScrapingDog API (premium proxy service)
```

### 2. Enhanced Selenium Wrapper (`lib/enhanced-selenium-wrapper.js`)
- **Stealth Chrome Options**: Disables automation indicators
- **JavaScript Injection**: Overrides `navigator.webdriver` property
- **Human Behavior Simulation**: Random delays, mouse movements
- **CDP Support**: Chrome DevTools Protocol for advanced control

### 3. Proxy Rotation Manager (`lib/proxy-rotation-manager.js`)
- **Automatic Proxy Rotation**: Cycles through multiple proxies
- **Smart Failure Detection**: Tracks success rates
- **Request Retry Logic**: Exponential backoff
- **User-Agent Rotation**: Randomizes browser fingerprints

## Configuration Options

### Environment Variables
```bash
# ScrapingDog API (Recommended)
SCRAPINGDOG_API_KEY=your_api_key_here

# Proxy Configuration (Optional)
RESIDENTIAL_PROXIES='[{"host":"proxy1.com","port":8080,"auth":{"username":"user","password":"pass"}}]'
DATACENTER_PROXIES='[{"host":"proxy2.com","port":8080}]'
ROTATING_PROXY_ENDPOINT=http://username:password@rotating-proxy.com:8080

# Selenium Configuration
SELENIUM_HEADLESS=true
CHROME_BIN=/path/to/chrome
```

### Usage Recommendations

#### 1. For Light Usage (< 100 audits/day)
- Use default configuration
- Selenium with stealth mode should handle most sites

#### 2. For Medium Usage (100-1000 audits/day)
- Configure ScrapingDog API key
- Enable automatic fallback to API for blocked sites

#### 3. For Heavy Usage (> 1000 audits/day)
- Use residential proxies
- Configure proxy rotation
- Consider multiple ScrapingDog API keys

## Best Practices

### 1. Request Spacing
- Add 2-5 second delays between requests
- Randomize timing to appear human-like

### 2. Session Management
- Maintain cookies between requests
- Use consistent browser fingerprints per session

### 3. Content Verification
- Always verify returned content isn't a block page
- Check for common blocking indicators

### 4. Monitoring
- Track success rates by domain
- Log failed attempts for analysis
- Alert on systematic failures

## Troubleshooting

### Common Issues and Solutions

#### 1. "Access Denied" on Initial Request
**Solution**: The system will automatically fall back to Selenium, then ScrapingDog

#### 2. All Methods Failing
**Possible Causes**:
- IP permanently blocked
- Aggressive anti-bot system
- Invalid credentials/API keys

**Solutions**:
- Verify API keys are correct
- Try from different IP/network
- Contact support for whitelisting

#### 3. Slow Performance
**Solutions**:
- Disable image loading in browser
- Use datacenter proxies for non-protected sites
- Cache successful results

## Cost Optimization

### ScrapingDog Pricing
- Standard request: $0.001
- Premium request: $0.002
- JavaScript rendering: Included

### Optimization Tips
1. Use direct requests first (free)
2. Cache results for 24 hours
3. Only use ScrapingDog for protected sites
4. Monitor usage statistics

## Future Enhancements

### Planned Improvements
1. **AI-Based Detection**: ML model to predict blocking likelihood
2. **Distributed Scraping**: Multiple server locations
3. **Browser Pool**: Maintain persistent browser sessions
4. **Custom Proxy Integration**: Support for more proxy providers

### Advanced Techniques
1. **TLS Fingerprinting**: Mimic real browser TLS
2. **WebRTC Leak Prevention**: Hide real IP
3. **Canvas Fingerprinting**: Randomize canvas data
4. **WebGL Spoofing**: Vary GPU information

## Support

For assistance with access issues:
1. Check logs in `/data/monitoring/`
2. Review proxy statistics
3. Verify API key configuration
4. Contact support with domain examples

## Security Considerations

- Never log sensitive data (passwords, API keys)
- Use environment variables for credentials
- Rotate proxies regularly
- Monitor for suspicious activity
- Comply with website terms of service