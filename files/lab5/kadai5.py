import cv2
import numpy as np


def find_box(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    brown = cv2.inRange(hsv, np.array([5, 80, 50]), np.array([20, 255, 200]))
    contours, hierarchy = cv2.findContours(brown, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    box = contours[0]
    for c in contours:
        if cv2.contourArea(c) > cv2.contourArea(box):
            box = c
    return box


img = cv2.imread("label_ok.png")
box = find_box(img)

center, size, angle = cv2.minAreaRect(box)
if angle > 45:
    angle = angle - 90
if angle < -45:
    angle = angle + 90
print("箱の傾き:", round(angle, 1), "度")

height = img.shape[0]
width = img.shape[1]
M = cv2.getRotationMatrix2D(center, angle, 1.0)
img = cv2.warpAffine(img, M, (width, height))

box = find_box(img)
box_mask = np.zeros((height, width), np.uint8)
cv2.drawContours(box_mask, [box], -1, 255, -1)
masked = cv2.bitwise_and(img, img, mask=box_mask)

x, y, w, h = cv2.boundingRect(box)
area = masked[y + h // 2 : y + h, x + w // 2 : x + w]

area_hsv = cv2.cvtColor(area, cv2.COLOR_BGR2HSV)
label = cv2.inRange(area_hsv, np.array([0, 0, 150]), np.array([179, 50, 255]))
white_pixels = cv2.countNonZero(label)
print("白い画素の数:", white_pixels)

if white_pixels > 100:
    print("判定: OK（ラベルあり）")
else:
    print("判定: NG（ラベルなし）")

cv2.imwrite("kadai5_masked.png", masked)
cv2.imwrite("kadai5_area.png", area)
