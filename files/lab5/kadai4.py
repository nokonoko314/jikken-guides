import cv2
import numpy as np

img = cv2.imread("noise_ok.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

ret, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV)

kernel = np.ones((25, 25), np.uint8)
clean = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

contours, hierarchy = cv2.findContours(clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

biggest = contours[0]
for c in contours:
    if cv2.contourArea(c) > cv2.contourArea(biggest):
        biggest = c

x, y, w, h = cv2.boundingRect(biggest)
print("太さ:", h, "ピクセル")

if 90 <= h and h <= 110:
    print("判定: OK")
else:
    print("判定: NG")

cv2.imwrite("kadai4_binary.png", binary)
cv2.imwrite("kadai4_clean.png", clean)
