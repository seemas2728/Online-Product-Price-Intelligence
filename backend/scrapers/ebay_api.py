import requests
from bs4 import BeautifulSoup
import urllib.parse

def search_ebay(product_name):
    """
    eBay API scraper with fallback dummy data.
    """
    query = urllib.parse.quote_plus(product_name)
    url = f"https://www.ebay.com/sch/i.html?_nkw={query}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }

    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            items = soup.select(".s-item")
            
            results = []
            for item in items[1:6]: # skip first as it is often a wrapper/different item
                title_el = item.select_one(".s-item__title")
                price_el = item.select_one(".s-item__price")
                link_el = item.select_one(".s-item__link")
                img_el = item.select_one(".s-item__image-img")
                
                if title_el and price_el and link_el:
                    title = title_el.text.strip()
                    price_text = price_el.text.strip().replace('$', '').replace(',', '')
                    if 'to' in price_text:
                        price_text = price_text.split('to')[0].strip()
                        
                    link = link_el.get('href', '')
                    img = img_el.get('src', '') if img_el else ''
                    
                    try:
                        price_val = float(price_text.split()[0].replace('$', ''))
                        if price_val > 0:
                            results.append({
                                "product_name": title,
                                "price": str(price_val),
                                "store": "eBay",
                                "product_url": link,
                                "image": img
                            })
                    except ValueError:
                        pass
            if results:
                return results
    except Exception as e:
        print(f"eBay scraping error: {e}")

    # Fallback dummy implementation
    return [
        {
            "product_name": f"{product_name} - eBay Listing",
            "price": "19.99",
            "store": "eBay",
            "product_url": f"https://www.ebay.com/sch/i.html?_nkw={product_name.replace(' ', '+')}",
            "image": "https://via.placeholder.com/120?text=eBay+Item"
        }
    ]
