# Step 2：送信だけをするクライアント（サーバのあとに起動する）
import socket

HOST = "localhost"      # 2台で試すときはサーバのIPにする（例 "192.168.0.25"）
PORT = 1102

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect((HOST, PORT))    # サーバに接続する
print("サーバに接続しました。IPアドレス", HOST, "ポート" + str(PORT))

message = "Hello World"
client.sendall(message.encode("utf-8"))     # 文字列をバイト列にして送る
print("[送信]" + message)

client.close()
print("切断しました。")
