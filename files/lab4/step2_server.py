# Step 2：受信だけをするサーバ（先に起動する）
import socket

PORT = 1102

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)   # IPv4・TCP のソケットを作る
server.bind(("", PORT))     # このPCのポート1102を使う（"" はこのPCのどのIPでも受ける）
server.listen()             # 待ち受けを始める
ip = socket.gethostbyname(socket.gethostname())
print("待ち受けを開始しました。IPアドレス", ip, "ポート" + str(PORT))

conn, addr = server.accept()    # 接続が来るまで待つ。来たら相手専用のソケット conn ができる
print("クライアントが接続しました。IPアドレス", addr[0])

data = conn.recv(1024)          # 届いたデータ（バイト列）を受け取る
print("[受信]" + data.decode("utf-8"))

conn.close()
server.close()
