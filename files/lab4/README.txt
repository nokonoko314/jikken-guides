第4回 ネットワーク通信 手本のプログラム（Python 3）

【動かし方】PowerShell を2つ開き，サーバを先に起動する
  Step 1  python step1_input.py
  Step 2  python step2_server.py      → 別のウィンドウで python step2_client.py
  Step 3  python step3_echo_server.py → 別のウィンドウで python step3_echo_client.py
  計算    python calc_server.py       → 別のウィンドウで python calc_client.py

【2台のPCで試すとき】クライアントの HOST = "localhost" を，サーバのPCのIPに変える
【止めるとき】サーバのウィンドウで Ctrl + C

【計算サーバのプロトコル】1行が1つのメッセージ
  式（例 45 + 84）  → ANS 129
  HISTORY           → HIST 件数 の1行のあと，記録を件数ぶん1行ずつ
  書式の誤り・0除算 → ERR 理由

※ 理解するための手本です。ガイダンスでは，他人のプログラムをコピーするとその回は0点です。
   仕組みを理解したうえで，自分で書いたプログラムを提出してください。
