import requests
from bs4 import BeautifulSoup
import urllib.parse

def scrape_walmart(product_name):
    """
    Walmart scraper with fallback dummy data.
    """
    query = urllib.parse.quote_plus(product_name)
    url = f"https://www.walmart.com/search?q={query}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }

    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.select("div[data-item-id]")
            
            results = []
            for item in items[:5]:
                title_el = item.select_one("span[data-automation-id='product-title']")
                link_el = item.select_one("a")
                price_el = item.select_one("span[data-automation-id='product-price']") 
                img_el = item.select_one("img")
                
                if title_el and link_el and price_el:
                    title = title_el.text.strip()
                    href = link_el.get('href', '')
                    link = 'https://www.walmart.com' + href if href.startswith('/') else href
                    img = img_el.get('src', '') if img_el else ''
                    
                    price_text = price_el.text.replace('$', '').replace('current price', '').replace('Now', '').strip()
                    try:
                        price_val = float(''.join(c for c in price_text if c.isdigit() or c == '.'))
                        if price_val > 0:
                            results.append({
                                "product_name": title,
                                "price": str(price_val),
                                "store": "Walmart",
                                "product_url": link,
                                "image": img
                            })
                    except ValueError:
                        pass
            if results:
                return results
    except Exception as e:
        print(f"Walmart API scraping error: {e}")

    # Fallback to dummy implementation
    return [
        {
            "product_name": f"{product_name} - Walmart Listing",
            "price": "21.99",
            "store": "Walmart",
            "product_url": f"https://www.walmart.com/search?q={product_name.replace(' ', '+')}",
            "image": "https://via.placeholder.com/120?text=Walmart+Item"
        }
    ]
