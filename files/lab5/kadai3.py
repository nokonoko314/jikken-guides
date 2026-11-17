import cv2

img = cv2.imread("gear.png")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

ret, binary = cv2.threshold(gray, 90, 255, cv2.THRESH_BINARY_INV)

contours, hierarchy = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

biggest = contours[0]
for c in contours:
    if cv2.contourArea(c) > cv2.contourArea(biggest):
        biggest = c

x, y, w, h = cv2.boundingRect(biggest)
print("ギアの長さ:", h, "ピクセル")

cv2.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 2)
cv2.imwrite("kadai3_binary.png", binary)
cv2.imwrite("kadai3_result.png", img)
