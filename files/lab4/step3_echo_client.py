# Step 3：キーボードから入力した文字を送り，返事を受け取るクライアント
import socket

HOST = "localhost"
PORT = 1102

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect((HOST, PORT))
print("サーバに接続しました。IPアドレス", HOST, "ポート" + str(PORT))
reader = client.makefile("r", encoding="utf-8")

print("文字列を入力してください。exit で終わります。")
while True:
    text = input(">")
    if text == "exit":
        break
    client.sendall((text + "\n").encode("utf-8"))   # 送る（改行が区切り）
    print("[送信]" + text)
    reply = reader.readline()                       # 返事が来るまで待つ
    if reply == "":
        print("サーバが切断しました。")
        break
    print("[受信]" + reply.rstrip("\n"))

client.close()
print("切断しました。")
