const axios = require('axios');
require('dotenv').config();

async function testScrapingDogAPI() {
    const apiKey = process.env.SCRAPINGDOG_API_KEY;
    console.log('Testing ScrapingDog API with key:', apiKey?.substring(0, 10) + '...\n');
    
    // Test the direct API
    try {
        console.log('1. Testing with current endpoint: https://api.scrapingdog.com/scrape');
        const response1 = await axios.get('https://api.scrapingdog.com/scrape', {
            params: {
                api_key: apiKey,
                url: 'https://example.com',
                dynamic: false
            },
            validateStatus: null
        });
        console.log('   Status:', response1.status);
        console.log('   Headers:', response1.headers);
        if (response1.status !== 200) {
            console.log('   Error data:', response1.data);
        }
    } catch (error) {
        console.error('   Request failed:', error.message);
    }
    
    // Try alternative endpoint
    try {
        console.log('\n2. Testing alternative endpoint: https://api.scrapingdog.com/');
        const response2 = await axios.get('https://api.scrapingdog.com/', {
            params: {
                api_key: apiKey,
                url: 'https://example.com',
                dynamic: false
            },
            validateStatus: null
        });
        console.log('   Status:', response2.status);
        if (response2.status === 200) {
            console.log('   ✅ This endpoint works!');
        }
    } catch (error) {
        console.error('   Request failed:', error.message);
    }
    
    // Test with different parameters
    try {
        console.log('\n3. Testing with minimal parameters:');
        const response3 = await axios.get('https://api.scrapingdog.com/scrape', {
            params: {
                api_key: apiKey,
                url: 'https://example.com'
            },
            validateStatus: null
        });
        console.log('   Status:', response3.status);
        if (response3.status === 200) {
            console.log('   ✅ Minimal parameters work!');
        }
    } catch (error) {
        console.error('   Request failed:', error.message);
    }
}

testScrapingDogAPI();