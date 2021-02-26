import os
import json
import random
import csv
from io import StringIO
from html.parser import HTMLParser
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import CountVectorizer
vectorizer = CountVectorizer(min_df=1)
from sklearn.feature_extraction.text import TfidfTransformer
transformer = TfidfTransformer()
from sklearn.cluster import KMeans
import numpy as np



# useful for ensuring paths are consistent. Use with os.path.join(SCRIPT_DIR, ...)
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

path = 'massmails.csv'

Emails = []  # A list of email dictionaries

cleaned_content = []  # A list of cleaned email content for generating corpus and keywords

# The number of emails for testing || Delete related parts before submission
test_number = 1000


# Load the raw emails from csv file
def load_mails(path):
    mails_contents = []  # A list of contents of all emails

    with open(path, 'r') as f:
        reader = csv.reader(f)

        testing = 0
        for row in reader:  # Each row is a list of the paragraphs in one email

            testing += 1  # Delete the following 3 lines before submission
            if testing >= test_number:
                print('Tested ' + str(testing - 1) + ' mails')
                break

            if len(row) <= 1:  # Deals with the empty rows at the bottom of the file
                testing -= 1
                continue

            raw = ''
            content = ''  # A temporary storage for email content
            for col in row:
                raw = raw + col
                soup = BeautifulSoup(str(col), "html.parser")
                content = content + str(soup.get_text())

            dic = {'raw': raw, 'content': content, 'vector': [], 'clusterId': 0}
            mails_contents.append(content)
            Emails.append(dic)

        # print(len(mails_contents))
        return mails_contents


def find_most_frequent_overall(counts):
    sumtest = [sum(x) for x in zip(*counts)]  # A list of the sums of the frequency of each word
    arr = np.array(sumtest)
    indices_list = arr.argsort()[-50:][::-1]  # A list of the index of the most frequent words
    print(indices_list)
    return indices_list


if __name__ == "__main__":
    # Load the mass mails
    cleaned_content = load_mails(path)
    corpus = cleaned_content.copy()
    X = vectorizer.fit_transform(corpus)
    counts = X.toarray()  # 2d array, vector of each email
    tfidf = transformer.fit_transform(counts)
    weights = tfidf.toarray();

    index_list = find_most_frequent_overall(weights)
    for i in index_list:
        print(vectorizer.get_feature_names()[i])

    # Vectorize each Email dictionary
    for mail in Emails:
        mail['vector'] = vectorizer.transform([mail['content']]).toarray()

    #print(Emails[0]['vector'][0][500])







    clusters = [{"id": 0, "label": "apple"}, {"id": 1, "label": "banana"}, {"id": 2, "label": "carrot"}]

    results = {
        "clusters": clusters,
        "emails": [
            {"embedding": {"x": random.random(), "y": random.random()}, "clusterId": random.choice(clusters)["id"]} for
            _ in range(10)
        ]
    };

    with open(os.path.join(SCRIPT_DIR, "data.json"), "w") as f:
        json.dump(results, f)



