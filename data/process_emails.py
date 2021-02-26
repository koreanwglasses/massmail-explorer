import os
import json
import random
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.cluster import KMeans
import numpy as np

# useful for ensuring paths are consistent. Use with os.path.join(SCRIPT_DIR, ...)
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

if __name__ == "__main__":
    # TODO: load and process massmails/emails

    # Load the mass mails and vectorize them

    keywords = ["apple", "banana", "carrot"]
    clusters = [{"id": i, "label": keyword} for i, keyword in enumerate(keywords)]

    results = {
        "clusters": clusters,
        "emails": [
            {"embedding": {"x": random.random(), "y": random.random()}, "clusterId": random.choice(clusters)["id"]} for
            _ in range(10)
        ]
    };

    with open(os.path.join(SCRIPT_DIR, "data.json"), "w") as f:
        json.dump(results, f)
