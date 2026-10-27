# 計算サーバ（基本課題）
# コメントの (1)〜(10) はレポートの図1（サーバのフローチャート）の番号に対応する
#
# プロトコル（1行が1つのメッセージ。クライアントが1行送ると，サーバが返事をする）
#   式（例 45 + 84）  → ANS 129
#   HISTORY           → HIST 件数 の1行のあと，記録を件数ぶん1行ずつ
#   書式の誤り・0除算 → ERR 理由
import re
import socket

PORT = 1102
PATTERN = r"-?\d+ [+\-*/] -?\d+"    # 整数 空白 演算子 空白 整数

history = []    # 式と結果の記録（サーバが動いている間だけ残る）


def send(conn, text):
    """1行送る（最後に改行を付ける）"""
    conn.sendall((text + "\n").encode("utf-8"))
    print("[送信]" + text)


def calc(expr):
    """式を計算して，返事の1行を作る"""
    # (7) 式の書式は正しい？
    if not re.fullmatch(PATTERN, expr):
        # (8) エラーを返す
        return "ERR 書式が正しくありません（例: 45 + 84）"

    # (9) 計算して記録に追加する
    a, op, b = expr.split(" ")
    a = int(a)
    b = int(b)
    if op == "+":
        ans = a + b
    elif op == "-":
        ans = a - b
    elif op == "*":
        ans = a * b
    else:
        if b == 0:
            return "ERR 0 で割ることはできません"
        ans = a // b        # 整数の割り算（小数点以下は小さい方へ切り捨て）
    history.append(expr + " = " + str(ans))
    return "ANS " + str(ans)


# (1) ポート1102で待ち受けを始める
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("", PORT))
server.listen()
print("待ち受けを開始しました。ポート" + str(PORT))

while True:
    # (2) クライアントの接続を待つ
    conn, addr = server.accept()
    print("クライアントが接続しました。IPアドレス", addr[0])
    reader = conn.makefile("r", encoding="utf-8")

    while True:
        # (3) 1行受信する
        line = reader.readline()

        # (4) 切断された？（受け取ったものが空）
        if line == "":
            break
        expr = line.rstrip("\n")
        print("[受信]" + expr)

        # (5) HISTORY？
        if expr == "HISTORY":
            # (6) 記録の一覧を送る（はじめに件数，続けて1件ずつ）
            send(conn, "HIST " + str(len(history)))
            for h in history:
                send(conn, h)
        else:
            # (7)〜(9) は calc の中
            send(conn, calc(expr))

    # (10) 接続を閉じて，次のクライアントを待つ
    print("クライアントが切断しました。")
    conn.close()
