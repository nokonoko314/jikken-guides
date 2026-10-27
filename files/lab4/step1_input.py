# Step 1：キーボードから文字を読み込んで表示する
print("何か文字を入力してください。exit で終わります。")

while True:
    line = input(">")          # Enter が押されるまで，ここで止まって待つ
    if line == "exit":
        break
    print("[入力結果]", line)
