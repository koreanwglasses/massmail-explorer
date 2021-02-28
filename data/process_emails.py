from nltk.corpus import stopwords
from matplotlib import pyplot as plt
import pandas as pd
import numpy as np
from sklearn.decomposition.pca import PCA
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfTransformer
import os
import json
import random
import csv
from io import StringIO
from html.parser import HTMLParser

import nltk
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import CountVectorizer
vectorizer = CountVectorizer(min_df=1)
transformer = TfidfTransformer()
nltk.download('stopwords')

all_stopwords = stopwords.words('english')
sw_list = ['the', 'to', 'on', 'of', 'be', 'in']
all_stopwords.extend(sw_list)

# useful for ensuring paths are consistent. Use with os.path.join(SCRIPT_DIR, ...)
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

path = os.path.join(SCRIPT_DIR, 'massmails.csv')

Emails = []  # A list of email dictionaries

Clusters = []  # A list of cluster dictionaries

cleaned_content = []  # A list of cleaned email content for generating corpus and keywords


# Load the raw emails from csv file
def load_mails(path):
    mails_contents = []  # A list of contents of all emails

    with open(path, 'r') as f:
        reader = csv.reader(f)

        for row in reader:  # Each row is a list of the paragraphs in one email

            if len(row) <= 1:  # Deals with the empty rows at the bottom of the file
                continue

            raw = ''
            content = ''  # A temporary storage for email content
            for col in row:
                raw = raw + col
                soup = BeautifulSoup(str(col), "html.parser")
                content = content + str(soup.get_text())

            dic = {'raw': raw, 'content': content,
                   'vector': [], 'clusterId': 0}
            mails_contents.append(content)
            Emails.append(dic)

        # print(len(mails_contents))
        return mails_contents


def find_most_frequent_overall(counts):
    # A list of the sums of the frequency of each word
    sumtest = [sum(x) for x in zip(*counts)]
    arr = np.array(sumtest)
    # A list of the index of the most frequent words
    indices_list = arr.argsort()[-50:][::-1]
    # print(indices_list)
    return indices_list


def graph_for_optimal_cluster_number(range, sample, X):
    # Determines the optimal number of cluster
    # From the plot, find the elbow and the corresponding number of cluster
    wcss = []
    for i in range(1, range):
        kmeans = KMeans(n_clusters=i, init='k-means++',
                        max_iter=sample, n_init=range, random_state=0)
        kmeans.fit(X)
        wcss.append(kmeans.inertia_)
    plt.plot(range(1, range), wcss)
    plt.title('Elbow Method')
    plt.xlabel('Number of clusters')
    plt.ylabel('WCSS')
    plt.show()


if __name__ == "__main__":
    # Load the mass mails
    cleaned_content = load_mails(path)
    corpus = cleaned_content.copy()
    X = vectorizer.fit_transform(corpus)
    counts = X.toarray()  # 2d array, vector of each email
    tfidf = transformer.fit_transform(counts)
    weights = tfidf.toarray()

    # For embedding
    pca = PCA(n_components=2).fit(X.todense())

    # Vectorize each Email dictionary
    for mail in Emails:
        vector = vectorizer.transform([mail['content']])
        mail['vector'] = vector.toarray()

        embedding = pca.transform(vector.todense())[0]
        mail['embedding'] = {"x": float(
            embedding[0]), "y": float(embedding[1])}

    # print(Emails[0]['vector'][0][500])

    # Set the number of cluster as 20 for now
    kmeans = KMeans(n_clusters=20, init='k-means++',
                    max_iter=len(counts), n_init=10, random_state=0).fit(tfidf)
    # pred_y = kmeans.fit_predict(tfidf)

    # The following line shows that the cluster_centers return a ordered list of the centers
    # print(kmeans.predict(kmeans.cluster_centers_))

    clu_ids = kmeans.predict(tfidf)
    clu_index = 0
    for mail in Emails:
        mail['clusterId'] = clu_ids[clu_index]
        clu_index += 1

    center_clu_index = 0
    # Find the most frequent/weighted word in the generated center-email
    center_vectors = kmeans.cluster_centers_
    for center in center_vectors:  # For each center email vector
        arr = np.array(center)
        # Find the indices for the top 20 weighted word
        indices_list = arr.argsort()[-20:][::-1]
        temp_list = []  # The list of the 20 most weighted words
        for index in indices_list:
            temp_list.append(vectorizer.get_feature_names()[index])

        # Remove the stop words from the list
        list_without_sw = [
            word for word in temp_list if not word in stopwords.words()]
        # print(list_without_sw)

        # Generating the dictionary of the cluster keywords
        for i in range(len(list_without_sw)):
            if list_without_sw[i].isnumeric():
                continue
            else:
                cluster_dic = {'id': center_clu_index,
                               'label': list_without_sw[i]}
                break
        center_clu_index += 1
        Clusters.append(cluster_dic)

    # clusters = [{"id": 0, "label": "apple"}, {"id": 1, "label": "banana"}, {"id": 2, "label": "carrot"}]

    results = {
        "clusters": Clusters,
        "emails": [{"content": email["content"], "clusterId": int(email["clusterId"]), "embedding": email["embedding"]} for email in Emails]
    }

    with open(os.path.join(SCRIPT_DIR, "data.json"), "w") as f:
        json.dump(results, f)
