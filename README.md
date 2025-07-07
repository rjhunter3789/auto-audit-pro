# Auto Audit Pro - Professional Dealership Website Analysis Platform

A comprehensive web application for analyzing automotive dealership websites using Selenium WebDriver and Google PageSpeed API.

## Features

- **8-Category Testing System**: Comprehensive analysis across multiple quality dimensions
- **Real-Time Selenium Testing**: Automated browser testing for functionality validation
- **Google PageSpeed Integration**: Real performance metrics from Google's API
- **Professional Reporting**: Detailed analysis with actionable recommendations
- **Brand Compliance Checks**: Ensures adherence to manufacturer standards
- **Lead Generation Analysis**: Evaluates conversion optimization elements

## Test Categories

1. **Basic Connectivity** (12% weight) - DNS, SSL, accessibility checks
2. **Performance Testing** (18% weight) - Page speed, loading times, optimization
3. **SEO Analysis** (15% weight) - Meta tags, schema markup, search visibility
4. **User Experience** (15% weight) - Mobile responsiveness, navigation, usability
5. **Content Analysis** (15% weight) - Quality, relevance, and completeness
6. **Technical Validation** (10% weight) - Code quality, standards compliance
7. **Brand Compliance** (8% weight) - Manufacturer guidelines adherence
8. **Lead Generation** (7% weight) - Forms, CTAs, conversion elements

## Prerequisites

- Node.js 14+ and npm
- Chrome browser installed
- Google PageSpeed API key (optional, for enhanced performance metrics)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dealership-audit-mvp.git
cd dealership-audit-mvp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3002
PAGESPEED_API_KEY=your_google_pagespeed_api_key_here
```

## Usage

1. Start the server:
```bash
npm start
```

2. Access the application:
```
http://localhost:3002
```

3. Enter a dealership website URL to begin analysis

## API Endpoints

- `POST /api/audit` - Start a new website audit
- `GET /api/audit/:id` - Get audit status and results
- `GET /api/audits` - Get audit history
- `GET /api/health` - Health check endpoint

## Technology Stack

- **Backend**: Node.js, Express.js
- **Web Scraping**: Selenium WebDriver, Cheerio
- **Performance**: Google PageSpeed API
- **Frontend**: EJS templates, Bootstrap
- **Testing**: Automated browser testing with Chrome

## Security

- Input validation on all user inputs
- Rate limiting to prevent abuse
- No sensitive data storage
- CORS enabled for API access

## Development

For development mode with auto-restart:
```bash
npm run dev
```

## Deployment

The application can be deployed to various platforms:

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Docker
```bash
docker build -t auto-audit-pro .
docker run -p 3002:3002 auto-audit-pro
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Copyright © 2025 Jeffrey Lee Robinson. All Rights Reserved.

## Contact

Jeffrey Lee Robinson - nakapaahu@gmail.com

Project Link: [https://github.com/yourusername/dealership-audit-mvp](https://github.com/yourusername/dealership-audit-mvp)