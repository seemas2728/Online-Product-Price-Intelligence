import requests
from bs4 import BeautifulSoup
import json

url = "https://www.walmart.com/search?q=laptop"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, "html.parser")
item = soup.select_one("div[data-item-id]")

print("Title Element:", item.select_one("span[data-automation-id='product-title']"))
print("Link Element:", item.select_one("a"))
print("Image Element:", item.select_one("img"))
print("All Spans Text:", [span.text for span in item.select("span")])
