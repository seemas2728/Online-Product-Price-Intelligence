import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, "backend"))

from scrapers.walmart_scraper import scrape_walmart

print(scrape_walmart("laptop"))
