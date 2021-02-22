import os
import json
import random

# useful for ensuring paths are consistent. Use with os.path.join(SCRIPT_DIR, ...)
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

if __name__ == "__main__":
  # TODO: load and process massmails/emails

  clusters = [ { "id": 0, "label": "apple" }, { "id": 1, "label": "banana" }, { "id": 2, "label": "carrot" } ]

  results = { 
    "emails": [
      { "embedding": { "x": random.random(), "y": random.random() }, "clusterId": random.choice(clusters)["id"] } for _ in range(10)
    ] 
  }; 

  with open(os.path.join(SCRIPT_DIR, "data.json"), "w") as f:
    json.dump(results, f)
    