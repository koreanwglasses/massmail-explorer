import os
import json

# useful for ensuring paths are consistent. Use with os.path.join(SCRIPT_DIR, ...)
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

if __name__ == "__main__":
  # TODO: load and process massmails/emails

  results = { 
    "emails": [
      { "embedding": { "x": 0.6, "y": 0.1 } },
      { "embedding": { "x": 0.8, "y": 0.2 } },
      { "embedding": { "x": 0.2, "y": 0.5 } }
    ] 
  }; 

  with open(os.path.join(SCRIPT_DIR, "data.json"), "w") as f:
    json.dump(results, f)
    