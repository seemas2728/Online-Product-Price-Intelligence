import random

def scrape_flipkart(product_name):
    print(f"Scraping Flipkart for {product_name}...")
    return [{
        "platform": "Flipkart",
        "store": "Flipkart",
        "price": f"₹{random.randint(1500, 50000)}.00",
        "product_name": f"{product_name} (Assured)",
        "product_url": f"https://www.flipkart.com/search?q={product_name.replace(' ', '+')}",
        "image": ""
    }]
