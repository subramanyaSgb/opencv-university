# OpenCV University: Project Specification

Version 1.0, 5 October 2026. Owner: Subramanya GB.

This file is the single source of truth for building OpenCV University. Read it fully before starting any task.

---

## 1. Vision

A web application that teaches image processing and computer vision with OpenCV from absolute zero to production level. A learner who completes it should understand every topic deeply: the intuition, the maths, the OpenCV API, the failure modes and the real-world use.

- **Audience:** engineers new to computer vision, starting with the Deevia team. Assume Python basics only.
- **Scope:** 12 parts, 66 modules, about 375 chapters (Section 5).
- **First release:** internal training platform. Keep the architecture ready to become a public product later (accounts, scale, branding), but do not build product-only features now.

---

## 2. Writing style (mandatory for every chapter)

Explanations must be **simple first, then deep**. Follow this reference exactly, written in a professional tone:

> **1. What is Image Processing?**
>
> Image processing = using a computer to manipulate or analyze an image.
>
> Think of an image as a huge collection of tiny squares called pixels.
>
> ```
> Image
>  ↓
> Pixels
>  ↓
> [ 23, 45, 67, 89, ... ]
> ```
>
> A computer doesn't see an image like we do. It sees numbers. For a grayscale image:
>
> ```
> 0   → black
> 128 → gray
> 255 → white
> ```
>
> So image processing means doing mathematical operations on those pixel numbers.

### Rules

1. **One-line definition first**, in the form "X = plain-language meaning".
2. **A plain analogy** before any technical term.
3. **A flow diagram** (text arrows ↓ →) showing input to output.
4. **Real numbers**: always show actual pixel values, before and after.
5. **One idea per paragraph.** Short sentences. No jargon without an immediate explanation.
6. **Step-by-step worked example** using a tiny image (3×3 or 5×5) the reader can follow by hand.
7. **Code only after understanding**: first NumPy from scratch (to see the logic), then the OpenCV call.
8. **Go deeper** sections hold the maths, edge cases and theory, so beginners can stop and engineers can continue.
9. Every claim about an algorithm, standard or paper must be correct and cited (Section 4, references).
10. Use emoji markers sparingly and consistently: ⚠️ for common mistakes, 🔍 for Go deeper, ✅ for Check yourself.

---

## 3. Chapter template

Every chapter is one MDX file with these sections, in this order:

1. **Title and one-line definition**
2. **Why it matters**: the real problem this solves (one short industrial or everyday example)
3. **The idea in pictures**: analogy, flow diagram, real numbers
4. **Step by step**: a worked example on a tiny image
5. **Interactive figure(s)**: the learner changes inputs and sees pixels and results change
6. **Code**: NumPy from scratch, then OpenCV; explain every parameter
7. **OpenCV API notes**: function signature, parameters, input types (dtype, channels), output, defaults, speed tips
8. **Where it is used**: 3 to 5 real applications (mix industrial and general)
9. **Where it fails**: limits and what to use instead
10. **⚠️ Common mistakes**
11. **🔍 Go deeper**: maths, derivations, variants, history
12. **✅ Check yourself**: 3 to 6 quiz questions with explanations
13. **Exercises**: 2 to 4, with hidden solutions; at least one coding exercise
14. **References**: textbooks, papers, OpenCV docs

---

## 4. Sources to rely on

- R. C. Gonzalez and R. E. Woods, *Digital Image Processing*, 4th ed.
- R. Szeliski, *Computer Vision: Algorithms and Applications*, 2nd ed.
- OpenCV official documentation (docs.opencv.org), matching the OpenCV version used in the code labs
- Original papers for named algorithms (Otsu 1979, Canny 1986, Lowe 2004 SIFT, Rublee 2011 ORB, Zuiderveld 1994 CLAHE, and so on)
- EMVA 1288 for camera and sensor characterisation

Never invent citations, numbers or API parameters. If unsure, mark the item `TODO: verify` for human review.

---

## 5. Curriculum: 12 parts, 66 modules

### Part A: Foundations

1. **Introduction to image processing**: 1.1 What is image processing? 1.2 Pixels and the image grid 1.3 Grayscale and colour values 1.4 Image processing vs computer vision 1.5 The three families of operations 1.6 Where vision is used in industry
2. **How cameras form images**: 2.1 Light and the pinhole camera 2.2 Lenses and focus 2.3 Aperture, depth of field, diffraction 2.4 Field of view and mm per pixel 2.5 The sensor and noise 2.6 Exposure and motion blur 2.7 Bayer filter and demosaicing 2.8 The ISP pipeline 2.9 Rolling shutter and flicker 2.10 Area-scan vs line-scan cameras
3. **Digital images**: 3.1 Sampling and resolution 3.2 Quantization and bit depth 3.3 Channels 3.4 Coordinates and indexing 3.5 Aliasing and Nyquist 3.6 Neighbours, connectivity, distance
4. **Formats and compression**: 4.1 Image size in bytes 4.2 Lossless vs lossy 4.3 How JPEG works 4.4 PNG, TIFF, 16-bit and raw 4.5 Video codecs and streams 4.6 Metadata and watermarking
5. **Maths for images**: 5.1 Images as matrices 5.2 Vectors and transforms 5.3 Homogeneous coordinates 5.4 Statistics (mean, variance, Gaussian) 5.5 Derivatives as differences 5.6 Least squares 5.7 Eigenvectors and SVD 5.8 Probability and Bayes
6. **Python and NumPy for images**: 6.1 Arrays, shape, dtype 6.2 Slicing and views 6.3 Overflow and type conversion 6.4 Vectorization vs loops 6.5 Plotting with matplotlib
7. **OpenCV basics**: 7.1 Installing and versions 7.2 Read, show, save 7.3 BGR vs RGB 7.4 Video and camera capture 7.5 Drawing and text 7.6 Mouse and trackbars 7.7 Measuring speed
8. **The OpenCV library in depth**: 8.1 Architecture and modules 8.2 The C++ API and cv::Mat 8.3 Python bindings and data types 8.4 Contrib modules 8.5 Building with CUDA, and cv2.cuda 8.6 UMat and OpenCL 8.7 The DNN module 8.8 G-API 8.9 OpenCV.js 8.10 Versions 4.x and 5.x
9. **Human vision and perception**: 9.1 How the eye sees 9.2 Brightness and Weber's law 9.3 Illusions and contrast 9.4 Colour perception and colour blindness 9.5 Colour maps for displays

### Part B: Colour and point operations

10. **Colour spaces**: 10.1 RGB and BGR 10.2 HSV 10.3 LAB and colour difference 10.4 YCrCb 10.5 Grayscale conversion 10.6 White balance and colour constancy 10.7 Colour detection with inRange
11. **Intensity transforms**: 11.1 Point operations and LUTs 11.2 Negative and log 11.3 Gamma 11.4 Contrast stretching 11.5 Level and bit-plane slicing
12. **Histograms**: 12.1 What a histogram shows 12.2 Equalization 12.3 CLAHE 12.4 Histogram matching 12.5 Back-projection 12.6 2D histograms
13. **Thresholding**: 13.1 Binary images 13.2 Global threshold 13.3 Otsu's method 13.4 Triangle and entropy methods 13.5 Adaptive (mean, Gaussian, Niblack, Sauvola) 13.6 Hysteresis and multi-level 13.7 Measuring quality
14. **Masks and arithmetic**: 14.1 Masks 14.2 Bitwise operations 14.3 Saturating vs wrapping arithmetic 14.4 Blending 14.5 Frame differencing
15. **Preprocessing pipelines**: 15.1 Why preprocess 15.2 Step order rules 15.3 Illumination correction 15.4 Preprocessing for OCR 15.5 Preprocessing for deep learning 15.6 Augmentation

### Part C: Spatial processing

16. **Geometric transforms**: 16.1 Translate, scale, rotate 16.2 Affine 16.3 Perspective 16.4 Interpolation 16.5 Remap and polar
17. **Convolution and kernels**: 17.1 What a kernel is 17.2 Convolution step by step 17.3 Borders and padding 17.4 Separable kernels 17.5 Integral images 17.6 filter2D
18. **Noise and smoothing**: 18.1 Noise types 18.2 Box and Gaussian 18.3 Median 18.4 Bilateral 18.5 Non-local means 18.6 Choosing a filter
19. **Sharpening and restoration**: 19.1 Unsharp mask 19.2 Laplacian sharpening 19.3 Blur models (PSF) 19.4 Wiener filter 19.5 Deconvolution 19.6 Super-resolution
20. **Pyramids and scale-space**: 20.1 Gaussian pyramid 20.2 Laplacian pyramid 20.3 Blending 20.4 Difference of Gaussians
21. **Image registration**: 21.1 Why align images 21.2 Phase correlation 21.3 ECC 21.4 Multi-camera and thermal-visible fusion

### Part D: Edges, shapes and segmentation

22. **Edge detection**: 22.1 What an edge is 22.2 Gradients (Sobel, Scharr) 22.3 Laplacian and LoG 22.4 Canny step by step 22.5 Sub-pixel edges
23. **Morphology**: 23.1 Erosion and dilation 23.2 Opening and closing 23.3 Top-hat and black-hat 23.4 Skeleton and thinning 23.5 Distance transform 23.6 Grayscale morphology
24. **Contours and shape analysis**: 24.1 Finding contours 24.2 Hierarchy 24.3 Area, perimeter, centroid 24.4 Bounding shapes 24.5 Convex hull and defects 24.6 Moments
25. **Connected components and blobs**: 25.1 Labelling 25.2 Region statistics 25.3 Blob detectors (LoG, MSER) 25.4 Counting objects
26. **Hough and model fitting**: 26.1 Hough lines 26.2 Hough circles 26.3 RANSAC 26.4 Line, circle, ellipse fitting
27. **Segmentation**: 27.1 Region growing 27.2 K-means 27.3 Mean shift 27.4 Watershed 27.5 GrabCut and graph cut 27.6 Superpixels
28. **Active contours**: 28.1 Snakes 28.2 Level sets
29. **Shape descriptors**: 29.1 Chain codes 29.2 Hu moments 29.3 Fourier descriptors 29.4 Shape matching

### Part E: Frequency domain

30. **Fourier transform**: 30.1 Images as waves 30.2 The DFT and spectrum 30.3 Low- and high-pass filters 30.4 Notch filters and periodic noise 30.5 Convolution theorem
31. **Other transforms**: 31.1 DCT and JPEG 31.2 Wavelets 31.3 Gabor filters 31.4 Radon and CT reconstruction
32. **Template matching**: 32.1 Sliding comparison 32.2 SSD and NCC 32.3 Multi-scale 32.4 Limits

### Part F: Features and recognition

33. **Interest points**: 33.1 What a good feature is 33.2 Harris 33.3 Shi-Tomasi 33.4 FAST
34. **Descriptors and matching**: 34.1 SIFT 34.2 ORB and BRIEF 34.3 AKAZE 34.4 Matching and ratio test 34.5 Homography 34.6 Stitching
35. **Texture, global descriptors and retrieval**: 35.1 LBP 35.2 GLCM 35.3 HOG 35.4 Haar features 35.5 Perceptual hashing 35.6 Bag of visual words and image retrieval
36. **Pattern classification**: 36.1 Features and classes 36.2 Bayes 36.3 kNN 36.4 SVM 36.5 Decision trees and random forests 36.6 Boosting and AdaBoost 36.7 PCA 36.8 Clustering
37. **Classical detection and faces**: 37.1 Sliding windows 37.2 Haar cascades 37.3 HOG + SVM 37.4 Non-max suppression 37.5 Face detection 37.6 Face recognition
38. **Markers, OCR and codes**: 38.1 ArUco and AprilTag 38.2 Character segmentation 38.3 OCR engines 38.4 Barcodes and QR

### Part G: Video

39. **Video fundamentals**: 39.1 Frames and FPS 39.2 Codecs and RTSP 39.3 FFmpeg and GStreamer 39.4 Hardware decoding 39.5 Latency and buffering 39.6 Multi-camera sync 39.7 Stabilization
40. **Motion and tracking**: 40.1 Frame differencing 40.2 Background subtraction 40.3 Optical flow 40.4 MeanShift and CamShift 40.5 Kalman filter 40.6 Particle filter 40.7 Counting and line crossing

### Part H: Camera geometry and 3D

41. **Camera model and calibration**: 41.1 Pinhole model 41.2 Intrinsics and extrinsics 41.3 Lens distortion 41.4 Chessboard calibration 41.5 Pose with PnP 41.6 Pixel to mm 41.7 Bird's-eye view (ground-plane homography) 41.8 Hand-eye and multi-camera calibration
42. **Depth sensing**: 42.1 Stereo 42.2 Epipolar geometry 42.3 Disparity 42.4 Structured light 42.5 Laser triangulation 42.6 Time of flight
43. **SfM and SLAM**: 43.1 Structure from motion 43.2 Visual odometry 43.3 SLAM basics
44. **3D reconstruction**: 44.1 Point clouds 44.2 Photometric stereo 44.3 Multi-view stereo
45. **Image-based rendering**: 45.1 Panoramas 45.2 Light fields 45.3 NeRF basics

### Part I: Specialised imaging

46. **Thermal imaging**: 46.1 Infrared basics 46.2 Emissivity 46.3 Radiometric data 46.4 NUC and calibration 46.5 Temperature measurement in ROIs 46.6 Palettes
47. **Other modalities**: 47.1 NIR and SWIR 47.2 Polarization 47.3 Multispectral 47.4 X-ray and medical
48. **Computational photography**: 48.1 HDR 48.2 Inpainting 48.3 Dehazing 48.4 Low-light enhancement
49. **Measurement and metrology**: 49.1 Calibration for measurement 49.2 Sub-pixel accuracy 49.3 Error analysis 49.4 Repeatability (gauge R&R)
50. **Image quality**: 50.1 PSNR and SSIM 50.2 SNR 50.3 Sharpness and focus metrics 50.4 MTF

### Part J: Deep learning for vision

51. **Neural network and CNN basics**: 51.1 Neurons and layers 51.2 Training and loss 51.3 Convolution layers as learned kernels 51.4 Pooling 51.5 Overfitting
52. **Deep learning in practice**: 52.1 PyTorch basics 52.2 Loss functions and optimizers 52.3 Training loops and curves 52.4 The Ultralytics YOLO workflow 52.5 Exporting models 52.6 Explainability with Grad-CAM
53. **Architectures**: 53.1 LeNet to ResNet 53.2 EfficientNet 53.3 Vision Transformers 53.4 Transfer learning
54. **Object detection**: 54.1 Boxes and IoU 54.2 Anchors and grids 54.3 How YOLO works 54.4 NMS and confidence 54.5 mAP 54.6 Training and tuning
55. **Segmentation and beyond**: 55.1 U-Net 55.2 Instance segmentation 55.3 SAM 55.4 Pose 55.5 Face recognition with deep learning 55.6 Anomaly detection
56. **Foundation and generative models**: 56.1 CLIP 56.2 DINO 56.3 GANs and diffusion 56.4 Synthetic data
57. **Deep tracking**: 57.1 SORT 57.2 DeepSORT 57.3 ByteTrack
58. **Datasets and training**: 58.1 Labelling 58.2 Splits 58.3 Augmentation 58.4 Metrics, confusion matrix, IoU and Dice 58.5 Data drift and active learning

### Part K: Engineering practice

59. **Hardware and lighting**: 59.1 Choosing a camera 59.2 Lens calculations 59.3 Lighting techniques 59.4 Filters 59.5 Interfaces and triggering 59.6 Industrial camera SDKs (GenICam, GigE Vision, pypylon, Harvester) 59.7 Line-scan cameras and encoders
60. **Production pipelines**: 60.1 Architecture 60.2 FastAPI services 60.3 Docker 60.4 Databases 60.5 PLC and alarm integration 60.6 Logging and testing
61. **Deployment and performance**: 61.1 ONNX 61.2 TensorRT and FP16 61.3 Batching 61.4 Multi-camera scaling 61.5 DeepStream 61.6 Profiling
62. **Model compression and edge**: 62.1 Quantization 62.2 Pruning 62.3 Distillation 62.4 Jetson and cv2.dnn
63. **Privacy and ethics**: 63.1 Monitoring people 63.2 Data protection 63.3 Responsible deployment
64. **Troubleshooting and decision guide**: 64.1 Which technique should I use? 64.2 My detection fails, why? 64.3 Debugging checklist

### Part L: Practice and reference

65. **Capstone projects**: 65.1 Object counting 65.2 Thermal monitoring 65.3 ID recognition 65.4 PPE detection 65.5 Defect detection 65.6 Dimension measurement
66. **Reference library**: 66.1 Glossary 66.2 OpenCV function index 66.3 Cheat sheets 66.4 Problem-to-technique index

---

## 6. Platform

### 6.1 Features (first release)

- Course map: parts → modules → chapters, with progress
- Chapter reader with a contents sidebar, interactive figures, code blocks with copy, collapsible Go deeper and solutions
- Quizzes with explanations; results saved per user
- Live demos running real OpenCV in the browser (OpenCV.js)
- Learner image upload for demos (processed in the browser only)
- Search across chapters and glossary
- Glossary and problem-to-technique index
- Light and dark theme, works well on phones
- Simple login (internal users) and a trainer view of team progress

### 6.2 Later features

- Code labs: run learner Python with real opencv-python in isolated containers, with auto-graded exercises
- Module assessments and completion certificates
- Public product features (sign-up, billing) only if decided later

### 6.3 Technology

- **Frontend:** Next.js (App Router) + TypeScript; MDX for chapters; a reusable component library for figures
- **Live demos:** OpenCV.js (WebAssembly), loaded once and cached
- **Backend (phase 2):** FastAPI + PostgreSQL; Docker Compose for local and server deployment
- **Code labs (phase 3):** FastAPI job runner launching sandboxed Docker containers (no network, CPU/memory/time limits)
- **Testing:** unit tests for figure logic, Playwright end-to-end tests for chapter pages, a content linter that checks every chapter has all template sections

### 6.4 Repository layout

```
opencv-university/
├── CLAUDE.md                 # rules for Claude Code (generated from this spec)
├── OPENCV_UNIVERSITY_SPEC.md # this file
├── content/
│   └── part-a/
│       └── 01-introduction/
│           ├── module.json   # title, summary, chapter order
│           └── 1.1-what-is-image-processing.mdx
├── apps/web/                 # Next.js app
│   └── components/figures/   # PixelGrid, Histogram, KernelSlider, ...
├── services/api/             # FastAPI (phase 2)
├── services/labs/            # code lab runner (phase 3)
├── assets/images/            # sample images with source and licence noted
└── docker-compose.yml
```

### 6.5 Interactive figure library (build once, reuse everywhere)

PixelGrid (click pixels, edit values), ImageCompare (before/after slider), HistogramView (with CDF and threshold line), CurveEditor (intensity transforms), KernelPlayground (convolution step by step), ColorSpaceExplorer, ThresholdLab, MorphologyLab, PipelineBuilder, RayDiagram (lens and pinhole), CameraSimulator, StepPlayer (algorithm stepping, e.g. Canny stages), Quiz, Exercise.

### 6.6 Sample images

Use generated images and openly licensed images first. Industrial images from customer sites may be used only after anonymisation and approval; record the source and licence of every image in `assets/images/SOURCES.md`.

---

## 7. Phases and definition of done

### Phase 0: Gold standard (about 1 week)

- Scaffold the repo and the Next.js app
- Build the chapter template, PixelGrid, ImageCompare and Quiz components
- Write **Chapter 1.1 What is image processing?** fully, following Sections 2 and 3
- Owner reviews and approves; this chapter becomes the reference for all others

### Phase 1: Platform core and Part A (2 to 3 weeks)

- Course map, chapter reader, search, glossary, theme, mobile layout
- OpenCV.js integration
- All Part A chapters

### Phase 2 onward: one part every 2 to 3 weeks

- Backend for login, progress and quiz results; trainer view
- Remaining parts in order, with new figure components as needed

### Phase 3: Code labs and assessments

### A chapter is done when

1. All 14 template sections are present (the content linter passes)
2. Every interactive figure works on desktop and phone
3. All code runs on the pinned OpenCV version and its output matches the text
4. References are real and checked
5. A technical reviewer on the team has approved it

---

## 8. How Claude Code should work on this project

- Work on **one chapter or one component per task**, then stop for review.
- Before writing a chapter, list its learning objectives and outline, then write.
- Run the app and tests after every change; never leave the build broken.
- Pin versions (Node, Next.js, OpenCV.js, opencv-python) and record them in `CLAUDE.md`.
- Ask before adding a new dependency or changing the architecture.
- Mark anything uncertain as `TODO: verify`; never guess facts.
