import numpy as np
import itertools
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

def force_layout(emails, num_iter=1000):
  n = len(emails)

  cluster_ids = set(email["clusterId"] for email in emails)

  labels = np.array([email["clusterId"] for email in emails])
  
  pos = np.array([[email["embedding"]["x"], email["embedding"]["y"]] for email in emails])
  vel = np.zeros(pos.shape) 

  def step(dt, damping=1, attraction=1, repulsion=0.1, max_speed=10):
    nonlocal pos, vel, labels 

    acc = np.zeros(pos.shape) 
    for cluster_id in cluster_ids:
      positions_in_cluster = pos[labels == cluster_id, :]
      centroid = np.mean(positions_in_cluster, axis=0)
      acc[labels == cluster_id, :] += attraction * (centroid - positions_in_cluster) / np.linalg.norm(centroid - positions_in_cluster, axis=1)[:, None]

    # r[i][j] = pos[j] - pos[i]
    r = pos[None, :, :] - pos[:, None, :]

    repulsion_forces = -repulsion * r / np.linalg.norm(r, axis=2)[:, :, None]**2
    repulsion_forces = np.nan_to_num(repulsion_forces)
    acc += np.sum(repulsion_forces, axis=1)
 
    acc += -damping * vel

    speed = np.linalg.norm(vel, axis=1)
    vel[speed > max_speed, :] = max_speed * vel[speed > max_speed, :] / speed[speed > max_speed, None]

    vel += acc * dt
    pos += vel * dt 

  for _ in range(num_iter):
    step(0.1)

  return pos

if __name__ == "__main__":
  with open(os.path.join(SCRIPT_DIR, "data.1.json")) as f:
    data = json.load(f)
    emails = data["emails"]
    pos = force_layout(emails)

  for i, email in enumerate(emails):
    email["embedding"] = {"x": pos[i][0], "y": pos[i][1]}

  with open(os.path.join(SCRIPT_DIR, "data.json"), "w") as f:
    json.dump(data, f)

