# 計算サーバのクライアント（基本課題）
# コメントの (1)〜(6) はレポートの図2（クライアントのフローチャート）の番号に対応する
import socket

HOST = "localhost"      # 2台で試すときはサーバのIPにする
PORT = 1102

# (1) サーバに接続する
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect((HOST, PORT))
reader = client.makefile("r", encoding="utf-8")
print("サーバに接続しました。")
print("式を入力してください（例: 45 + 84）。HISTORY で記録，exit で終わります。")

while True:
    # (2) キーボードから1行入力する
    text = input(">")

    # (3) 終了の合図？
    if text == "exit":
        break

    # (4) サーバへ送る
    client.sendall((text + "\n").encode("utf-8"))

    # (5) 返事を受け取って表示する（先頭の語で種類を見分ける）
    reply = reader.readline().rstrip("\n")
    if reply == "":
        print("サーバが切断しました。")
        break
    kind, body = reply.split(" ", 1)
    if kind == "ANS":
        print("答えは " + body + " です")
    elif kind == "ERR":
        print("エラー: " + body)
    elif kind == "HIST":
        count = int(body)
        print("これまでの計算（" + str(count) + " 件）")
        for i in range(count):
            print("  " + reader.readline().rstrip("\n"))

# (6) 接続を閉じる
client.close()
print("切断しました。")
