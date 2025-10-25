#!/bin/bash
echo "Fixing Web Search Integration"
echo "============================="

# Create the web search fix
cat << 'EOF' > /tmp/fix-web-search.py

# Find the chat endpoint around line 240-280
# Look for this section in /api/chat:

        # Search Google Drive if keywords are mentioned
        drive_keywords = ['drive', 'file', 'document', 'folder', 'search my', 'find my', 'look for', 'impel', 'ford', 'dealership']
        drive_context = ""
        
        message_lower = message.lower()
        if any(keyword in message_lower for keyword in drive_keywords):
            try:
                from google_drive import search_drive_files
                search_query = message
                for keyword in ['in my drive', 'search my drive', 'find', 'look for', 'search for']:
                    search_query = search_query.lower().replace(keyword, '').strip()
                
                files = search_drive_files(search_query, max_results=5)
                if files:
                    drive_context = f"\n\nFound {len(files)} relevant files in your Google Drive:\n"
                    for file in files:
                        drive_context += f"- {file['name']}\n"
            except Exception as e:
                print(f"Drive search error: {e}")
        
        # Web search - THIS NEEDS TO BE AT THE SAME INDENTATION LEVEL
        web_keywords = ['search the web', 'google', 'what is', 'latest', 'news', 'current', 'today', 'stock price', 'search online']
        web_context = ""
        
        if any(keyword in message_lower for keyword in web_keywords):
            import re
            search_query = re.sub(r'\b(search|the web|online|google|look up|for)\b', '', message_lower).strip()
            
            if search_query:
                try:
                    from web_search import search_web
                    results = search_web(search_query, 3)
                    
                    if results:
                        web_context = f"\n\nWeb search results for '{search_query}':\n"
                        for r in results:
                            web_context += f"- {r['title']}\n  {r['snippet'][:100]}...\n"
                except Exception as e:
                    print(f"Web search error: {e}")
        
        # Update system prompt to include BOTH contexts
        system_prompt = f"""You are 'G', a FordDirect Digital Performance Consultant with 30 years of automotive experience talking to Jeff. You know Jeff well and work together. Speak naturally like a knowledgeable colleague and friend - use contractions, be conversational, share automotive insights when relevant, and keep responses brief but warm. You have access to Jeff's Google Drive with all his automotive documents and data.{drive_context}{web_context}"""

EOF

echo "Instructions to fix web search:"
echo "1. SSH to server: ssh root@146.190.39.214"
echo "2. cd /var/www/smart-doc-v2"
echo "3. nano app.py"
echo "4. Find the /api/chat endpoint (around line 240)"
echo "5. Make sure the web search block is properly indented"
echo "6. The web_context should be included in system_prompt"
echo "7. Save and exit (Ctrl+X, Y, Enter)"
echo "8. pm2 restart smart-doc-v2"
echo ""
echo "Also check that web_search.py exists:"
echo "cat web_search.py"
echo ""
echo "If web_search.py is missing, create it with:"
echo "nano web_search.py"
echo "Then paste the web search code from the recovery log"