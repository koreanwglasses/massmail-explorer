from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import re
import urllib
import time
import csv



# create a webdriver object and set options for headless browsing
options = Options()
options.headless = True
driver = webdriver.Chrome('C:/Users/shenq/AppData/Local/Microsoft/WindowsApps/chromedriver.exe', options=options)

# uses webdriver object to execute javascript code and get dynamically loaded webcontent


def get_js_soup(url, driver):
    driver.get(url)
    res_html = driver.execute_script('return document.body.innerHTML')
    soup = BeautifulSoup(res_html,'html.parser') # beautiful soup object to be used for parsing html content
    return soup

# tidies extracted text



''' More tidying
Sometimes the text extracted HTML webpage may contain javascript code and some style elements. 
This function removes script and style tags from HTML so that extracted text does not contain them.
'''

def remove_script(soup):
    for script in soup(["script", "style", "href"]):
        script.decompose()
    return soup




arc_url = 'https://massmail.illinois.edu/massmailArchive'


def scrape_archive(arc_url, driver):  # This function return a list of all the urls to the content of each massmail
    print('-' * 20, 'Scraping Archive page', '-' * 20)
    mail_links = []
    soup = get_js_soup(arc_url, driver)
    for link_holder in soup.find_all('span', class_='col3'):
        content_link = link_holder.find('a')['href']
        mail_links.append(content_link)
    print('-' * 20, 'Found {} mass mail urls'.format(len(mail_links)), '-' * 20)
    return mail_links


contentlinks = scrape_archive(arc_url, driver)

# Scrape each content url and write the content to a csv file
# Each row is one massmail, each column is one paragraph
def scrape_content(content_url, driver):
    # print('-' * 20, 'Scraping Content page', '-' * 20)
    content = []

    soup = get_js_soup(content_url, driver)
    #remove_script(soup)
    for paragraph in soup.find_all('p'):
        content.append(str(paragraph))
        # writer.writerow(str(paragraph))
        # print(str(paragraph).replace("<p>", ""))
    # print(content)
    return content


# scrape_content(contentlinks[0],driver)


writer = csv.writer(open("massmails.csv", "w", newline=''))


for link in contentlinks:
    print('writing')
    writer.writerow(scrape_content(link, driver))
    print(scrape_content(link, driver))
