import cv2
import numpy as np

img = cv2.imread("hiyoko.png")
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

yellow = cv2.inRange(hsv, np.array([20, 100, 100]), np.array([35, 255, 255]))
white = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([179, 40, 245]))
mask = cv2.bitwise_or(yellow, white)

kernel = np.ones((5, 5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

contours, hierarchy = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

count = 0
for c in contours:
    area = cv2.contourArea(c)
    if area > 3000:
        count = count + 1
        cv2.drawContours(img, [c], -1, (0, 0, 255), 3)

print("ひよこの数:", count)
cv2.imwrite("kadai1_mask.png", mask)
cv2.imwrite("kadai1_result.png", img)
