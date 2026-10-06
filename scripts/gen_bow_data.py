"""Bag-of-visual-words histograms and retrieval similarities for BowLab (Module 35.6), computed with OpenCV 4.13
(cv2.SIFT_create, cv2.BOWKMeansTrainer, cv2.BOWImgDescriptorExtractor) on five existing sample images (a small
"database") and two existing transformed views used as queries: apps/web/public/data/bow-data.json
(fetched by the lab at run time)."""
import json
import cv2
import numpy as np

G = "assets/images/generated/"
DB = [("sample-poster.png", "poster"), ("sample-feat.png", "feature scene"), ("sample-scene.png", "scene"),
      ("sample-color.png", "colour scene"), ("sample-board.png", "board")]
QUERIES = [("sample-poster-b.png", "poster, transformed"), ("sample-feat-b.png", "feature scene, transformed")]
VOCAB_SIZE = 32

sift = cv2.SIFT_create()
imgs = {name: cv2.imread(G + name, cv2.IMREAD_GRAYSCALE) for name, _ in DB + QUERIES}
descs = {name: sift.detectAndCompute(im, None)[1] for name, im in imgs.items()}

trainer = cv2.BOWKMeansTrainer(VOCAB_SIZE)
for name, _ in DB:
    if descs[name] is not None:
        trainer.add(descs[name])
vocab = trainer.cluster()

bow = cv2.BOWImgDescriptorExtractor(sift, cv2.BFMatcher(cv2.NORM_L2))
bow.setVocabulary(vocab)

def bow_hist(im):
    kp = sift.detect(im, None)
    h = bow.compute(im, kp)
    return len(kp), h.flatten().tolist()

def cosine(a, b):
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

db_out = []
db_hists = {}
for name, label in DB:
    nkp, hist = bow_hist(imgs[name])
    db_hists[name] = hist
    db_out.append({"name": name, "label": label, "kp": nkp, "hist": [round(v, 4) for v in hist]})

q_out = {}
for name, label in QUERIES:
    nkp, hist = bow_hist(imgs[name])
    sims = {dbname: round(cosine(hist, db_hists[dbname]), 4) for dbname, _ in DB}
    q_out[name] = {"name": name, "label": label, "kp": nkp, "hist": [round(v, 4) for v in hist], "sims": sims}

out = {"vocabSize": VOCAB_SIZE, "db": db_out, "queries": q_out}
json.dump(out, open("apps/web/public/data/bow-data.json", "w"), separators=(",", ":"))
print("db keypoints:", {n: next(d["kp"] for d in db_out if d["name"] == n) for n, _ in DB})
print("query -> ranked db (desc):")
for name, label in QUERIES:
    ranked = sorted(q_out[name]["sims"].items(), key=lambda x: -x[1])
    print(" ", name, "->", ranked)
