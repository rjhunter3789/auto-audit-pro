#!/usr/bin/env python3
"""
Web search functionality for Smart Doc V2
Copy this to /var/www/smart-doc-v2/web_search.py
"""

import os
import requests
from bs4 import BeautifulSoup

def search_web(query, num_results=5):
    """Search the web and return results"""
    results = []
    
    # Try Google Custom Search first
    google_api_key = os.getenv('GOOGLE_API_KEY')
    google_cse_id = os.getenv('GOOGLE_CSE_ID')
    
    if google_api_key and google_cse_id:
        try:
            # Google Custom Search API
            url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': google_api_key,
                'cx': google_cse_id,
                'q': query,
                'num': num_results
            }
            
            response = requests.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                for item in data.get('items', []):
                    results.append({
                        'title': item.get('title', ''),
                        'link': item.get('link', ''),
                        'snippet': item.get('snippet', '')
                    })
                return results
        except Exception as e:
            print(f"Google search error: {e}")
    
    # Fallback to DuckDuckGo HTML search
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # DuckDuckGo HTML search
        url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find search results
            for i, result in enumerate(soup.find_all('div', class_='result__body')):
                if i >= num_results:
                    break
                    
                title_elem = result.find('a', class_='result__a')
                snippet_elem = result.find('a', class_='result__snippet')
                
                if title_elem:
                    results.append({
                        'title': title_elem.text.strip(),
                        'link': title_elem.get('href', ''),
                        'snippet': snippet_elem.text.strip() if snippet_elem else ''
                    })
            
            return results
            
    except Exception as e:
        print(f"DuckDuckGo search error: {e}")
    
    return results

# Test function
if __name__ == "__main__":
    test_query = "Tesla stock price today"
    print(f"Testing search for: {test_query}")
    results = search_web(test_query, 3)
    for r in results:
        print(f"\n{r['title']}")
        print(f"{r['snippet'][:100]}...")
        print(f"{r['link']}")