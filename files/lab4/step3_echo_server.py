# Step 3：受け取った1行をそのまま送り返すエコーサーバ
import socket

PORT = 1102

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("", PORT))
server.listen()
print("待ち受けを開始しました。ポート" + str(PORT))

conn, addr = server.accept()
print("クライアントが接続しました。IPアドレス", addr[0])
reader = conn.makefile("r", encoding="utf-8")   # 1行ずつ読めるようにする

while True:
    line = reader.readline()        # 改行まで（1つのメッセージ）を受け取る
    if line == "":                  # 空なら相手が切断した
        break
    text = line.rstrip("\n")
    print("[受信]" + text)
    conn.sendall((text + "\n").encode("utf-8"))     # 最後に改行を付けて送り返す
    print("[送信]" + text)

print("クライアントが切断しました。")
conn.close()
server.close()
