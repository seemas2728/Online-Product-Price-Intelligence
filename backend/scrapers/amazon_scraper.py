import random

def scrape_amazon(product_name):
    print(f"Scraping Amazon India for {product_name}...")
    return [{
        "platform": "Amazon India",
        "store": "Amazon India",
        "price": f"₹{random.randint(1500, 50000)}.00",
        "product_name": f"{product_name} (Amazon Choice)",
        "product_url": f"https://www.amazon.in/s?k={product_name.replace(' ', '+')}",
        "image": ""
    }]
