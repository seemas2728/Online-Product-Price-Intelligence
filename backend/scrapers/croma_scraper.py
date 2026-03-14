import random

def scrape_croma(product_name):
    print(f"Scraping Croma for {product_name}...")
    return [{
        "platform": "Croma",
        "store": "Croma",
        "price": f"₹{random.randint(1500, 50000)}.00",
        "product_name": product_name,
        "product_url": f"https://www.croma.com/search/?q={product_name.replace(' ', '%20')}",
        "image": ""
    }]
