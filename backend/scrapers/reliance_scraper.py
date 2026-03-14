import random

def scrape_reliance(product_name):
    print(f"Scraping Reliance Digital for {product_name}...")
    return [{
        "platform": "Reliance Digital",
        "store": "Reliance Digital",
        "price": f"₹{random.randint(1500, 50000)}.00",
        "product_name": product_name,
        "product_url": f"https://www.reliancedigital.in/search?q={product_name.replace(' ', '%20')}",
        "image": ""
    }]
