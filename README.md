# 情報工学実験 手順書

4年 情報工学実験の作業手順を、回ごとにまとめたサイトです（GitHub Pages）。

```
index.html          一覧（年間予定と各回へのリンク）
labN.html           第N回の手順書
files/labN/         第N回の配布資料
assets/style.css    共通のデザイン
assets/app.js       ユーザ名・IPの書き換え、コピー、完了チェック、目次
```

## 回を追加するとき

1. `lab2.html` をコピーして `labN.html` を作り、`<body data-lab="labN">` と表題欄・本文を書き換える
2. 配布資料を `files/labN/` に置き、ページの「配布資料」に追加する
3. `index.html` の該当する行を `<a class="reg-row" href="labN.html">` に変える

コマンド中の `{{USER}}` と `{{IP}}` は、ページ上部の入力欄の値に自動で置き換わります。
