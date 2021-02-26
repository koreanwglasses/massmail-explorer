import os
import json
import random
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

# useful for ensuring paths are consistent. Use with os.path.join(SCRIPT_DIR, ...)
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

EMBEDDING_ALGORITHM = 'TSNE'
# EMBEDDING_ALGORITH = 'PCA'

# CLUSTERING_ALGORITHM = 'KMEANS'
CLUSTERING_ALGORITHM = 'DBSCAN'
# CLUSTERING_ALGORITHM = 'GAUSSMIX'

# number of clusters for k-means clustering
NUM_CLUSTERS = 10

# EPS for DBSCAN
# EPS = 0.4
EPS = 4

CLUSTER_AFTER_EMBEDDING = True

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
                "vector": doc.vector,
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

def compute_embeddings(X):
    if EMBEDDING_ALGORITHM == "TSNE":
        return TSNE(n_components=2).fit_transform(X)
    if EMBEDDING_ALGORITHM == "PCA":
        return PCA(n_components=2).fit_transform(X)


if __name__ == "__main__":
    # TODO: load and process massmails/emails

    # Load the mass mails and vectorize them
    massmails = list(load_massmails(os.path.join(SCRIPT_DIR, "massmails.csv")))

    X = np.stack([massmail["vector"] for massmail in massmails])
    
    email_embeddings = compute_embeddings(X)

    if CLUSTER_AFTER_EMBEDDING:
        num_clusters, email_cluster_id = compute_clusters(email_embeddings)
    else:
        num_clusters, email_cluster_id = compute_clusters(X)

    cluster_labels = [f"Cluster {i}" for i in range(num_clusters)]

    # Prepare data for output
    results = {
        "keywords": ["apple", "banana", "carrot"],
        "clusters": [{"id": id_, "label": label} for id_, label in enumerate(cluster_labels)],
        "emails": [
            {
                "content": massmail["text"],
                "clusterId": int(cluster_id),
                "embedding": {"x": float(embedding[0]), "y": float(embedding[1])} } for
            massmail, cluster_id, embedding  in zip(massmails, email_cluster_id, email_embeddings)
        ]
    };

    with open(os.path.join(SCRIPT_DIR, "data.json"), "w") as f:
        json.dump(results, f)
