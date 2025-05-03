# kakeibo
家計簿入力受付BOT


## 説明
家計後bot関連のコード
[スプシ](https://script.google.com/u/0/home/projects/1IRD1tXtALqpNAww-vPizeMsywrg8ak1WCjjU_JulBdLbekLFtDLoYyAg/edit)
↑が本番環境  

claspを利用しgithub管理している。

## claspについて
### 以下で必要な環境が整っているか確認

```
node -v
clasp -v
```

#### 必要に応じてインストール
nodeは公式サイトから  
claspは以下でインストール
```
npm install -g @google/clasp
```

#### コードの反映方法
1. `clasp login`でGoogleアカウントにログイン
2. `clasp push`で編集したコードをGAS環境に反映する
もしエラーが起きたら以下のサイトを参考に確認。
https://qiita.com/zumi0/items/a4dd6e00cad7ee341d77
