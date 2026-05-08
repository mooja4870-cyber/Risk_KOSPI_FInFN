import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://finance.naver.com/sise/",
}

URL = "https://finance.naver.com/sise/sise_index_day.nhn"
params = {"code": "KOSPI", "page": 1}

response = requests.get(URL, headers=HEADERS, params=params)
soup = BeautifulSoup(response.text, "html.parser")

print("Checking Naver Finance KOSPI Index Day Page...")
for tr in soup.select("table.type_1 tr"):
    cols = [td.get_text(strip=True) for td in tr.select("td")]
    if len(cols) > 0 and "." in cols[0]:
        print(f"Row: {cols}")
