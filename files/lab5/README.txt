第5回 コンピュータグラフィックス（OpenCV）手本のプログラム

■ 入っているもの
  kadai1.py  ひよこを数える
  kadai2.py  錠剤の数を数えて、8個ならOK・それ以外はNG
  kadai3.py  ギアの長さ（ピクセル）を測る
  kadai4.py  ノイズを消して棒の太さを測り、範囲に入っているか判定する
  kadai5.py  箱の傾きを直して、ラベルの有無を判定する
  sample_images/  動作確認用の見本画像（このページ用に作った絵。授業の画像ではない）

■ 動かし方
  1. pip install opencv-python numpy
  2. プログラムと同じフォルダに画像を置く
     ・まず試すなら、sample_images の中の画像をプログラムと同じ場所にコピーする
     ・授業の画像を使うなら、LMSから取った画像を置き、
       各プログラムの cv2.imread("…") のファイル名をその名前に書き換える
  3. python kadai1.py

■ 見本画像での結果
  kadai1.py  ひよこの数: 7
  kadai2.py  錠剤の数: 8 / 判定: OK   （tablet_ng.png にすると 7 / NG）
  kadai3.py  ギアの長さ: 263 ピクセル
  kadai4.py  太さ: 100 ピクセル / 判定: OK （noise_ng.png にすると 50 / NG）
  kadai5.py  判定: OK（ラベルあり）    （label_ng.png は NG、label_tilt.png は傾き 11.0 度で OK）

■ 数が合わないとき
  画像の大きさが違うと、面積のしきい値（3000 や 1000）が合わなくなる。
  for の中に print(area) を足して面積を表示し、しきい値を決め直す。

■ 注意
  OpenCV 5.0 / Python 3 で確認。スライド（OpenCV 3.4.2）とは findContours の戻り値の数が違う（3つ→2つ）。
  フォルダ名・ファイル名に日本語があると、画像を読み込めないことがある。
