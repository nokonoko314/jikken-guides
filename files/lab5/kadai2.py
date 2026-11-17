import cv2
import numpy as np

img = cv2.imread("tablet_ok.png")
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

mask = cv2.inRange(hsv, np.array([0, 40, 150]), np.array([20, 255, 255]))

kernel = np.ones((5, 5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

contours, hierarchy = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

count = 0
for c in contours:
    area = cv2.contourArea(c)
    if area > 1000:
        count = count + 1
        cv2.drawContours(img, [c], -1, (0, 255, 0), 2)

print("錠剤の数:", count)
if count == 8:
    print("判定: OK")
else:
    print("判定: NG")

cv2.imwrite("kadai2_result.png", img)
