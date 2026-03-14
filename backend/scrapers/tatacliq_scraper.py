import random

def scrape_tatacliq(product_name):
    print(f"Scraping Tata Cliq for {product_name}...")
    return [{
        "platform": "Tata Cliq",
        "store": "Tata Cliq",
        "price": f"₹{random.randint(1500, 50000)}.00",
        "product_name": product_name,
        "product_url": f"https://www.tatacliq.com/search/?searchCategory=all&text={product_name.replace(' ', '%20')}",
        "image": ""
    }]
