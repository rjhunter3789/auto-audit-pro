/*
 * Auto Audit Pro - Professional Dealership Website Analysis Platform
 * © 2025 JL Robinson. All Rights Reserved.
 * 
 * Enhanced Recommendations Engine
 * Provides detailed, actionable recommendations based on audit findings
 */

// Detailed recommendation templates by category and issue type
const RECOMMENDATION_TEMPLATES = {
    'Basic Connectivity - Security': {
        'Missing SSL Certificate': {
            priority: 'high',
            impact: 'Security & SEO',
            recommendations: [
                {
                    title: 'Install SSL Certificate',
                    details: 'Your website needs an SSL certificate to secure customer data and improve search rankings. Google penalizes non-HTTPS sites.',
                    implementation: '1. Purchase SSL certificate from your hosting provider\n2. Install certificate on web server\n3. Update all internal links to HTTPS\n4. Set up 301 redirects from HTTP to HTTPS\n5. Update Google Search Console with HTTPS version',
                    expectedResult: 'Improved security, better SEO rankings, increased customer trust',
                    effort: 'Medium',
                    timeframe: '4-6 hours'
                }
            ]
        }
    },
    'User Experience - Contact': {
        'Contact information verification required': {
            priority: 'info',
            impact: 'Manual Review',
            recommendations: [
                {
                    title: 'Manual Verification Recommended 🔍',
                    details: 'Our automated analysis could not definitively verify phone number placement. Phone numbers may be displayed as images or loaded dynamically. Please manually confirm that department phone numbers (Sales, Service, Parts) are displayed prominently in the header.',
                    implementation: 'Manual review only - no action may be required if contact information is already properly displayed',
                    expectedResult: 'Ensure best practices are followed',
                    effort: 'Minimal',
                    timeframe: '5 minutes'
                }
            ]
        },
        'No phone number found': {
            priority: 'high',
            impact: 'Lead Generation',
            recommendations: [
                {
                    title: 'Add Prominent Phone Number in Header',
                    details: 'Place your main sales number in the header area where it\'s visible on every page. Use a clickable tel: link for mobile users.',
                    implementation: '1. Add phone number to header template\n2. Use format: <a href="tel:+15551234567">(555) 123-4567</a>\n3. Style with contrasting color for visibility',
                    expectedResult: '15-25% increase in phone inquiries',
                    effort: 'Low',
                    timeframe: '1-2 hours'
                },
                {
                    title: 'Implement Click-to-Call for Mobile',
                    details: 'Ensure all phone numbers are clickable on mobile devices to reduce friction for mobile users.',
                    implementation: 'Wrap all phone numbers in tel: links throughout the site',
                    expectedResult: '30% increase in mobile call conversions',
                    effort: 'Low',
                    timeframe: '2-3 hours'
                }
            ]
        },
        'Contact information could be more prominent': {
            priority: 'medium',
            impact: 'User Experience',
            recommendations: [
                {
                    title: 'Create Sticky Contact Bar',
                    details: 'Add a sticky header or floating contact bar that remains visible as users scroll.',
                    implementation: '1. Create fixed position header\n2. Include phone, chat, and email options\n3. Test on all devices',
                    expectedResult: '10-15% increase in contact rate',
                    effort: 'Medium',
                    timeframe: '4-6 hours'
                }
            ]
        }
    },
    'Lead Generation - Forms': {
        'Form System Review': {
            priority: 'info',
            impact: 'Quality Assurance',
            recommendations: [
                {
                    title: 'Verify Form Functionality 🔍',
                    details: 'Form indicators detected on your website. Please manually verify that all lead capture forms are loading and functioning properly across different devices and browsers.',
                    implementation: 'Check the following:\n1. Forms appear on key pages (homepage, inventory, contact)\n2. Forms are mobile-responsive\n3. Form submissions are being received\n4. Thank you messages display properly\n5. Forms integrate with your CRM',
                    expectedResult: 'Confirmed lead capture functionality',
                    effort: 'Minimal',
                    timeframe: '15-30 minutes'
                }
            ]
        },
        'No clear contact method found': {
            priority: 'high',
            impact: 'Lead Generation',
            recommendations: [
                {
                    title: 'Add Contact Form to Homepage',
                    details: 'Implement a simple, above-the-fold contact form on your homepage to capture leads immediately.',
                    implementation: '1. Create 3-field form (Name, Email, Phone)\n2. Add "How can we help?" message field\n3. Place in hero section or sidebar\n4. Integrate with CRM',
                    expectedResult: '20-30% increase in lead capture',
                    effort: 'Medium',
                    timeframe: '6-8 hours'
                },
                {
                    title: 'Add Multiple Contact CTAs',
                    details: 'Place "Contact Us" buttons throughout key pages with different messaging for different departments.',
                    implementation: '1. Add CTAs for Sales, Service, Parts\n2. Use action-oriented text\n3. Track clicks separately',
                    expectedResult: '15% increase in qualified leads',
                    effort: 'Low',
                    timeframe: '3-4 hours'
                }
            ]
        }
    },
    'SEO Analysis - Meta Tags': {
        'Missing meta description': {
            priority: 'medium',
            impact: 'SEO & Click-Through Rate',
            recommendations: [
                {
                    title: 'Add Compelling Meta Descriptions',
                    details: 'Meta descriptions are crucial for search engine visibility and click-through rates. They appear in search results below your page title.',
                    implementation: '1. Write unique 150-160 character descriptions for each page\n2. Include primary keywords naturally\n3. Add a clear call-to-action\n4. Mention your location and key services\n5. Update your CMS or HTML with the meta descriptions',
                    expectedResult: '15-20% increase in organic click-through rate',
                    effort: 'Low',
                    timeframe: '2-4 hours'
                }
            ]
        },
        'Missing or improper title tag': {
            priority: 'high',
            impact: 'SEO Rankings',
            recommendations: [
                {
                    title: 'Optimize Page Title Tags',
                    details: 'Title tags are the most important on-page SEO element. They tell search engines and users what your page is about.',
                    implementation: '1. Create unique titles for each page (50-60 characters)\n2. Include dealership name and location\n3. Front-load important keywords\n4. Format: "Primary Keyword | Dealership Name | Location"\n5. Avoid duplicate titles across pages',
                    expectedResult: '20-30% improvement in search visibility',
                    effort: 'Low',
                    timeframe: '2-3 hours'
                }
            ]
        }
    },
    'Performance Testing - Resource Optimization': {
        'Large page size': {
            priority: 'high',
            impact: 'Page Speed & User Experience',
            recommendations: [
                {
                    title: 'Reduce Page Size Through Optimization',
                    details: 'Large page sizes lead to slow load times, especially on mobile devices. Your pages should be under 3MB for optimal performance.',
                    implementation: '1. Compress all images using WebP format\n2. Minify CSS and JavaScript files\n3. Remove unused code and plugins\n4. Implement lazy loading for images\n5. Use a CDN for static assets',
                    expectedResult: '50% reduction in page load time',
                    effort: 'Medium',
                    timeframe: '8-12 hours'
                }
            ]
        }
    },
    'Lead Generation - Forms': {
        'No lead forms found': {
            priority: 'high',
            impact: 'Lead Generation',
            recommendations: [
                {
                    title: 'Implement Strategic Lead Capture Forms',
                    details: 'Without lead forms, you\'re missing opportunities to capture interested buyers. Forms should be prominent and easy to complete.',
                    implementation: '1. Add "Get ePrice" form on vehicle pages\n2. Create "Schedule Test Drive" form\n3. Implement "Value Your Trade" calculator\n4. Keep forms short (3-5 fields)\n5. Make phone number optional\n6. Add forms to high-traffic pages',
                    expectedResult: '200-300% increase in lead generation',
                    effort: 'High',
                    timeframe: '16-24 hours'
                }
            ]
        },
        'Limited form placement': {
            priority: 'medium',
            impact: 'Conversion Rate',
            recommendations: [
                {
                    title: 'Expand Form Placement Strategy',
                    details: 'Forms should be available at multiple touchpoints throughout the customer journey to maximize conversions.',
                    implementation: '1. Add forms to inventory search results\n2. Include forms in vehicle comparison tools\n3. Place forms on service pages\n4. Add exit-intent popups with forms\n5. Ensure mobile-friendly form design',
                    expectedResult: '40-60% increase in form submissions',
                    effort: 'Medium',
                    timeframe: '8-10 hours'
                }
            ]
        }
    },
    'Lead Generation - CTAs': {
        'Limited CTAs': {
            priority: 'medium',
            impact: 'Conversion Rate',
            recommendations: [
                {
                    title: 'Enhance Call-to-Action Strategy',
                    details: 'Strong, visible CTAs guide visitors toward conversion. Every page should have clear next steps for visitors.',
                    implementation: '1. Add prominent CTAs above the fold\n2. Use action-oriented text ("Get Your Price", "Check Availability")\n3. Make buttons stand out with contrasting colors\n4. Place CTAs after key content sections\n5. Test different CTA variations',
                    expectedResult: '25-35% increase in click-through rate',
                    effort: 'Low',
                    timeframe: '4-6 hours'
                }
            ]
        }
    },
    'User Experience - Mobile': {
        'Mobile responsiveness issues': {
            priority: 'high',
            impact: 'Mobile Conversions',
            recommendations: [
                {
                    title: 'Optimize Mobile Experience',
                    details: 'Over 60% of dealership traffic is mobile. Poor mobile experience directly impacts leads and sales.',
                    implementation: '1. Audit mobile experience on multiple devices\n2. Ensure touch targets are at least 44x44 pixels\n3. Simplify navigation for mobile\n4. Optimize forms for mobile input\n5. Test page speed on 4G connections',
                    expectedResult: '45% increase in mobile conversion rate',
                    effort: 'High',
                    timeframe: '20-30 hours'
                }
            ]
        }
    },
    'Functionality - Inventory': {
        'Limited search filters detected': {
            priority: 'medium',
            impact: 'User Experience',
            recommendations: [
                {
                    title: 'Enhance Inventory Search Functionality',
                    details: 'Comprehensive filtering options help customers find their ideal vehicle faster, reducing frustration and improving conversion rates.',
                    implementation: '1. Add essential filters: Year, Make, Model, Trim\n2. Include price range slider with min/max\n3. Add mileage range filter\n4. Include body style options (Sedan, SUV, Truck, etc.)\n5. Add color filters (exterior and interior)\n6. Include feature filters (AWD, Sunroof, Leather, etc.)\n7. Add MPG range filters\n8. Ensure filters work on mobile devices',
                    expectedResult: '35% reduction in search abandonment, 25% increase in VDP views',
                    effort: 'High',
                    timeframe: '20-30 hours'
                }
            ]
        }
    },
    'Manual Review - Inventory': {
        'Search filters may load dynamically': {
            priority: 'low',
            impact: 'Quality Assurance',
            recommendations: [
                {
                    title: 'Verify Search Filter Functionality',
                    details: 'Filter interface detected but filters may load after initial page load. Manual verification needed to ensure comprehensive filtering options.',
                    implementation: 'Manually verify the following filters are available:\n- Year selection\n- Make/Model dropdowns\n- Price range slider\n- Mileage range\n- Body style options\n- Transmission type\n- Fuel type\n- Color options\n- Feature checkboxes',
                    expectedResult: 'Confirmed user-friendly search experience',
                    effort: 'Minimal',
                    timeframe: '10 minute review'
                }
            ]
        }
    },
    'Functionality Review - Inventory': {
        'Search Filter System Not Detected': {
            priority: 'high',
            impact: 'User Experience',
            recommendations: [
                {
                    title: 'Implement Comprehensive Search Filters',
                    details: 'Modern car shoppers expect robust filtering options to find their ideal vehicle quickly. Without filters, users may leave for competitor sites.',
                    implementation: '1. Add essential filters: Year (dropdown), Make/Model (cascading dropdowns)\n2. Price range slider with min/max inputs\n3. Mileage range filter\n4. Body type checkboxes (Sedan, SUV, Truck, etc.)\n5. Transmission and fuel type options\n6. Color selection (exterior/interior)\n7. Features checklist (AWD, sunroof, leather, etc.)',
                    expectedResult: '40% reduction in bounce rate, 30% increase in VDP views',
                    effort: 'High',
                    timeframe: '24-32 hours'
                }
            ]
        }
    },
    'Enhancement - Inventory': {
        'Expand Filter Options': {
            priority: 'low',
            impact: 'Competitive Advantage',
            recommendations: [
                {
                    title: 'Add Advanced Filter Options',
                    details: 'You have basic filters, but adding more options will help customers find vehicles faster and reduce search frustration.',
                    implementation: '1. Review current filter usage analytics\n2. Add most requested missing filters\n3. Consider advanced options like MPG range, safety ratings\n4. Implement filter combinations saving\n5. Add "similar vehicles" suggestions',
                    expectedResult: '15% improvement in search satisfaction',
                    effort: 'Medium',
                    timeframe: '8-12 hours'
                }
            ]
        },
        'Filter Enhancement Opportunity': {
            priority: 'low',
            impact: 'User Experience',
            recommendations: [
                {
                    title: 'Complete Your Filter Set',
                    details: 'Adding a few more filter options will match industry best practices and improve the search experience.',
                    implementation: '1. Analyze which filters competitors offer\n2. Survey customers for desired filters\n3. Add 2-3 most requested options\n4. Monitor usage and iterate',
                    expectedResult: 'More satisfied shoppers, reduced support calls',
                    effort: 'Low',
                    timeframe: '4-6 hours'
                }
            ]
        }
    },
    'Technical - Mobile': {
        'Missing mobile viewport meta tag': {
            priority: 'medium',
            impact: 'Mobile Experience',
            recommendations: [
                {
                    title: 'Add Mobile Viewport Meta Tag',
                    details: 'The viewport meta tag is essential for proper mobile rendering. Without it, mobile browsers display desktop layouts.',
                    implementation: 'Add to <head> section:\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\nThis ensures proper scaling on all devices.',
                    expectedResult: 'Proper mobile rendering and zoom behavior',
                    effort: 'Low',
                    timeframe: '15 minutes'
                }
            ]
        },
        'Incomplete viewport configuration': {
            priority: 'low',
            impact: 'Mobile Experience',
            recommendations: [
                {
                    title: 'Update Viewport Meta Tag',
                    details: 'Your viewport tag needs proper configuration for optimal mobile experience.',
                    implementation: 'Update existing viewport tag to:\n<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">\n\nAvoid disabling user zoom with maximum-scale=1.0',
                    expectedResult: 'Better mobile scaling and accessibility',
                    effort: 'Low',
                    timeframe: '15 minutes'
                }
            ]
        }
    },
    'Mobile - Inventory': {
        'Mobile compatibility concerns detected': {
            priority: 'medium',
            impact: 'Mobile User Experience',
            recommendations: [
                {
                    title: 'Review Mobile Compatibility Issues',
                    details: 'Elements detected that may cause problems on mobile devices. Modern mobile users expect seamless experiences.',
                    implementation: '1. Remove any Flash content - not supported on mobile\n2. Replace fixed-width layouts with responsive designs\n3. Use relative units (%, rem, vw) instead of fixed pixels\n4. Test on actual mobile devices\n5. Ensure touch targets are at least 44x44 pixels\n6. Implement responsive images',
                    expectedResult: 'Improved mobile usability and lower bounce rates',
                    effort: 'Medium',
                    timeframe: '8-16 hours'
                }
            ]
        }
    },
    'SEO Analysis - Meta': {
        'Missing or poor meta description': {
            priority: 'high',
            impact: 'Search Visibility',
            recommendations: [
                {
                    title: 'Write Compelling Meta Descriptions',
                    details: 'Create unique, keyword-rich meta descriptions for each page that encourage clicks from search results.',
                    implementation: '1. Write 150-160 character descriptions\n2. Include primary keywords naturally\n3. Add call-to-action\n4. Mention location and brand',
                    expectedResult: '10-15% increase in CTR from search',
                    effort: 'Medium',
                    timeframe: '4-6 hours for main pages'
                },
                {
                    title: 'Implement Dynamic Meta Tags',
                    details: 'Set up dynamic meta descriptions for inventory pages that automatically include vehicle details.',
                    implementation: 'Use template: "[Year] [Make] [Model] for sale at [Dealership] in [City]. [Unique selling point]. View photos, pricing & financing options."',
                    expectedResult: 'Better indexing of inventory pages',
                    effort: 'Medium',
                    timeframe: '6-8 hours'
                }
            ]
        }
    },
    'Performance - Speed': {
        'Slow page load': {
            priority: 'high',
            impact: 'User Experience & SEO',
            recommendations: [
                {
                    title: 'Optimize Images',
                    details: 'Compress and properly size all images, implement lazy loading for below-fold images.',
                    implementation: '1. Use WebP format for better compression\n2. Implement responsive images\n3. Add lazy loading\n4. Use CDN for image delivery',
                    expectedResult: '40-60% reduction in page weight',
                    effort: 'Medium',
                    timeframe: '8-12 hours'
                },
                {
                    title: 'Implement Caching Strategy',
                    details: 'Set up browser caching and server-side caching to improve repeat visit performance.',
                    implementation: '1. Configure cache headers\n2. Set up CDN caching\n3. Implement service worker for offline access',
                    expectedResult: '50% faster load times for repeat visitors',
                    effort: 'High',
                    timeframe: '12-16 hours'
                }
            ]
        }
    },
    'Content - VDP': {
        'Basic Image Display Detected': {
            priority: 'medium',
            impact: 'User Engagement',
            recommendations: [
                {
                    title: 'Implement Professional Image Gallery System',
                    details: 'A proper image gallery significantly improves user engagement. Studies show buyers spend 60% of their time viewing vehicle photos.',
                    implementation: '1. Install a responsive image gallery solution\n2. Ensure 20-40 photos per vehicle\n3. Include all angles: front, rear, sides, 3/4 views\n4. Add detailed interior shots: dashboard, seats, cargo area\n5. Photograph key features: wheels, engine, technology\n6. Use consistent lighting and backgrounds\n7. Consider 360° photography or video tours',
                    expectedResult: '40% increase in time on VDP, 25% increase in lead conversion',
                    effort: 'Medium',
                    timeframe: '1-2 weeks for implementation'
                }
            ]
        },
        'Image Gallery Enhancement Opportunity': {
            priority: 'low',
            impact: 'Competitive Advantage',
            recommendations: [
                {
                    title: 'Expand Vehicle Photo Collection',
                    details: 'Your gallery system is working well. Adding more comprehensive photography will give you a competitive edge.',
                    implementation: '1. Add detail shots: gauges, controls, trunk space\n2. Include lifestyle angles showing the vehicle in context\n3. Photograph all available colors/trims\n4. Add night shots of lighting features\n5. Include close-ups of unique features\n6. Consider professional photography services',
                    expectedResult: '15-20% increase in user engagement, improved customer confidence',
                    effort: 'Low',
                    timeframe: 'Ongoing improvement'
                }
            ]
        },
        'Image Collection Enhancement': {
            priority: 'low',
            impact: 'User Experience',
            recommendations: [
                {
                    title: 'Complete Vehicle Photo Set',
                    details: 'You have good photo coverage. Adding a few more images will meet industry best practices.',
                    implementation: '1. Review current photos for gaps\n2. Add any missing standard angles\n3. Include detail shots of popular features\n4. Ensure consistent quality across all photos',
                    expectedResult: 'Improved user satisfaction and reduced "photo request" inquiries',
                    effort: 'Low',
                    timeframe: '1-2 hours per vehicle'
                }
            ]
        }
    },
    'Manual Review - VDP': {
        'Image Gallery Review': {
            priority: 'info',
            impact: 'Quality Assurance',
            recommendations: [
                {
                    title: 'Verify Gallery Performance',
                    details: 'Your image gallery system was detected but requires manual verification to ensure optimal performance.',
                    implementation: 'Please manually check:\n1. Total image count (should be 20+)\n2. Image load speed on mobile devices\n3. Gallery navigation ease of use\n4. Image quality and resolution\n5. Proper display across all browsers',
                    expectedResult: 'Confirmed optimal gallery performance',
                    effort: 'Minimal',
                    timeframe: '15-30 minutes'
                }
            ]
        }
    },
    'Technical Review - VDP': {
        'Vehicle Image System Not Detected': {
            priority: 'high',
            impact: 'Critical Issue',
            recommendations: [
                {
                    title: 'Investigate Image Display Issue',
                    details: 'No vehicle images or gallery system detected. This is unusual and may indicate a technical problem.',
                    implementation: '1. Verify images are loading correctly in different browsers\n2. Check for JavaScript errors preventing gallery load\n3. Ensure CDN or image hosting service is functioning\n4. Test page on multiple devices\n5. Review recent website changes that may have affected images\n6. Contact your website provider if issue persists',
                    expectedResult: 'Restored vehicle image functionality',
                    effort: 'High',
                    timeframe: 'Immediate attention required'
                }
            ]
        }
    },
    'Content Analysis - Inventory': {
        'Limited inventory information': {
            priority: 'medium',
            impact: 'User Experience',
            recommendations: [
                {
                    title: 'Enhance Vehicle Detail Pages',
                    details: 'Add comprehensive information to VDPs including features, specifications, and high-quality media.',
                    implementation: '1. Add 20+ photos per vehicle\n2. Include 360° views or videos\n3. List all features and options\n4. Add window sticker\n5. Show payment calculator',
                    expectedResult: '25% increase in VDP engagement',
                    effort: 'High',
                    timeframe: '20-30 hours'
                },
                {
                    title: 'Add Vehicle Comparison Tool',
                    details: 'Allow users to compare multiple vehicles side-by-side to aid decision making.',
                    implementation: '1. Create comparison interface\n2. Allow up to 3 vehicles\n3. Highlight differences\n4. Include financing comparison',
                    expectedResult: '15% increase in lead quality',
                    effort: 'High',
                    timeframe: '40+ hours'
                }
            ]
        }
    },
    'Technical - Mobile': {
        'Mobile responsiveness issues': {
            priority: 'high',
            impact: 'User Experience & SEO',
            recommendations: [
                {
                    title: 'Implement Mobile-First Design',
                    details: 'Redesign key pages with mobile users as the primary focus, ensuring all functionality works on touch devices.',
                    implementation: '1. Audit current mobile experience\n2. Redesign navigation for mobile\n3. Optimize forms for mobile\n4. Test on multiple devices',
                    expectedResult: '30% increase in mobile conversions',
                    effort: 'High',
                    timeframe: '40-60 hours'
                },
                {
                    title: 'Optimize Touch Targets',
                    details: 'Ensure all buttons and links are easily tappable on mobile devices.',
                    implementation: '1. Minimum 44x44px touch targets\n2. Add padding around links\n3. Increase button sizes\n4. Space elements appropriately',
                    expectedResult: 'Reduced bounce rate on mobile',
                    effort: 'Medium',
                    timeframe: '8-12 hours'
                }
            ]
        }
    },
    'SEO Analysis - Meta': {
        'Poor title tag': {
            priority: 'high',
            impact: 'Search Rankings',
            recommendations: [
                {
                    title: 'Optimize Title Tags for SEO',
                    details: 'Your title tags need improvement. They are the most important on-page SEO factor and directly impact click-through rates from search results.',
                    implementation: '1. Format: "Primary Keyword - Secondary Keyword | Dealership Name | Location"\n2. Keep under 60 characters to avoid truncation\n3. Put most important keywords first\n4. Make each page title unique\n5. Include your city/region for local SEO\n6. Avoid keyword stuffing',
                    expectedResult: '15-25% improvement in organic CTR',
                    effort: 'Low',
                    timeframe: '2-3 hours'
                }
            ]
        }
    },
    'Content Analysis - Inventory Visibility': {
        'Inventory navigation not found': {
            priority: 'medium',
            impact: 'User Navigation',
            recommendations: [
                {
                    title: 'Add Clear Inventory Navigation',
                    details: 'Visitors cannot easily find your inventory. This is causing you to lose potential buyers who leave for competitor sites.',
                    implementation: '1. Add "View Inventory" or "Shop Now" to main navigation\n2. Create separate "New" and "Used" navigation items\n3. Add inventory search box to homepage\n4. Include quick links by popular categories (SUVs, Trucks, etc.)\n5. Ensure mobile menu includes inventory access',
                    expectedResult: '25% increase in inventory page views',
                    effort: 'Low',
                    timeframe: '2-4 hours'
                }
            ]
        }
    },
    'Lead Generation - Contact': {
        'Limited contact options detected': {
            priority: 'medium',
            impact: 'Lead Generation',
            recommendations: [
                {
                    title: 'Expand Contact Options',
                    details: 'Multiple contact methods increase conversion rates. Different customers prefer different communication channels.',
                    implementation: '1. Add prominent phone numbers with department labels\n2. Implement live chat for instant communication\n3. Create department-specific contact forms\n4. Add SMS/text option for mobile users\n5. Include WhatsApp or Facebook Messenger options\n6. Display hours of operation clearly',
                    expectedResult: '20-30% increase in contact rate',
                    effort: 'Medium',
                    timeframe: '6-8 hours'
                }
            ]
        },
        'Make phone numbers clickable': {
            priority: 'low',
            impact: 'Mobile Experience',
            recommendations: [
                {
                    title: 'Enable Click-to-Call Functionality',
                    details: 'Phone numbers are visible but not clickable on mobile devices. This creates friction for mobile users who want to call.',
                    implementation: '1. Wrap all phone numbers in tel: links\n2. Format: <a href="tel:+15551234567">(555) 123-4567</a>\n3. Add click tracking for analytics\n4. Style links to show they are clickable\n5. Test on various mobile devices',
                    expectedResult: '35% increase in mobile phone calls',
                    effort: 'Low',
                    timeframe: '1-2 hours'
                }
            ]
        }
    },
    'Lead Generation - CTAs': {
        'Limited CTAs': {
            priority: 'medium',
            impact: 'Conversion Rate',
            recommendations: [
                {
                    title: 'Strategic CTA Placement',
                    details: 'Your site needs more prominent calls-to-action to guide visitors toward conversion. Every page should have a clear next step.',
                    implementation: '1. Add sticky CTA bar with phone and main action\n2. Place CTAs after each content section\n3. Use action-oriented text ("Get Pre-Approved", "Value Your Trade")\n4. Make buttons contrast with background\n5. Add urgency with limited-time offers\n6. Include CTAs in vehicle listings',
                    expectedResult: '25-40% increase in lead generation',
                    effort: 'Medium',
                    timeframe: '6-8 hours'
                }
            ]
        }
    }
};

// Generate category-specific recommendations for issues without templates
function generateCategorySpecificRecommendation(issue, category, title) {
    const categoryRecommendations = {
        'SEO Analysis': {
            impact: 'Search Visibility',
            defaultRec: {
                title: `SEO Optimization: ${title}`,
                details: issue.details || `Improve search engine optimization for better visibility. ${title} affects how search engines understand and rank your website.`,
                implementation: `1. Audit current SEO implementation\n2. Research competitor SEO strategies\n3. Implement technical SEO fixes\n4. Monitor results in Google Search Console`,
                expectedResult: 'Improved search rankings and organic traffic',
                effort: 'Medium',
                timeframe: '4-8 hours'
            }
        },
        'Performance Testing': {
            impact: 'Page Speed & User Experience',
            defaultRec: {
                title: `Performance Enhancement: ${title}`,
                details: issue.details || `Optimize website performance to improve user experience. Faster sites have higher conversion rates and better SEO rankings.`,
                implementation: `1. Run detailed performance audit\n2. Identify specific bottlenecks\n3. Implement caching and optimization\n4. Test improvements across devices`,
                expectedResult: 'Faster page loads and improved user satisfaction',
                effort: 'Medium',
                timeframe: '6-10 hours'
            }
        },
        'User Experience': {
            impact: 'Customer Satisfaction',
            defaultRec: {
                title: `UX Improvement: ${title}`,
                details: issue.details || `Enhance user experience to reduce friction and improve conversions. Better UX leads to more engaged visitors and higher lead quality.`,
                implementation: `1. Conduct user testing to identify pain points\n2. Review analytics for user behavior patterns\n3. Implement UX improvements\n4. A/B test changes for effectiveness`,
                expectedResult: 'Higher engagement and conversion rates',
                effort: 'Medium',
                timeframe: '8-12 hours'
            }
        },
        'Lead Generation': {
            impact: 'Lead Capture & Conversion',
            defaultRec: {
                title: `Lead Generation Enhancement: ${title}`,
                details: issue.details || `Improve lead capture mechanisms to generate more qualified leads. Every optimization can directly impact your bottom line.`,
                implementation: `1. Analyze current conversion funnel\n2. Identify drop-off points\n3. Implement lead capture improvements\n4. Track and optimize conversion rates`,
                expectedResult: 'Increased lead volume and quality',
                effort: 'High',
                timeframe: '10-15 hours'
            }
        },
        'Content Analysis': {
            impact: 'Content Effectiveness',
            defaultRec: {
                title: `Content Optimization: ${title}`,
                details: issue.details || `Improve content strategy to better serve customer needs and search engines. Quality content drives both SEO and conversions.`,
                implementation: `1. Audit existing content\n2. Identify content gaps\n3. Create content calendar\n4. Optimize for keywords and user intent`,
                expectedResult: 'Better engagement and search visibility',
                effort: 'Medium',
                timeframe: '5-10 hours'
            }
        },
        'Trust & Credibility': {
            impact: 'Customer Trust',
            defaultRec: {
                title: `Trust Building: ${title}`,
                details: issue.details || `Build customer trust through transparency and credibility signals. Trust is essential for online conversions.`,
                implementation: `1. Add trust badges and certifications\n2. Display customer reviews prominently\n3. Ensure security compliance\n4. Update privacy policies and terms`,
                expectedResult: 'Increased customer confidence and conversions',
                effort: 'Low',
                timeframe: '2-4 hours'
            }
        }
    };

    // Get category-specific recommendation or use a general one
    const categoryData = categoryRecommendations[category] || {
        impact: 'Website Performance',
        defaultRec: {
            title: `Website Improvement: ${title}`,
            details: issue.details || `Address this issue to improve overall website performance and user experience.`,
            implementation: `1. Review current implementation\n2. Research best practices for ${category}\n3. Plan and implement improvements\n4. Test and monitor results`,
            expectedResult: 'Enhanced website functionality and user satisfaction',
            effort: 'Medium',
            timeframe: '4-8 hours'
        }
    };

    return {
        issue: title,
        category: category,
        priority: issue.priority || 'medium',
        impact: categoryData.impact,
        recommendations: [categoryData.defaultRec]
    };
}

// Function to generate enhanced recommendations based on issues
function generateEnhancedRecommendations(issues) {
    const enhancedRecommendations = [];
    
    issues.forEach(issue => {
        const category = issue.category || 'General';
        const title = issue.title;
        
        // Look for matching recommendation template
        if (RECOMMENDATION_TEMPLATES[category] && RECOMMENDATION_TEMPLATES[category][title]) {
            const template = RECOMMENDATION_TEMPLATES[category][title];
            
            enhancedRecommendations.push({
                issue: title,
                category: category,
                priority: template.priority,
                impact: template.impact,
                recommendations: template.recommendations
            });
        } else {
            // Generate category-specific recommendation if no template exists
            let recommendation = generateCategorySpecificRecommendation(issue, category, title);
            enhancedRecommendations.push(recommendation);
        }
    });
    
    // Sort by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    enhancedRecommendations.sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    
    return enhancedRecommendations;
}

// Generate implementation roadmap
function generateImplementationRoadmap(recommendations) {
    const roadmap = {
        immediate: [], // 1-2 days
        shortTerm: [], // 1-2 weeks
        mediumTerm: [], // 1-2 months
        longTerm: [] // 2+ months
    };
    
    recommendations.forEach(rec => {
        rec.recommendations.forEach(item => {
            const hours = parseInt(item.timeframe) || 0;
            const entry = {
                title: item.title,
                category: rec.category,
                effort: item.effort,
                timeframe: item.timeframe,
                impact: rec.impact,
                expectedResult: item.expectedResult
            };
            
            if (hours <= 8) {
                roadmap.immediate.push(entry);
            } else if (hours <= 40) {
                roadmap.shortTerm.push(entry);
            } else if (hours <= 160) {
                roadmap.mediumTerm.push(entry);
            } else {
                roadmap.longTerm.push(entry);
            }
        });
    });
    
    return roadmap;
}

// Calculate potential ROI
function calculatePotentialROI(recommendations) {
    const improvements = {
        leadIncrease: 0,
        conversionIncrease: 0,
        trafficIncrease: 0,
        estimatedValue: 0
    };
    
    recommendations.forEach(rec => {
        rec.recommendations.forEach(item => {
            // Skip manual review items from ROI calculation
            if (item.expectedResult.includes('Manual review') || 
                item.expectedResult.includes('Ensure best practices') ||
                item.title.includes('Manual Verification')) {
                return; // Skip this item
            }
            
            if (item.expectedResult.includes('lead')) {
                const match = item.expectedResult.match(/(\d+)/);
                if (match) improvements.leadIncrease += parseInt(match[1]);
            }
            if (item.expectedResult.includes('conversion')) {
                const match = item.expectedResult.match(/(\d+)/);
                if (match) improvements.conversionIncrease += parseInt(match[1]);
            }
            if (item.expectedResult.includes('traffic') || item.expectedResult.includes('CTR')) {
                const match = item.expectedResult.match(/(\d+)/);
                if (match) improvements.trafficIncrease += parseInt(match[1]);
            }
        });
    });
    
    // Rough calculation assuming average values
    const avgLeadsPerMonth = 100;
    const avgConversionRate = 0.02;
    const avgDealValue = 30000;
    
    const additionalLeads = avgLeadsPerMonth * (improvements.leadIncrease / 100);
    const additionalConversions = (avgLeadsPerMonth + additionalLeads) * 
                                 (avgConversionRate * (1 + improvements.conversionIncrease / 100)) - 
                                 (avgLeadsPerMonth * avgConversionRate);
    
    improvements.estimatedValue = Math.round(additionalConversions * avgDealValue * 12); // Annual value
    
    return improvements;
}

module.exports = {
    generateEnhancedRecommendations,
    generateImplementationRoadmap,
    calculatePotentialROI,
    RECOMMENDATION_TEMPLATES
};