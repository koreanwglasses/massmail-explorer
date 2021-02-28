import os
import json
import random
from gensim.utils import tokenize
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.cluster import KMeans, DBSCAN
from sklearn.manifold import TSNE
from sklearn.decomposition.pca import PCA
from sklearn.mixture import GaussianMixture
import numpy as np
import csv
from ml_stripper import strip_tags
import spacy
import datetime
import itertools
import gensim

# useful for ensuring paths are consistent. Use with os.path.join(SCRIPT_DIR, ...)
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

REDUCTION_ALGORITHM = 'TSNE'
# REDUCTION_ALGORITH = 'PCA'

# CLUSTERING_ALGORITHM = 'KMEANS'
CLUSTERING_ALGORITHM = 'DBSCAN'
# CLUSTERING_ALGORITHM = 'GAUSSMIX'

# number of clusters for k-means clustering
NUM_CLUSTERS = 10

# EPS for DBSCAN
# EPS = 0.4
EPS = 5

# If true, clusters will be determined from the data after dimensionality
# reduction
CLUSTER_AFTER_REDUCTION = True

EXTRA_STOPS = []

nlp = spacy.load("en_core_web_lg")

def strip_tags2(line):
    '''
    modifies strip_tags to handle <br/>
    '''
    return '\n'.join([strip_tags(piece) for piece in line.split('<br/>')])

def load_massmails(csv_path):
    with open(csv_path) as f:
        for row in csv.reader(f):
            text = '\n'.join([strip_tags2(line) for line in row]).strip()

            doc = nlp(text)

            yield {
                "raw": '\n'.join(row),
                "text": text,
                "doc": doc,
                "time": datetime.datetime.now().timestamp() - random.randrange(0, 3.15e7) # TODO Use real dates
            }

def compute_clusters(X):
    if CLUSTERING_ALGORITHM == "KMEANS":
        kmeans = KMeans(n_clusters=NUM_CLUSTERS).fit(X)
        return NUM_CLUSTERS, kmeans.labels_
    if CLUSTERING_ALGORITHM == "DBSCAN":
        dbscan = DBSCAN(eps=EPS).fit(X)
        return np.max(dbscan.labels_) + 1, dbscan.labels_
    if CLUSTERING_ALGORITHM == 'GAUSSMIX':
        labels = GaussianMixture(n_components=NUM_CLUSTERS).fit_predict(X)
        return NUM_CLUSTERS, labels

def compute_cluster_labels(massmails, email_cluster_ids, extra_stops=EXTRA_STOPS):
    massmail_clusters = itertools.groupby(sorted(zip(email_cluster_ids, massmails), key=lambda x: x[0]), key=lambda x: x[0])

    tokenized_cluster_docs = {}
    for cluster_id, cluster in massmail_clusters:
        tokenized_docs = []
        for _, massmail in cluster:
            text = []
            for w in massmail["doc"]:
                if not w.is_stop and not w.is_punct and not w.like_num and w.lemma_ not in extra_stops and w.lemma_.isalpha():
                    text.append(w.lemma_.lower())
            tokenized_docs.append(text)
        tokenized_cluster_docs[cluster_id] = tokenized_docs

    all_docs = itertools.chain(*tokenized_cluster_docs.values())
    dictionary = gensim.corpora.Dictionary(all_docs)

    labels = []
    for cluster_id, tokenized_docs in tokenized_cluster_docs.items():
        bow_corpus = [dictionary.doc2bow(doc) for doc in tokenized_docs]
        tfidf = gensim.models.TfidfModel(bow_corpus)
        corpus_tfidf = tfidf[bow_corpus]
        lda_model_tfidf = gensim.models.LdaMulticore(corpus_tfidf, num_topics=2, id2word=dictionary, passes=2, workers=4)

        topics = [lda_model_tfidf.show_topic(i)[0][0].title() for i in range(lda_model_tfidf.num_topics)]
        labels.append((cluster_id, '/'.join(topics)))

    return labels        

def compute_embeddings(X):
    if REDUCTION_ALGORITHM == "TSNE":
        return TSNE(n_components=2).fit_transform(X)
    if REDUCTION_ALGORITHM == "PCA":
        return PCA(n_components=2).fit_transform(X)


if __name__ == "__main__":
    # TODO: load and process massmails/emails

    # Load the mass mails and vectorize them
    massmails = list(load_massmails(os.path.join(SCRIPT_DIR, "massmails.csv")))

    X = np.stack([massmail["doc"].vector for massmail in massmails])
    
    email_embeddings = compute_embeddings(X)

    if CLUSTER_AFTER_REDUCTION:
        num_clusters, email_cluster_ids = compute_clusters(email_embeddings)
    else:
        num_clusters, email_cluster_ids = compute_clusters(X)

    cluster_labels = compute_cluster_labels(massmails, email_cluster_ids)

    # Prepare data for output
    results = {
        "keywords": ["apple", "banana", "carrot"],
        "clusters": [{"id": int(id_), "label": label} for id_, label in cluster_labels],
        "emails": [
            {
                "content": massmail["text"],
                "clusterId": int(cluster_id),
                "embedding": {"x": float(embedding[0]), "y": float(embedding[1])} } for
            massmail, cluster_id, embedding  in zip(massmails, email_cluster_ids, email_embeddings)
        ]
    };

    with open(os.path.join(SCRIPT_DIR, "data.json"), "w") as f:
        json.dump(results, f)
