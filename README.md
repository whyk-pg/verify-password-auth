# Verify Password Auth
<!-- ![Status: ToDo](https://flat.badgen.net/static/Status/ToDo/red) -->
![Status: In Progress](https://flat.badgen.net/static/Status/In%20Progress/yellow)
<!-- ![Status: Done](https://flat.badgen.net/static/Status/Done/green) -->

## 本リポジトリの目的
近々、個人的なシステムに使うJWTを使ったパスワードログインの保持を試したいから

## 本リポジトリの達成目標
- [x] シーケンス図を作成する
- [x] 要件を整理する
- [x] clientとserverのプロジェクトの初期化
- [x] ログイン機能の実装
- [x] 自動リフレッシュ機能の実装
- [x] ログアウト機能の実装
- [x] パスワードの暗号化
- [ ] 再認証時のコンテンツ取得エラー解決

### ここでやらないこと
client/server共にCloudflare前提だが、Cloudflare周りは検証しない

- Cloudflare D1を使ったデータのやり取り
- RemixのCloudflare Workers移行
- Service Bindings対応
- Cloudflareでのホスティング

## 遭遇した不具合
### Cookieがクライアントサイドに保存されない
当初、サーバーサイドでCookieを生成して`Set-Cookie`でクライアントサイドに送る実装をしていたが、クライアントサイドに保存されずにいた。  
そこで調べたり相談したりしていたところ、`Set-Cookie`を受け取っているのがRemixの[`action`](https://remix.run/docs/en/main/route/action)であり、そこはBFFつまりサーバー側であることから、サーバーでCookieが止まっているという指摘をもらった。  
実際、サーバー側の`Set-Cookie`の値を`action`から`Set-Cookie`で再送したら動作した。

なので、現在はサーバー側からJSONでトークンを受け取り、`action`でCookieを生成して`Set-Cookie`で送る実装に変えている。

### 認証トークン再取得直後にコンテンツ取得が失敗する
状態としては、認証トークンが失効してCookieから消えたあと、再読み込みをすると必ず認証に失敗してコンテンツが取れなくなる。  
予測だが、認証トークン再取得時点だとCookieには何も入らず、loaderを動かしてから`Set-Cookie`するものと思われる。そのため、いくらリトライ処理をしても（50回やっても）変わらなかった。

## 要件
### クライアントサイド
#### ヘッダー
- アクセストークンが失効しているないしない場合、右側にログインリンクが表示されていること
- アクセストークンが有効な場合、右側に本人のアイコンとログアウトリンクが表示されていること

#### 編集画面
- アクセストークンが失効しているないしない場合、ログイン画面に遷移すること
- アクセストークンが有効な場合、画面が表示されること

#### ログイン画面
- アクセストークンが執行しているないしない場合、ログインフォームがあること
- アクセストークンが有効な場合、ログイン済みであると表示されフォームが入力不可であること

### サーバーサイド
#### Login API
- Inはメアドとパスワード
- Outは特になし
- Cookieで新しく払い出されたアクセストークンを受け取る

#### Refresh Token API
- Inは特になし
- Outは特になし
- Cookieで新しく払い出されたアクセストークンを受け取る

### シーケンス図
```mermaid
sequenceDiagram
    participant Frontend as フロントエンド
    participant Backend as バックエンド
    participant DB as データベース
    
    %% ログインプロセス
    Frontend->>Backend: メールアドレスとパスワードを送信
    Backend->>DB: 認証情報を照合
    DB-->>Backend: 認証結果を返却
    
    alt 認証成功
        Backend->>Backend: JWTトークン（アクセス・リフレッシュ）生成
        Backend-->>Frontend: Set-Cookieヘッダーでトークンを返却
    else 認証失敗
        Backend-->>Frontend: 認証エラー返却
    end
    
    %% 通常のAPI呼び出し
    Frontend->>Backend: APIリクエスト（Authorizationヘッダー: Bearer アクセストークン）
    
    alt アクセストークン有効
        Backend->>Backend: トークン検証
        Backend->>DB: データ取得/更新
        DB-->>Backend: レスポンス
        Backend-->>Frontend: APIレスポンス
    else アクセストークン期限切れ
        Backend-->>Frontend: 401エラー
        
        %% トークンリフレッシュ
        Frontend->>Backend: リフレッシュトークンでトークン再生成リクエスト
        
        alt リフレッシュトークン有効
            Backend->>Backend: 新しいアクセストークン生成
            Backend-->>Frontend: 新しいアクセストークン返却
            
            %% 元のAPIリクエストを再試行
            Frontend->>Backend: APIリクエスト（新しいアクセストークン）
            Backend->>DB: データ取得/更新
            DB-->>Backend: レスポンス
            Backend-->>Frontend: APIレスポンス

        else リフレッシュトークン期限切れ
            Backend-->>Frontend: 401エラー
            
            %% モーダルでのログイン処理
            Frontend->>Frontend: ログインモーダルダイアログ表示
            Frontend->>Backend: モーダル内でログイン情報送信
            Backend->>DB: 認証情報を照合
            DB-->>Backend: 認証結果を返却
            Backend->>Backend: 新しいトークン生成
            Backend-->>Frontend: 新しいトークンを返却
            
            %% 編集内容の復元と元のリクエスト再試行
            Frontend->>Backend: 元のAPIリクエストを再試行
            Backend->>DB: データ取得/更新
            DB-->>Backend: レスポンス
            Backend-->>Frontend: APIレスポンス
        end
    end
```

## 参考資料
- [action | Remix](https://remix.run/docs/en/main/route/action)
- [Remixで認証機能を実装](https://zenn.dev/aono/articles/67e97342495ac6#%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3%E8%AA%8D%E8%A8%BC)
- [Cookie Helper - Hono](https://hono.dev/docs/helpers/cookie)
- [JWT Authentication Helper - Hono](https://hono.dev/docs/helpers/jwt)
- [Access-Control-Allow-Credentials - HTTP | MDN](https://developer.mozilla.org/ja/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Credentials)
- [Including credentials - Using the Fetch API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)
- [action | Remix](https://remix.run/docs/en/main/route/action)
- [Cookie | Remix](https://remix.run/docs/en/main/utils/cookies)
- [Request - Web API | MDN](https://developer.mozilla.org/ja/docs/Web/API/Request)
- [Remix基礎#7 認証とセッション管理｜K](https://note.com/_kustomstudio_/n/n50c80ab29cfa)
- [Sessions | Remix](https://remix.run/docs/en/main/utils/sessions)
- [env - Context - Hono](https://hono.dev/docs/api/context#env)
- [Honoで環境変数を扱う方法 - Quantumleap](https://blog.tkgstrator.work/posts/2024/09/env/)
